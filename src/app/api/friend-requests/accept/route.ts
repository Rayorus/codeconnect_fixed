import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: fr } = await supabase.from("friend_requests").select("*").eq("id", requestId).single();
    if (!fr) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (fr.receiver_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    // Mark request accepted as the authenticated user (RLS allows this)
    const { error: updateErr } = await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Use service role client to insert reciprocal friendship rows bypassing RLS safely
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const entries = [
      { user_id: user.id, friend_id: fr.sender_id },
      { user_id: fr.sender_id, friend_id: user.id },
    ];

    const { error: insertErr } = await service.from("friends").upsert(entries, { onConflict: "user_id,friend_id" });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
