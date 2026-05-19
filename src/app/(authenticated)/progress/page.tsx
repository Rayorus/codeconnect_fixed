import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProgressPercent } from "@/lib/utils";
import {
  TrendingUp, ExternalLink, Code2, Flame, Trophy,
  BarChart3, Target, Award
} from "lucide-react";
import RefreshStatsButton from "./RefreshStatsButton";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: stats } = await supabase.from("leetcode_stats").select("*").eq("user_id", user.id).maybeSingle();

  const totalAll = (stats?.total_easy ?? 0) + (stats?.total_medium ?? 0) + (stats?.total_hard ?? 0);

  return (
    <div className="p-4 pt-14 md:pt-6 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-cc-text flex items-center gap-2">
            <TrendingUp size={22} className="text-cc-accent" />
            Progress
          </h1>
          <p className="text-cc-muted text-xs md:text-sm mt-1">
            {profile?.leetcode_username ? `Tracking @${profile.leetcode_username}` : "Your LeetCode stats"}
          </p>
        </div>
        {profile?.leetcode_username && (
          <div className="flex items-center gap-2 md:gap-4">
            <RefreshStatsButton userId={user.id} leetcodeUsername={profile.leetcode_username} />
            <a
              href={`https://leetcode.com/u/${profile.leetcode_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-cc-muted hover:text-cc-accent transition-colors"
            >
              <ExternalLink size={13} />
              <span className="hidden md:inline">View on LeetCode</span>
            </a>
          </div>
        )}
      </div>

      {!profile?.leetcode_username ? (
        <div className="glass-card !p-12 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-cc-text font-semibold text-xl mb-3">Connect your LeetCode account</h2>
          <p className="text-cc-muted text-sm mb-6">Add your LeetCode username in your profile to start tracking progress.</p>
          <Link href="/profile" className="btn-primary text-sm !px-7 !py-3">Go to Profile</Link>
        </div>
      ) : !stats ? (
        <div className="glass-card !p-12 text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-cc-text font-semibold text-xl mb-3">Fetching your stats…</h2>
          <p className="text-cc-muted text-sm">This may take a moment on first load.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={<Code2 size={18} />}
              label="Total Solved"
              value={stats.total_solved}
              sub={`of ${totalAll}`}
              color="text-cc-accent"
              colorBg="bg-cc-accent/10"
            />
            <StatCard
              icon={<Trophy size={18} />}
              label="Global Ranking"
              value={stats.ranking > 0 ? `#${stats.ranking.toLocaleString()}` : "—"}
              sub="worldwide"
              color="text-cc-medium"
              colorBg="bg-cc-medium/10"
            />
            <StatCard
              icon={<Target size={18} />}
              label="Acceptance Rate"
              value={`${stats.acceptance_rate}%`}
              sub="success rate"
              color="text-cc-easy"
              colorBg="bg-cc-easy/10"
            />
            <StatCard
              icon={<Award size={18} />}
              label="Contribution"
              value={stats.contribution_points}
              sub="points"
              color="text-cc-link"
              colorBg="bg-cc-link/10"
            />
          </div>

          {/* ── Difficulty Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            <DifficultyCard
              label="Easy"
              solved={stats.easy_solved}
              total={stats.total_easy}
              color="cc-easy"
              emoji="🟢"
            />
            <DifficultyCard
              label="Medium"
              solved={stats.medium_solved}
              total={stats.total_medium}
              color="cc-medium"
              emoji="🟡"
            />
            <DifficultyCard
              label="Hard"
              solved={stats.hard_solved}
              total={stats.total_hard}
              color="cc-hard"
              emoji="🔴"
            />
          </div>

          {/* ── Detailed Progress Bars ── */}
          <div className="glass-card !p-5 md:!p-7">
            <h2 className="text-cc-text font-bold text-base md:text-lg mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-cc-accent" />
              Breakdown by Difficulty
            </h2>
            <div className="space-y-5">
              <DetailBar label="Easy" solved={stats.easy_solved} total={stats.total_easy} barColor="bg-cc-easy" textColor="text-cc-easy" />
              <DetailBar label="Medium" solved={stats.medium_solved} total={stats.total_medium} barColor="bg-cc-medium" textColor="text-cc-medium" />
              <DetailBar label="Hard" solved={stats.hard_solved} total={stats.total_hard} barColor="bg-cc-hard" textColor="text-cc-hard" />

              {/* Overall gradient bar */}
              <div className="pt-4 border-t border-cc-border/30">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-cc-text flex items-center gap-1.5">
                    <Flame size={14} className="text-cc-accent" /> Overall
                  </span>
                  <span className="text-sm font-mono text-cc-text">
                    {stats.total_solved}<span className="text-cc-muted text-xs">/{totalAll}</span>
                    <span className="ml-2 text-cc-muted text-xs">({getProgressPercent(stats.total_solved, totalAll)}%)</span>
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cc-easy via-cc-medium to-cc-hard transition-all duration-1000"
                    style={{ width: `${getProgressPercent(stats.total_solved, totalAll)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Sync info ── */}
          <p className="text-[10px] md:text-xs text-cc-muted text-right">
            Last synced: {new Date(stats.last_fetched).toLocaleString()} · Auto-refreshes every 24h
          </p>
        </>
      )}
    </div>
  );
}

/* ═══════════════════ Sub-components ═══════════════════ */

function StatCard({ icon, label, value, sub, color, colorBg }: {
  icon: React.ReactNode; label: string; value: number | string; sub: string; color: string; colorBg: string;
}) {
  return (
    <div className="glass-card !p-4 md:!p-5 card-hover group">
      <div className={`p-2 rounded-xl ${colorBg} w-fit mb-3 transition-transform group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <div className={`text-xl md:text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] md:text-xs text-cc-muted mt-0.5 font-medium">{label}</div>
      <div className="text-[9px] text-cc-muted/50">{sub}</div>
    </div>
  );
}

function DifficultyCard({ label, solved, total, color, emoji }: {
  label: string; solved: number; total: number; color: string; emoji: string;
}) {
  const pct = getProgressPercent(solved, total);
  return (
    <div className="glass-card !p-5 card-hover text-center group">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className={`text-xs font-semibold text-${color} mb-1`}>{label}</div>
      <div className="text-2xl md:text-3xl font-bold font-mono text-cc-text mb-1">
        {solved}<span className={`text-sm text-${color}/50`}>/{total}</span>
      </div>
      <div className="text-xs text-cc-muted mb-3">{pct}% completed</div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DetailBar({ label, solved, total, barColor, textColor }: {
  label: string; solved: number; total: number; barColor: string; textColor: string;
}) {
  const pct = getProgressPercent(solved, total);
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        <span className="text-sm font-mono text-cc-text">
          {solved} <span className="text-cc-muted text-xs">/ {total}</span>
          <span className="ml-2 text-cc-muted text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
