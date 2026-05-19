import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  try {
    await ensureUserProfile(user.id, user.email || "", {
      username: user.user_metadata?.username,
      display_name: user.user_metadata?.display_name,
    });
  } catch (err) {
    console.error("Failed to ensure profile:", err);
  }

  const [friendsRes, requestsRes, myStatsRes] = await Promise.all([
    supabase
      .from("friends")
      .select("id, friend_id, created_at, friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url, leetcode_username)")
      .eq("user_id", user.id),
    supabase
      .from("friend_requests")
      .select("id, sender_id, status, created_at, sender:users!friend_requests_sender_id_fkey(id, username, display_name, avatar_url)")
      .eq("receiver_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("leetcode_stats")
      .select("user_id, total_solved, easy_solved, medium_solved, hard_solved, total_easy, total_medium, total_hard, ranking")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Fetch LeetCode stats for all friends
  const friendIds = (friendsRes.data || []).map((f: any) => f.friend_id);
  let friendStatsMap: Record<string, any> = {};
  if (friendIds.length > 0) {
    const { data: friendStats } = await supabase
      .from("leetcode_stats")
      .select("user_id, total_solved, easy_solved, medium_solved, hard_solved, total_easy, total_medium, total_hard, ranking")
      .in("user_id", friendIds);
    if (friendStats) {
      for (const s of friendStats) friendStatsMap[s.user_id] = s;
    }
  }

  return (
    <div className="p-4 pt-14 md:pt-6 md:p-8 max-w-5xl w-full mx-auto">
      <FriendsClient
        currentUserId={user.id}
        friends={(friendsRes.data as any) || []}
        pendingRequests={(requestsRes.data as any) || []}
        friendStats={friendStatsMap}
        myStats={myStatsRes.data as any}
      />
    </div>
  );
}
