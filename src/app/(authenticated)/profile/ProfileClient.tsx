"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchLeetCodeStats, formatLeetCodeStatsForDB } from "@/lib/leetcode";
import { User, ExternalLink, Check, AlertCircle } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  leetcode_username: string | null;
}

export default function ProfileClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    leetcode_username: profile?.leetcode_username || "",
  });
  const [saving, setSaving] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          display_name: form.display_name?.trim() || null,
          bio: form.bio?.trim() || null,
        })
        .eq("id", userId);

      if (error) {
        setMsg({ type: "error", text: `Update failed: ${error.message}` });
      } else {
        setMsg({ type: "success", text: "Profile updated!" });
        router.refresh();
      }
    } catch (err: any) {
      setMsg({ type: "error", text: `Update error: ${err?.message || "Unknown error"}` });
    }
    setSaving(false);
  }

  async function handleLinkLeetCode() {
    if (!form.leetcode_username.trim()) return;
    setLcLoading(true);
    setMsg(null);

    const stats = await fetchLeetCodeStats(form.leetcode_username.trim());

    if (!stats) {
      setMsg({ type: "error", text: "LeetCode user not found. Check the username." });
      setLcLoading(false);
      return;
    }

    // Update username in profile
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ leetcode_username: form.leetcode_username.trim() })
      .eq("id", userId);

    if (userUpdateError) {
      setMsg({ type: "error", text: `Failed to link account: ${userUpdateError.message}` });
      setLcLoading(false);
      return;
    }

    // Ensure users row exists to satisfy foreign key constraint on leetcode_stats
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      // Try to get email from auth to create a minimal profile record
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email || `${userId}@example.com`;
      const username = email.split("@")[0] || userId;

      const { error: insertErr } = await supabase.from("users").insert({ id: userId, email, username });
      if (insertErr) {
        setMsg({ type: "error", text: `Failed to create profile before saving stats: ${insertErr.message}` });
        setLcLoading(false);
        return;
      }
    }

    // Upsert stats
    const dbData = formatLeetCodeStatsForDB(userId, stats);
    const { error: upsertError } = await supabase
      .from("leetcode_stats")
      .upsert({ ...dbData }, { onConflict: "user_id" });

    if (upsertError) {
      setMsg({ type: "error", text: `Linked username but failed to save stats: ${upsertError.message}` });
      setLcLoading(false);
      router.refresh();
      return;
    }

    setMsg({ type: "success", text: `Linked @${stats.username}! Solved: ${stats.totalSolved} problems.` });
    setLcLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-lc-text">Profile</h1>
        <p className="text-lc-muted text-sm mt-1">Manage your account and LeetCode connection</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          msg.type === "success"
            ? "bg-lc-easy/10 border-lc-easy/30 text-lc-easy"
            : "bg-lc-hard/10 border-lc-hard/30 text-lc-hard"
        }`}>
          {msg.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-lc-surface border border-lc-border rounded-xl p-6">
        <h2 className="text-lc-text font-semibold mb-4">Account Info</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-2xl font-bold">
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lc-text font-mono font-semibold">@{profile?.username}</p>
            <p className="text-lc-muted text-sm">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-lc-muted mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Your full name"
              className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-lc-muted mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Tell the community about yourself…"
              className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-lc-accent text-lc-bg font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* LeetCode Link */}
      <div className="bg-lc-surface border border-lc-border rounded-xl p-6">
        <h2 className="text-lc-text font-semibold mb-1">LeetCode Account</h2>
        <p className="text-lc-muted text-xs mb-4">Link your LeetCode username to track and display your progress.</p>

        {profile?.leetcode_username && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-lc-easy/10 border border-lc-easy/30 rounded-lg">
            <Check size={14} className="text-lc-easy" />
            <span className="text-sm text-lc-easy">Linked to </span>
            <a
              href={`https://leetcode.com/${profile.leetcode_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-lc-easy hover:underline flex items-center gap-1"
            >
              @{profile.leetcode_username} <ExternalLink size={11} />
            </a>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={form.leetcode_username}
            onChange={(e) => setForm({ ...form, leetcode_username: e.target.value })}
            placeholder="Your LeetCode username"
            className="flex-1 bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none font-mono"
          />
          <button
            onClick={handleLinkLeetCode}
            disabled={lcLoading || !form.leetcode_username.trim()}
            className="bg-lc-accent text-lc-bg font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm whitespace-nowrap"
          >
            {lcLoading ? "Verifying…" : profile?.leetcode_username ? "Update" : "Link Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
