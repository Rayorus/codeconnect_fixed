"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Check, X, Search, MessageSquare } from "lucide-react";
import Link from "next/link";

interface FriendUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  leetcode_username: string | null;
}

interface FriendEntry {
  id: string;
  friend_id: string;
  created_at: string;
  friend: FriendUser | null;
}

interface RequestEntry {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
  sender: FriendUser | null;
}

export default function FriendsClient({
  currentUserId,
  friends,
  pendingRequests,
}: {
  currentUserId: string;
  friends: FriendEntry[];
  pendingRequests: RequestEntry[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      // search username, display_name, or leetcode_username
      const q = searchQuery.trim();
      const filter = `username.ilike.%${q}%,display_name.ilike.%${q}%,leetcode_username.ilike.%${q}%`;
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url, leetcode_username")
        .or(filter)
        .neq("id", currentUserId)
        .limit(10);

      if (error) {
        setSearchResults([]);
        setSearchError(error.message || "Search failed");
      } else {
        setSearchResults(data || []);
        if (!data || data.length === 0) setSearchError("No users found");
      }
    } catch (err) {
      setSearchResults([]);
      setSearchError((err as any)?.message || "Search failed");
    }
    setSearching(false);
  }

  async function sendRequest(receiverId: string) {
    setActionLoading(receiverId);
    setMsg(null);

    try {
      const res = await fetch("/api/friend-requests/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg({ type: "error", text: json.error || "Failed to send request." });
        setActionLoading(null);
        return;
      }

      if (json.message) {
        setMsg({ type: "success", text: json.message });
        setActionLoading(null);
        router.refresh();
        return;
      }

      setMsg({ type: "success", text: "Friend request sent." });
      setActionLoading(null);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed to send request." });
      setActionLoading(null);
    }
  }

  async function acceptRequest(requestId: string, senderId: string) {
    setActionLoading(requestId);
    setMsg(null);
    try {
      const res = await fetch("/api/friend-requests/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: json.error || "Failed to accept request." });
        setActionLoading(null);
        return;
      }

      setMsg({ type: "success", text: "Friend request accepted." });
      setActionLoading(null);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed to accept request." });
      setActionLoading(null);
    }
  }

  async function rejectRequest(requestId: string) {
    setActionLoading(requestId);
    await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
    setActionLoading(null);
    router.refresh();
  }

  async function removeFriend(friendId: string) {
    setActionLoading(friendId);
    await supabase.from("friends").delete().eq("user_id", currentUserId).eq("friend_id", friendId);
    await supabase.from("friends").delete().eq("user_id", friendId).eq("friend_id", currentUserId);
    setActionLoading(null);
    router.refresh();
  }

  const friendIds = new Set(friends.map((f) => f.friend_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-lc-text">Friends</h1>
        <p className="text-lc-muted text-sm mt-1">Connect with other LeetCoders</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          msg.type === "success"
            ? "bg-lc-easy/10 border-lc-easy/30 text-lc-easy"
            : "bg-lc-hard/10 border-lc-hard/30 text-lc-hard"
        }`}>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
        <h2 className="text-lc-text font-semibold mb-4">Find People</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by username…"
            className="flex-1 bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-lc-accent text-lc-bg font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            <Search size={15} />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-lc-card rounded-lg">
                <div>
                  <span className="font-mono text-sm text-lc-text">{u.username}</span>
                  {u.leetcode_username && (
                    <span className="text-xs text-lc-muted ml-2">LC: {u.leetcode_username}</span>
                  )}
                </div>
                {!friendIds.has(u.id) ? (
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={actionLoading === u.id}
                    className="flex items-center gap-1.5 text-xs bg-lc-accent/10 text-lc-accent border border-lc-accent/30 px-3 py-1.5 rounded-lg hover:bg-lc-accent/20 transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={13} /> Add
                  </button>
                ) : (
                  <span className="text-xs text-lc-easy">Friends</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
          <h2 className="text-lc-text font-semibold mb-4">
            Requests <span className="bg-lc-accent text-lc-bg text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingRequests.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-lc-card rounded-lg">
                <span className="font-mono text-sm text-lc-text">{req.sender?.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req.id, req.sender_id)}
                    disabled={actionLoading === req.id}
                    className="flex items-center gap-1 text-xs bg-lc-easy/10 text-lc-easy border border-lc-easy/30 px-3 py-1.5 rounded-lg hover:bg-lc-easy/20 transition-colors disabled:opacity-50"
                  >
                    <Check size={13} /> Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    disabled={actionLoading === req.id}
                    className="flex items-center gap-1 text-xs bg-lc-hard/10 text-lc-hard border border-lc-hard/30 px-3 py-1.5 rounded-lg hover:bg-lc-hard/20 transition-colors disabled:opacity-50"
                  >
                    <X size={13} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
        <h2 className="text-lc-text font-semibold mb-4">Your Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-lc-muted text-sm text-center py-6">No friends yet. Search for users above!</p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-lc-card rounded-lg">
                <div>
                  <span className="font-mono text-sm text-lc-text">{f.friend?.username}</span>
                  {f.friend?.leetcode_username && (
                    <span className="text-xs text-lc-muted ml-2">LC: {f.friend.leetcode_username}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/chat?user=${f.friend_id}`}
                    className="flex items-center gap-1 text-xs text-lc-muted hover:text-lc-accent transition-colors"
                  >
                    <MessageSquare size={14} />
                  </Link>
                  <Link
                    href={`/users/${f.friend_id}`}
                    className="flex items-center gap-1 text-xs text-lc-muted hover:text-lc-accent transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => removeFriend(f.friend_id)}
                    disabled={actionLoading === f.friend_id}
                    className="text-xs text-lc-muted hover:text-lc-hard transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
