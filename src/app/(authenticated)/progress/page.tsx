import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProgressPercent } from "@/lib/utils";
import { RefreshCw, ExternalLink } from "lucide-react";
import RefreshStatsButton from "./RefreshStatsButton";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: stats } = await supabase.from("leetcode_stats").select("*").eq("user_id", user.id).maybeSingle();

  const totalAll = (stats?.total_easy ?? 0) + (stats?.total_medium ?? 0) + (stats?.total_hard ?? 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-lc-text">Progress</h1>
          <p className="text-lc-muted text-sm mt-1">Your LeetCode stats</p>
        </div>
        {profile?.leetcode_username && (
          <div className="flex items-center gap-3">
            <RefreshStatsButton userId={user.id} leetcodeUsername={profile.leetcode_username} />
            <a
              href={`https://leetcode.com/${profile.leetcode_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-lc-muted hover:text-lc-text transition-colors"
            >
              <ExternalLink size={14} />
              View on LeetCode
            </a>
          </div>
        )}
      </div>

      {!profile?.leetcode_username ? (
        <div className="bg-lc-surface border border-lc-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-lc-text font-semibold text-lg mb-2">Connect your LeetCode account</h2>
          <p className="text-lc-muted text-sm mb-5">Add your LeetCode username in your profile to start tracking progress.</p>
          <Link
            href="/profile"
            className="bg-lc-accent text-lc-bg font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Go to Profile
          </Link>
        </div>
      ) : !stats ? (
        <div className="bg-lc-surface border border-lc-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-lc-text font-semibold text-lg mb-2">Fetching your stats…</h2>
          <p className="text-lc-muted text-sm">This may take a moment on first load.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Solved" value={stats.total_solved} total={totalAll} accent="text-lc-text" />
            <SummaryCard label="Easy" value={stats.easy_solved} total={stats.total_easy} accent="text-lc-easy" />
            <SummaryCard label="Medium" value={stats.medium_solved} total={stats.total_medium} accent="text-lc-medium" />
            <SummaryCard label="Hard" value={stats.hard_solved} total={stats.total_hard} accent="text-lc-hard" />
          </div>

          {/* Progress Bars */}
          <div className="bg-lc-surface border border-lc-border rounded-xl p-6">
            <h2 className="text-lc-text font-semibold mb-5">Breakdown by Difficulty</h2>
            <div className="space-y-5">
              <DetailBar label="Easy" solved={stats.easy_solved} total={stats.total_easy} barColor="bg-lc-easy" textColor="text-lc-easy" />
              <DetailBar label="Medium" solved={stats.medium_solved} total={stats.total_medium} barColor="bg-lc-medium" textColor="text-lc-medium" />
              <DetailBar label="Hard" solved={stats.hard_solved} total={stats.total_hard} barColor="bg-lc-hard" textColor="text-lc-hard" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-lc-surface border border-lc-border rounded-xl p-5 text-center">
              <div className="text-2xl font-bold font-mono text-lc-text">{stats.acceptance_rate}%</div>
              <div className="text-xs text-lc-muted mt-1">Acceptance Rate</div>
            </div>
            <div className="bg-lc-surface border border-lc-border rounded-xl p-5 text-center">
              <div className="text-2xl font-bold font-mono text-lc-text">
                #{stats.ranking > 0 ? stats.ranking.toLocaleString() : "—"}
              </div>
              <div className="text-xs text-lc-muted mt-1">Global Ranking</div>
            </div>
            <div className="bg-lc-surface border border-lc-border rounded-xl p-5 text-center">
              <div className="text-2xl font-bold font-mono text-lc-text">{stats.contribution_points}</div>
              <div className="text-xs text-lc-muted mt-1">Contribution Points</div>
            </div>
          </div>

          <p className="text-xs text-lc-muted text-right">
            Last synced: {new Date(stats.last_fetched).toLocaleString()} · Auto-refreshes every 24h
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, total, accent }: { label: string; value: number; total: number; accent: string }) {
  return (
    <div className="bg-lc-surface border border-lc-border rounded-xl p-4">
      <div className={`text-2xl font-bold font-mono ${accent}`}>{value}</div>
      <div className="text-xs text-lc-muted mt-1">{label}</div>
      <div className="text-xs text-lc-muted/60">of {total}</div>
    </div>
  );
}

function DetailBar({ label, solved, total, barColor, textColor }: {
  label: string; solved: number; total: number; barColor: string; textColor: string;
}) {
  const pct = getProgressPercent(solved, total);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        <span className="text-sm font-mono text-lc-text">
          {solved} <span className="text-lc-muted text-xs">/ {total}</span>
          <span className="ml-2 text-lc-muted text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-lc-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
