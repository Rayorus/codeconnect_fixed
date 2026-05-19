"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

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
    <li
      className="py-4 border-b border-cc-border/30 last:border-b-0 flex items-start gap-4 hover:bg-cc-hover/50 rounded-xl px-3 -mx-3 transition-all duration-200"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative flex-none">
        <img src={favicon} alt="favicon" width={36} height={36} loading="lazy" className="rounded-lg" />
        <span className="absolute -top-1 -left-1 w-5 h-5 bg-cc-accent/20 text-cc-accent-light text-[10px] font-bold flex items-center justify-center rounded-md">
          {index + 1}
        </span>
      </div>
      <div className="flex-1">
        <a
          href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-cc-text hover:text-cc-accent-light transition-colors leading-snug"
        >
          {story.title || "(no title)"}
        </a>
        <div className="text-xs text-cc-muted mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-cc-accent-light font-medium">{story.score ?? 0} pts</span>
          <span className="text-cc-border">·</span>
          <span>by {story.by || "unknown"}</span>
          <span className="text-cc-border">·</span>
          <span>{timeAgo(story.time)}</span>
          <span className="text-cc-border">·</span>
          <span>{story.descendants ?? 0} comments</span>
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            disabled={loading}
            className="btn-secondary !px-4 !py-2 text-sm flex items-center gap-2"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <label className="text-xs text-cc-muted inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-cc-accent rounded"
            />
            Auto-refresh (60s)
          </label>
        </div>
      </div>

      {loading && (
        <div className="py-10 text-center">
          <svg className="w-6 h-6 animate-spin text-cc-accent mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-cc-muted">Loading news…</p>
        </div>
      )}
      {error && <div className="py-10 text-center text-sm text-cc-hard">{error}</div>}
      {!loading && !error && (!stories || stories.length === 0) && (
        <div className="py-10 text-center text-sm text-cc-muted">No stories found.</div>
      )}

      {!loading && !error && stories && stories.length > 0 && (
        <ul className="space-y-1">
          {stories.map((s, i) => (
            <StoryRow key={s.id} story={s} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
