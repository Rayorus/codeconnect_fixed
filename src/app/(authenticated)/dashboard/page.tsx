import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProgressPercent, timeAgo } from "@/lib/utils";
import { Users, MessageSquare, TrendingUp, Rss } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profileRes, statsRes, friendsRes, postsRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("leetcode_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("friends").select("id").eq("user_id", user.id),
    supabase
      .from("posts")
      .select("id, title, created_at, author:users(username)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileRes.data;
  const stats = statsRes.data;
  const friendCount = friendsRes.data?.length ?? 0;

  return (
    <div className="p-4 max-w-3xl w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-lc-text">
          Welcome back, <span className="text-lc-accent font-mono">{profile?.display_name || profile?.username}</span> 👋
        </h1>
        <p className="text-lc-muted text-sm mt-1">Here&apos;s your activity overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp size={18} className="text-lc-easy" />}
          label="Problems Solved"
          value={stats?.total_solved ?? "—"}
          sub={stats ? `Rank #${stats.ranking.toLocaleString()}` : "Connect LeetCode"}
          href="/progress"
        />
        <StatCard
          icon={<Users size={18} className="text-lc-accent" />}
          label="Friends"
          value={friendCount}
          sub="connections"
          href="/friends"
        />
        <StatCard
          icon={<Rss size={18} className="text-lc-medium" />}
          label="Recent Posts"
          value={postsRes.data?.length ?? 0}
          sub="in feed"
          href="/feed"
        />
        <StatCard
          icon={<MessageSquare size={18} className="text-lc-link" />}
          label="Acceptance"
          value={stats ? `${stats.acceptance_rate}%` : "—"}
          sub="all-time rate"
          href="/progress"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LeetCode Progress */}
        <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lc-text font-semibold">LeetCode Progress</h2>
            <Link href="/progress" className="text-xs text-lc-accent hover:underline">View all</Link>
          </div>

          {stats ? (
            <div className="space-y-3">
              <DiffBar label="Easy" solved={stats.easy_solved} total={stats.total_easy} color="bg-lc-easy" />
              <DiffBar label="Medium" solved={stats.medium_solved} total={stats.total_medium} color="bg-lc-medium" />
              <DiffBar label="Hard" solved={stats.hard_solved} total={stats.total_hard} color="bg-lc-hard" />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lc-muted text-sm mb-3">No LeetCode account linked yet</p>
              <Link
                href="/profile"
                className="bg-lc-accent text-lc-bg text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Connect LeetCode
              </Link>
            </div>
          )}
        </div>

        {/* Recent Feed */}
        <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lc-text font-semibold">Recent Doubts</h2>
            <Link href="/feed" className="text-xs text-lc-accent hover:underline">View all</Link>
          </div>

          {postsRes.data && postsRes.data.length > 0 ? (
            <div className="space-y-3">
              {postsRes.data.map((post) => (
                <Link
                  key={post.id}
                  href={`/feed/${post.id}`}
                  className="block p-3 rounded-lg hover:bg-lc-hover transition-colors"
                >
                  <p className="text-sm text-lc-text line-clamp-1">{post.title}</p>
                  <p className="text-xs text-lc-muted mt-1">
                    by {(post.author as { username: string }[] | null)?.[0]?.username} · {timeAgo(post.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lc-muted text-sm mb-3">No posts yet</p>
              <Link
                href="/feed"
                className="bg-lc-surface border border-lc-border text-lc-text text-sm font-medium px-4 py-2 rounded-lg hover:bg-lc-hover transition-colors"
              >
                Explore Feed
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-lc-surface border border-lc-border rounded-xl p-4 hover:border-lc-accent/40 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-lc-muted">{label}</span></div>
      <div className="text-2xl font-bold text-lc-text font-mono">{value}</div>
      <div className="text-xs text-lc-muted mt-1">{sub}</div>
    </Link>
  );
}

function DiffBar({
  label,
  solved,
  total,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
}) {
  const pct = getProgressPercent(solved, total);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-lc-muted">{label}</span>
        <span className="text-lc-text font-mono">{solved}<span className="text-lc-muted">/{total}</span></span>
      </div>
      <div className="h-1.5 bg-lc-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
