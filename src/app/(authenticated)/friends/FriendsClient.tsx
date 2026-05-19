"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus, Check, X, Search, MessageSquare, Users, Sparkles,
  Trophy, UserCheck, UserX, Crown, Medal, Award, ArrowRight
} from "lucide-react";
import Link from "next/link";

interface FriendUser { id: string; username: string; display_name: string | null; avatar_url: string | null; leetcode_username: string | null; }
interface FriendEntry { id: string; friend_id: string; created_at: string; friend: FriendUser | null; }
interface RequestEntry { id: string; sender_id: string; status: string; created_at: string; sender: FriendUser | null; }
interface LCStats { user_id: string; total_solved: number; easy_solved: number; medium_solved: number; hard_solved: number; total_easy: number; total_medium: number; total_hard: number; ranking: number; }

export default function FriendsClient({ currentUserId, friends, pendingRequests, friendStats, myStats }: {
  currentUserId: string; friends: FriendEntry[]; pendingRequests: RequestEntry[];
  friendStats: Record<string, LCStats>; myStats: LCStats | null;
}) {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "leaderboard">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dismissedRequests, setDismissedRequests] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true); setSearchError(null);
    const q = searchQuery.trim();
    const { data, error } = await supabase.from("users").select("id, username, display_name, avatar_url, leetcode_username")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,leetcode_username.ilike.%${q}%`)
      .neq("id", currentUserId).limit(10);
    if (error) { setSearchResults([]); setSearchError(error.message); }
    else { setSearchResults(data || []); if (!data?.length) setSearchError("No users found"); }
    setSearching(false);
  }

  async function sendRequest(receiverId: string) {
    setActionLoading(receiverId); setMsg(null);
    const res = await fetch("/api/friend-requests/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId }) });
    const json = await res.json();
    if (!res.ok) { setMsg({ type: "error", text: json.error || "Failed." }); } else { setMsg({ type: "success", text: json.message || "Request sent!" }); router.refresh(); }
    setActionLoading(null);
  }

  async function acceptRequest(requestId: string) {
    setActionLoading(requestId); setMsg(null);
    const res = await fetch("/api/friend-requests/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
    const json = await res.json();
    if (!res.ok) { setMsg({ type: "error", text: json.error || "Failed." }); } else { setDismissedRequests(prev => new Set([...prev, requestId])); setMsg({ type: "success", text: "Friend added!" }); setTimeout(() => router.refresh(), 300); }
    setActionLoading(null);
  }

  async function rejectRequest(requestId: string) {
    setActionLoading(requestId);
    setDismissedRequests(prev => new Set([...prev, requestId]));
    await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
    setActionLoading(null);
    setTimeout(() => router.refresh(), 300);
  }

  async function removeFriend(friendId: string) {
    setActionLoading(friendId);
    await supabase.from("friends").delete().eq("user_id", currentUserId).eq("friend_id", friendId);
    await supabase.from("friends").delete().eq("user_id", friendId).eq("friend_id", currentUserId);
    setActionLoading(null); router.refresh();
  }

  const friendIds = new Set(friends.map(f => f.friend_id));
  const visibleRequests = pendingRequests.filter(r => !dismissedRequests.has(r.id));

  // Leaderboard sorted by total_solved
  const leaderboardEntries = friends
    .filter(f => friendStats[f.friend_id])
    .map(f => ({ friend: f, stats: friendStats[f.friend_id] }))
    .sort((a, b) => (b.stats.total_solved || 0) - (a.stats.total_solved || 0));

  const tabs = [
    { id: "friends" as const, label: "All Friends", count: friends.length },
    { id: "requests" as const, label: "Requests", count: visibleRequests.length },
    { id: "leaderboard" as const, label: "Leaderboard", count: null },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-cc-text flex items-center gap-2">
            <Users size={22} className="text-cc-accent" /> Friends
          </h1>
          <p className="text-cc-muted text-xs md:text-sm mt-1">Connect, compete, and grow together</p>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${msg.type === "success" ? "bg-cc-easy/8 border-cc-easy/20 text-cc-easy" : "bg-cc-hard/8 border-cc-hard/20 text-cc-hard"}`}>
            {msg.type === "success" ? <Check size={14} /> : <X size={14} />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cc-border/40 relative">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors tap-scale-sm ${
              activeTab === tab.id ? "text-cc-accent" : "text-cc-muted hover:text-cc-text"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="friendsTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-cc-accent rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-cc-accent text-white text-[10px] font-bold rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "friends" && (
          <motion.div key="friends" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            {/* Search */}
            <div className="glass-card !p-4 md:!p-5">
              <div className="flex gap-2 md:gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cc-muted" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="Search by username…" className="glass-input !pl-9" />
                </div>
                <button onClick={handleSearch} disabled={searching} className="btn-primary !px-4 !py-2.5 tap-scale-sm">
                  {searching ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> : <Search size={15} />}
                </button>
              </div>
              {searchError && <p className="text-cc-muted text-sm mt-3">{searchError}</p>}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-cc-bg/40 border border-cc-border/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.username?.[0]?.toUpperCase()}</div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm text-cc-text truncate block">{u.username}</span>
                          {u.leetcode_username && <span className="text-[10px] text-cc-muted">LC: {u.leetcode_username}</span>}
                        </div>
                      </div>
                      {!friendIds.has(u.id) ? (
                        <button onClick={() => sendRequest(u.id)} disabled={actionLoading === u.id}
                          className="flex items-center gap-1.5 text-xs btn-secondary !px-3 !py-1.5 tap-scale-sm disabled:opacity-50 flex-shrink-0">
                          <UserPlus size={12} /> Add
                        </button>
                      ) : (
                        <span className="text-xs text-cc-easy flex items-center gap-1 flex-shrink-0"><Check size={12} /> Friends</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Friends Grid */}
            {friends.length === 0 ? (
              <div className="glass-card !p-12 text-center">
                <UserCheck size={40} className="text-cc-muted mx-auto mb-4" />
                <p className="text-cc-muted text-sm">No friends yet. Search above to find people!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {friends.map((f, i) => {
                  const st = friendStats[f.friend_id];
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="glass-card !p-5 card-hover group"
                    >
                      {/* User header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {f.friend?.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-cc-text text-sm flex items-center gap-1.5">
                              {f.friend?.username}
                              {st && st.ranking < 5000 && <Crown size={13} className="text-cc-medium" />}
                              {st && st.ranking >= 5000 && st.ranking < 10000 && <Medal size={13} className="text-cc-easy" />}
                            </div>
                            {f.friend?.leetcode_username && <div className="text-[10px] text-cc-muted font-mono">@{f.friend.leetcode_username}</div>}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Link href={`/chat?user=${f.friend_id}`} className="p-2 rounded-lg hover:bg-cc-hover transition-colors tap-scale-sm" title="Message">
                            <MessageSquare size={14} className="text-cc-muted" />
                          </Link>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      {st ? (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="text-center">
                            <div className="text-[10px] text-cc-muted mb-0.5">Total</div>
                            <div className="text-base font-bold font-mono text-cc-text">{st.total_solved}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-cc-easy mb-0.5">Easy</div>
                            <div className="text-base font-bold font-mono text-cc-easy">{st.easy_solved}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-cc-medium mb-0.5">Med</div>
                            <div className="text-base font-bold font-mono text-cc-medium">{st.medium_solved}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-cc-hard mb-0.5">Hard</div>
                            <div className="text-base font-bold font-mono text-cc-hard">{st.hard_solved}</div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-cc-muted mb-4">No LeetCode data</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-cc-border/30">
                        <Link href={`/users/${f.friend_id}`} className="text-xs text-cc-accent hover:text-cc-accent-light transition-colors">
                          View Profile
                        </Link>
                        <button onClick={() => removeFriend(f.friend_id)} disabled={actionLoading === f.friend_id}
                          className="text-[10px] text-cc-muted hover:text-cc-hard transition-colors tap-scale-sm disabled:opacity-50">Remove</button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
            {visibleRequests.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {visibleRequests.map(req => (
                  <motion.div
                    key={req.id} layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -60 }}
                    className="flex items-center justify-between p-4 glass-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-sm font-bold">{req.sender?.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="font-medium text-cc-text text-sm">{req.sender?.username}</div>
                        <div className="text-[10px] text-cc-muted">{new Date(req.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest(req.id)} disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 text-xs bg-cc-easy/10 text-cc-easy border border-cc-easy/20 px-3.5 py-2 rounded-xl hover:bg-cc-easy/20 transition-colors tap-scale-sm disabled:opacity-50">
                        <UserCheck size={13} /> Accept
                      </button>
                      <button onClick={() => rejectRequest(req.id)} disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 text-xs bg-white/[0.03] text-cc-muted border border-cc-border/30 px-3.5 py-2 rounded-xl hover:border-cc-hard/30 hover:text-cc-hard transition-colors tap-scale-sm disabled:opacity-50">
                        <UserX size={13} /> Decline
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="glass-card !p-12 text-center">
                <UserCheck size={40} className="text-cc-muted mx-auto mb-4" />
                <p className="text-cc-muted text-sm">No pending friend requests</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="glass-card !p-5 md:!p-7">
              <h2 className="text-base md:text-lg font-bold text-cc-text mb-5 flex items-center gap-2">
                <Trophy size={18} className="text-cc-accent" />
                Friends Leaderboard
              </h2>
              {leaderboardEntries.length === 0 ? (
                <div className="text-center py-10">
                  <Trophy size={36} className="text-cc-muted mx-auto mb-3" />
                  <p className="text-cc-muted text-sm">No friends with LeetCode stats yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboardEntries.map(({ friend: f, stats: st }, index) => {
                    const rank = index + 1;
                    const rankEmoji = rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : null;
                    return (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-cc-hover/50 transition-colors group"
                      >
                        <div className="w-8 text-center font-bold text-lg flex-shrink-0">
                          {rankEmoji || <span className="text-cc-muted text-sm">{rank}</span>}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {f.friend?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-cc-text text-sm truncate">{f.friend?.username}</div>
                          <div className="text-[10px] text-cc-muted">Rank #{st.ranking.toLocaleString()}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg md:text-xl font-bold font-mono text-cc-accent">{st.total_solved}</div>
                          <div className="text-[10px] text-cc-muted">problems</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
