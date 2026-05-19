import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

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
      <div className="p-6 md:p-8 max-w-3xl mx-auto page-enter">
        <div className="glass-card !p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-cc-muted">User not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto page-enter">
      <div className="mb-8">
        <div className="flex items-center gap-5 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-2xl font-bold shadow-glow-md">
            {(user.display_name || user.username)?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cc-text">{user.display_name || user.username}</h1>
            <p className="text-sm text-cc-muted font-mono">@{user.username}</p>
            {user.leetcode_username && (
              <p className="text-xs mt-1.5 flex items-center gap-1">
                <span className="text-cc-muted">LeetCode:</span>
                <a
                  className="text-cc-accent-light hover:underline flex items-center gap-1"
                  href={`https://leetcode.com/${user.leetcode_username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{user.leetcode_username}
                  <ExternalLink size={10} />
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card !p-6">
        <h2 className="text-cc-text font-semibold text-lg mb-4">LeetCode Stats</h2>
        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cc-bg/40 border border-cc-border/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-cc-text">{stats.total_solved}</div>
              <div className="text-xs text-cc-muted mt-1">Problems Solved</div>
            </div>
            <div className="bg-cc-bg/40 border border-cc-border/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-cc-accent-light">{stats.acceptance_rate}%</div>
              <div className="text-xs text-cc-muted mt-1">Acceptance</div>
            </div>
            <div className="bg-cc-bg/40 border border-cc-border/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono gradient-text">#{stats.ranking}</div>
              <div className="text-xs text-cc-muted mt-1">Ranking</div>
            </div>
            <div className="bg-cc-bg/40 border border-cc-border/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-cc-cyan">{stats.contribution_points}</div>
              <div className="text-xs text-cc-muted mt-1">Contribution Points</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-cc-muted text-sm">This user has not linked their LeetCode account.</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/friends" className="flex items-center gap-1.5 text-sm text-cc-accent-light hover:text-cc-accent transition-colors">
          <ArrowLeft size={14} />
          Back to Friends
        </Link>
      </div>
    </div>
  );
}
