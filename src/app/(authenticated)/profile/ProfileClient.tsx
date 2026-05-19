"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchLeetCodeStats, formatLeetCodeStatsForDB } from "@/lib/leetcode";
import { User, ExternalLink, Check, AlertCircle, Settings, Link as LinkIcon } from "lucide-react";

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
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-cc-text flex items-center gap-2">
          <Settings size={24} className="text-cc-accent-light" />
          Profile
        </h1>
        <p className="text-cc-muted text-sm mt-1">Manage your account and LeetCode connection</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border animate-fade-in ${
          msg.type === "success"
            ? "bg-cc-easy/10 border-cc-easy/30 text-cc-easy"
            : "bg-cc-hard/10 border-cc-hard/30 text-cc-hard"
        }`}>
          {msg.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card !p-5 md:!p-7">
        <h2 className="text-cc-text font-semibold text-base md:text-lg mb-4 md:mb-5">Account Info</h2>
        <div className="flex items-center gap-4 md:gap-5 mb-5 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xl md:text-2xl font-bold">
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-cc-text font-mono font-semibold text-base md:text-lg">@{profile?.username}</p>
            <p className="text-cc-muted text-sm">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm text-cc-muted mb-2 font-medium">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Your full name"
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-cc-muted mb-2 font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Tell the community about yourself…"
              className="glass-input w-full resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm !px-6 !py-2.5"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            ) : "Save changes"}
          </button>
        </form>
      </div>

      {/* LeetCode Link */}
      <div className="glass-card !p-7">
        <h2 className="text-cc-text font-semibold text-lg mb-1 flex items-center gap-2">
          <LinkIcon size={16} className="text-cc-easy" />
          LeetCode Account
        </h2>
        <p className="text-cc-muted text-xs mb-5">Link your LeetCode username to track and display your progress.</p>

        {profile?.leetcode_username && (
          <div className="flex items-center gap-2 mb-5 p-3.5 bg-cc-easy/10 border border-cc-easy/25 rounded-xl">
            <Check size={14} className="text-cc-easy" />
            <span className="text-sm text-cc-easy">Linked to </span>
            <a
              href={`https://leetcode.com/${profile.leetcode_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-cc-easy hover:underline flex items-center gap-1"
            >
              @{profile.leetcode_username} <ExternalLink size={11} />
            </a>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={form.leetcode_username}
            onChange={(e) => setForm({ ...form, leetcode_username: e.target.value })}
            placeholder="Your LeetCode username"
            className="glass-input flex-1 font-mono"
          />
          <button
            onClick={handleLinkLeetCode}
            disabled={lcLoading || !form.leetcode_username.trim()}
            className="btn-primary text-sm !px-5 !py-2.5 whitespace-nowrap"
          >
            {lcLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying…
              </span>
            ) : profile?.leetcode_username ? "Update" : "Link Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
