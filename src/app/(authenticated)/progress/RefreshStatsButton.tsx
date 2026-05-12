"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { fetchLeetCodeStats, formatLeetCodeStatsForDB } from "@/lib/leetcode";
import { createClient } from "@/lib/supabase/client";

export default function RefreshStatsButton({
  userId,
  leetcodeUsername,
}: {
  userId: string;
  leetcodeUsername: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleRefresh() {
    setLoading(true);
    setMsg(null);

    const stats = await fetchLeetCodeStats(leetcodeUsername);

    if (!stats) {
      setMsg("Could not fetch stats. Check your LeetCode username.");
      setLoading(false);
      return;
    }

    const dbData = formatLeetCodeStatsForDB(userId, stats);

    await supabase
      .from("leetcode_stats")
      .upsert({ ...dbData, user_id: userId }, { onConflict: "user_id" });

    setMsg("Stats refreshed!");
    setLoading(false);
    router.refresh();
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-lc-muted hover:text-lc-accent transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Refreshing…" : "Refresh"}
      </button>
      {msg && <span className="text-xs text-lc-easy">{msg}</span>}
    </div>
  );
}
