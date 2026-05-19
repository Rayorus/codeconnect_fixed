import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProgressPercent, timeAgo } from "@/lib/utils";
import {
  Code2, TrendingUp, Users, MessageSquare, Flame, Trophy,
  ArrowRight, Rss, Calendar, Sparkles, ExternalLink
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profileRes, statsRes, friendsRes, postsRes, convRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("leetcode_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("friends").select("id").eq("user_id", user.id),
    supabase.from("posts")
      .select("id, title, created_at, tags, author:users!posts_author_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("conversations")
      .select("id")
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`),
  ]);

  const profile = profileRes.data;
  const stats = statsRes.data;
  const friendCount = friendsRes.data?.length ?? 0;
  const postCount = postsRes.data?.length ?? 0;
  const messageCount = convRes.data?.length ?? 0;
  const totalAll = (stats?.total_easy ?? 0) + (stats?.total_medium ?? 0) + (stats?.total_hard ?? 0);

  return (
    <div className="p-4 pt-14 md:pt-6 md:p-8 max-w-5xl w-full mx-auto space-y-6 md:space-y-8">
      {/* ── Welcome Header ── */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-cc-text">
          Welcome back, <span className="gradient-text-accent font-mono">{profile?.display_name || profile?.username}</span> 👋
        </h1>
        <p className="text-cc-muted text-sm md:text-base mt-1">
          Here&apos;s your coding journey at a glance
        </p>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <QuickStatCard
          icon={<Code2 size={20} />}
          label="Total Solved"
          value={stats?.total_solved ?? "—"}
          color="text-cc-accent"
          colorBg="bg-cc-accent/10"
          href="/progress"
        />
        <QuickStatCard
          icon={<TrendingUp size={20} />}
          label="Ranking"
          value={stats ? `#${stats.ranking.toLocaleString()}` : "—"}
          color="text-cc-easy"
          colorBg="bg-cc-easy/10"
          href="/progress"
        />
        <QuickStatCard
          icon={<Flame size={20} />}
          label="Accept Rate"
          value={stats ? `${stats.acceptance_rate}%` : "—"}
          color="text-cc-hard"
          colorBg="bg-cc-hard/10"
          href="/progress"
        />
        <QuickStatCard
          icon={<Users size={20} />}
          label="Friends"
          value={friendCount}
          color="text-cc-medium"
          colorBg="bg-cc-medium/10"
          href="/friends"
        />
        <QuickStatCard
          icon={<MessageSquare size={20} />}
          label="Chats"
          value={messageCount}
          color="text-cc-link"
          colorBg="bg-cc-link/10"
          href="/chat"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* ── LeetCode Progress (2 cols) ── */}
        <div className="lg:col-span-2 glass-card !p-5 md:!p-7">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h2 className="text-base md:text-xl font-bold text-cc-text flex items-center gap-2">
              <Trophy size={20} className="text-cc-accent" />
              LeetCode Progress
            </h2>
            <Link href="/progress" className="text-xs text-cc-accent hover:text-cc-accent-light transition-colors flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          </div>

          {stats ? (
            <div className="space-y-5">
              {/* Difficulty bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DifficultyCard label="Easy" solved={stats.easy_solved} total={stats.total_easy} color="cc-easy" />
                <DifficultyCard label="Medium" solved={stats.medium_solved} total={stats.total_medium} color="cc-medium" />
                <DifficultyCard label="Hard" solved={stats.hard_solved} total={stats.total_hard} color="cc-hard" />
              </div>

              {/* Overall bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-cc-muted font-medium">Overall</span>
                  <span className="text-cc-text font-mono">{stats.total_solved}<span className="text-cc-muted">/{totalAll}</span></span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cc-easy via-cc-medium to-cc-hard transition-all duration-700"
                    style={{ width: `${getProgressPercent(stats.total_solved, totalAll)}%` }}
                  />
                </div>
              </div>

              {profile?.leetcode_username && (
                <a
                  href={`https://leetcode.com/u/${profile.leetcode_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cc-link hover:text-cc-accent transition-colors"
                >
                  <ExternalLink size={11} /> View on LeetCode
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-cc-muted text-sm mb-4">Connect your LeetCode account to track progress</p>
              <Link href="/profile" className="btn-primary text-sm !px-5 !py-2.5">
                Connect LeetCode
              </Link>
            </div>
          )}
        </div>

        {/* ── Quick Actions (1 col) ── */}
        <div className="space-y-4">
          <div className="glass-card !p-5 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-cc-text mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-cc-accent" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction href="/feed" label="Browse Feed" borderColor="border-cc-accent/20 hover:border-cc-accent/50" />
              <QuickAction href="/news" label="Tech News" borderColor="border-cc-easy/20 hover:border-cc-easy/50" />
              <QuickAction href="/friends" label="Find Friends" borderColor="border-cc-medium/20 hover:border-cc-medium/50" />
              <QuickAction href="/chat" label="Messages" borderColor="border-cc-hard/20 hover:border-cc-hard/50" badge={messageCount > 0 ? messageCount : undefined} />
              <QuickAction href="/ai" label="AI Mentor" borderColor="border-cc-link/20 hover:border-cc-link/50" />
              <QuickAction href="/compiler" label="Compiler" borderColor="border-cc-accent/20 hover:border-cc-accent/50" />
            </div>
          </div>

          {/* Daily Tip */}
          <div className="glass-card !p-5 !border-cc-accent/15 bg-gradient-to-br from-cc-accent/5 to-transparent">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-sm font-semibold text-cc-text mb-1">Daily Tip</div>
            <div className="text-xs text-cc-muted leading-relaxed">
              &quot;The best way to learn algorithms is to solve problems consistently, not intensively.&quot;
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Doubts ── */}
      <div className="glass-card !p-5 md:!p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-cc-text flex items-center gap-2">
            <Calendar size={18} className="text-cc-accent" />
            Recent Activity
          </h2>
          <Link href="/feed" className="text-xs text-cc-accent hover:text-cc-accent-light transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {postsRes.data && postsRes.data.length > 0 ? (
          <div className="space-y-0.5">
            {postsRes.data.map(post => (
              <Link
                key={post.id}
                href={`/feed/${post.id}`}
                className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl hover:bg-cc-hover transition-colors tap-scale-sm group"
              >
                <div className="w-2 h-2 rounded-full bg-cc-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-cc-text line-clamp-1 group-hover:text-cc-accent transition-colors">{post.title}</p>
                  <p className="text-[10px] md:text-xs text-cc-muted mt-0.5">
                    {(post.author as { username: string }[] | null)?.[0]?.username} · {timeAgo(post.created_at)}
                  </p>
                </div>
                {post.tags?.[0] && <span className="tag-pill text-[10px] hidden sm:inline-flex">{post.tags[0]}</span>}
                <ArrowRight size={12} className="text-cc-muted/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-cc-muted text-sm mb-3">No recent activity</p>
            <Link href="/feed" className="btn-secondary text-xs !px-4 !py-2">Explore Feed</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════ Sub-components ═══════════════════ */

function QuickStatCard({ icon, label, value, color, colorBg, href }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; colorBg: string; href: string;
}) {
  return (
    <Link href={href} className="glass-card !p-4 md:!p-5 card-hover tap-scale-sm group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorBg} transition-transform group-hover:scale-110`}>
          <span className={color}>{icon}</span>
        </div>
        <ArrowRight size={14} className="text-cc-muted/0 group-hover:text-cc-muted/60 transition-all" />
      </div>
      <div className="text-[10px] md:text-xs text-cc-muted font-medium mb-0.5">{label}</div>
      <div className={`text-xl md:text-2xl font-bold font-mono ${color}`}>{value}</div>
    </Link>
  );
}

function DifficultyCard({ label, solved, total, color }: {
  label: string; solved: number; total: number; color: string;
}) {
  const pct = getProgressPercent(solved, total);
  return (
    <div className="rounded-xl bg-white/[0.02] border border-cc-border/30 p-3.5 text-center">
      <div className={`text-xs text-${color} font-semibold mb-1`}>{label}</div>
      <div className="text-lg md:text-xl font-bold text-cc-text font-mono">
        {solved}<span className="text-cc-muted text-sm">/{total}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
        <div className={`h-full rounded-full bg-${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickAction({ href, label, borderColor, badge }: {
  href: string; label: string; borderColor: string; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border ${borderColor} transition-all tap-scale-sm group`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-cc-text group-hover:text-cc-accent transition-colors">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 bg-cc-hard text-white text-[10px] font-bold rounded-full">{badge}</span>
        )}
      </div>
      <ArrowRight size={14} className="text-cc-muted/30 group-hover:text-cc-muted transition-colors" />
    </Link>
  );
}
