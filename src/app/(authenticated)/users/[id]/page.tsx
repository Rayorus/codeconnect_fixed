import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function UserInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, leetcode_username")
    .eq("id", id)
    .maybeSingle();

  const { data: stats } = await supabase
    .from("leetcode_stats")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-lc-muted">User not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{user.display_name || user.username}</h1>
        <p className="text-sm text-lc-muted">@{user.username}</p>
        {user.leetcode_username && (
          <p className="text-xs mt-2">LeetCode: <a className="text-lc-accent" href={`https://leetcode.com/${user.leetcode_username}`} target="_blank" rel="noreferrer">@{user.leetcode_username}</a></p>
        )}
      </div>

      <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
        <h2 className="text-lc-text font-semibold mb-3">LeetCode Stats</h2>
        {stats ? (
          <div className="space-y-2 text-sm">
            <div>Problems solved: <strong className="font-mono">{stats.total_solved}</strong></div>
            <div>Acceptance: <strong className="font-mono">{stats.acceptance_rate}%</strong></div>
            <div>Ranking: <strong className="font-mono">#{stats.ranking}</strong></div>
            <div>Contribution points: <strong className="font-mono">{stats.contribution_points}</strong></div>
          </div>
        ) : (
          <p className="text-lc-muted text-sm">This user has not linked their LeetCode account.</p>
        )}
      </div>

      <div className="mt-4">
        <Link href="/friends" className="text-sm text-lc-accent hover:underline">Back to Friends</Link>
      </div>
    </div>
  );
}
