import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { receiverId } = await req.json();
    if (!receiverId) return NextResponse.json({ error: "receiverId required" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const senderId = user.id;
    if (senderId === receiverId) return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });

    // Create service client for profile verification/creation
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Ensure sender profile exists (in case trigger didn't fire)
    const { data: senderExists } = await service
      .from("users")
      .select("id")
      .eq("id", senderId)
      .maybeSingle();

    if (!senderExists) {
      // Profile doesn't exist, create it from auth user
      const { error: createErr } = await service.from("users").insert({
        id: senderId,
        email: user.email || `${senderId}@noemail.com`,
        username: user.user_metadata?.username || senderId.slice(0, 8),
        display_name: user.user_metadata?.display_name || null,
      });
      if (createErr && !createErr.message.includes("duplicate")) {
        return NextResponse.json({ error: `Failed to create profile: ${createErr.message}` }, { status: 500 });
      }
    }

    // Ensure receiver profile exists
    const { data: receiverExists } = await service
      .from("users")
      .select("id")
      .eq("id", receiverId)
      .maybeSingle();

    if (!receiverExists) {
      return NextResponse.json({ error: "Recipient user profile not found" }, { status: 400 });
    }

    // Check if already friends
    const { data: friendsExist } = await supabase
      .from("friends")
      .select("id")
      .or(
        `and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`
      )
      .limit(1);
    if (friendsExist && friendsExist.length > 0) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Check existing friend_requests between users
    const { data: existingReq } = await supabase
      .from("friend_requests")
      .select("id, sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .limit(1);

    if (existingReq && existingReq.length > 0) {
      const req0 = existingReq[0];
      if (req0.sender_id === senderId) {
        return NextResponse.json({ error: "Request already sent" }, { status: 400 });
      }
      // If other user already sent a request to current user, accept it server-side
      if (req0.sender_id === receiverId && req0.receiver_id === senderId) {
        // accept: mark request accepted and create reciprocal friends rows
        const { error: updateErr } = await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", req0.id);
        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

        const entries = [
          { user_id: senderId, friend_id: receiverId },
          { user_id: receiverId, friend_id: senderId },
        ];

        const { error: insertErr } = await service.from("friends").upsert(entries, { onConflict: "user_id,friend_id" });
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        // cleanup any requests between them
        await service
          .from("friend_requests")
          .delete()
          .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`);

        return NextResponse.json({ success: true, message: "Accepted existing request and created friendship" });
      }
    }

    // Use upsert to avoid unique constraint failures in race conditions
    const { data, error } = await service
      .from("friend_requests")
      .upsert(
        { sender_id: senderId, receiver_id: receiverId, status: "pending" },
        { onConflict: "sender_id,receiver_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
