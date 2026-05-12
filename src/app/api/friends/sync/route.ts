import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userA, userB } = await req.json();
    if (!userA || !userB) return NextResponse.json({ error: "userA and userB required" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Only allow caller if they are one of the users involved
    if (user.id !== userA && user.id !== userB) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const entries = [
      { user_id: userA, friend_id: userB },
      { user_id: userB, friend_id: userA },
    ];

    const { error } = await service.from("friends").upsert(entries, { onConflict: "user_id,friend_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Clean up any pending friend_requests between the two users (either direction)
    const { error: delErr } = await service
      .from("friend_requests")
      .delete()
      .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
