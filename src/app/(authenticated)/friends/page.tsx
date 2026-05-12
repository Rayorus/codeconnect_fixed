import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Ensure user profile exists (in case trigger didn't fire)
  try {
    await ensureUserProfile(user.id, user.email || "", {
      username: user.user_metadata?.username,
      display_name: user.user_metadata?.display_name,
    });
  } catch (err) {
    console.error("Failed to ensure profile:", err);
    // Continue anyway - profile might still exist
  }

  const [friendsRes, requestsRes] = await Promise.all([
    supabase
      .from("friends")
      .select("id, friend_id, created_at, friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url, leetcode_username)")
      .eq("user_id", user.id),
    supabase
      .from("friend_requests")
      .select("id, sender_id, status, created_at, sender:users!friend_requests_sender_id_fkey(id, username, display_name, avatar_url)")
      .eq("receiver_id", user.id)
      .eq("status", "pending"),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FriendsClient
        currentUserId={user.id}
        friends={(friendsRes.data as any) || []}
        pendingRequests={(requestsRes.data as any) || []}
      />
    </div>
  );
}
