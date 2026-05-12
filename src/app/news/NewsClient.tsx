"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type Story = {
  id: number;
  title?: string;
  by?: string;
  url?: string;
  time?: number;
  score?: number;
  descendants?: number;
};

function timeAgo(ts?: number) {
  if (!ts) return "";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const StoryRow = React.memo(function StoryRow({ story, index }: { story: Story; index: number }) {
  function getFavicon(url?: string) {
    try {
      const host = url ? new URL(url).hostname : "news.ycombinator.com";
      return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
    } catch {
      return `https://www.google.com/s2/favicons?sz=64&domain=news.ycombinator.com`;
    }
  }

  const favicon = getFavicon(story.url);

  return (
    <li className="py-3 border-b last:border-b-0 flex items-start gap-3">
      <img src={favicon} alt="favicon" width={36} height={36} loading="lazy" className="rounded-sm flex-none" />
      <div className="flex-1">
        <a href={story.url || `https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-lc-accent hover:underline">
          {index + 1}. {story.title || "(no title)"}
        </a>
        <div className="text-xs text-lc-muted mt-1">
          {story.score ?? 0} pts • by {story.by || "unknown"} • {timeAgo(story.time)} • {story.descendants ?? 0} comments
        </div>
      </div>
    </li>
  );
});

export default function NewsClient() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // abort previous fetch if any
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal: controller.signal });
      if (!topRes.ok) throw new Error("Failed to fetch top stories");
      const ids: number[] = await topRes.json();
      const top10 = ids.slice(0, 10);

      const detailPromises = top10.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: controller.signal }).then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
      );

      const details = (await Promise.all(detailPromises)).filter(Boolean) as Story[];
      if (!mountedRef.current) return;
      setStories(details);
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to load news");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      controllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load(), 60_000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="bg-lc-card border border-lc-border px-3 py-1 rounded text-sm mr-2"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <label className="text-xs text-lc-muted ml-2 inline-flex items-center gap-2">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh (60s)
          </label>
        </div>
      </div>

      {loading && <div className="py-8 text-center text-sm text-lc-muted">Loading news…</div>}
      {error && <div className="py-8 text-center text-sm text-lc-hard">{error}</div>}
      {!loading && !error && (!stories || stories.length === 0) && (
        <div className="py-8 text-center text-sm text-lc-muted">No stories found.</div>
      )}

      {!loading && !error && stories && stories.length > 0 && (
        <ul className="space-y-2">
          {stories.map((s, i) => (
            <StoryRow key={s.id} story={s} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
