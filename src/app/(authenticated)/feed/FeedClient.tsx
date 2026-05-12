"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Heart, MessageSquare, Plus, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  problem_url: string | null;
  problem_title: string | null;
  tags: string[];
  likes: number;
  created_at: string;
  author: PostAuthor | null;
  comment_count: { count: number }[];
}

export default function FeedClient({
  currentUserId,
  posts: initialPosts,
  likedPostIds,
}: {
  currentUserId: string;
  posts: Post[];
  likedPostIds: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState(new Set(likedPostIds));
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", problem_url: "", problem_title: "", tags: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLike(postId: string, currentLikes: number) {
    const isLiked = liked.has(postId);

    if (isLiked) {
      setLiked((prev) => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
      await supabase.from("posts").update({ likes: currentLikes - 1 }).eq("id", postId);
    } else {
      setLiked((prev) => new Set([...prev, postId]));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
      await supabase.from("posts").update({ likes: currentLikes + 1 }).eq("id", postId);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const { data } = await supabase
      .from("posts")
      .insert({
        author_id: currentUserId,
        title: form.title,
        content: form.content,
        problem_url: form.problem_url || null,
        problem_title: form.problem_title || null,
        tags,
        likes: 0,
      })
      .select(`id, title, content, problem_url, problem_title, tags, likes, created_at,
        author:users!posts_author_id_fkey(id, username, display_name, avatar_url)`)
      .single();

    if (data) {
      setPosts((prev) => [{ ...(data as unknown as Post), comment_count: [{ count: 0 }] }, ...prev]);
      setForm({ title: "", content: "", problem_url: "", problem_title: "", tags: "" });
      setShowCreate(false);
    }

    setCreating(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lc-text">Feed</h1>
          <p className="text-lc-muted text-sm mt-1">Doubts & discussions from the community</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-lc-accent text-lc-bg font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          <Plus size={16} />
          Post a doubt
        </button>
      </div>

      {/* Create Post */}
      {showCreate && (
        <div className="bg-lc-surface border border-lc-accent/40 rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lc-text font-semibold">New Doubt Post</h2>
            <button onClick={() => setShowCreate(false)} className="text-lc-muted hover:text-lc-text">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Title — e.g. 'How does BFS work for shortest path?'"
              className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={4}
              placeholder="Describe your doubt in detail…"
              className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="url"
                value={form.problem_url}
                onChange={(e) => setForm({ ...form, problem_url: e.target.value })}
                placeholder="LeetCode problem URL (optional)"
                className="bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
              />
              <input
                type="text"
                value={form.problem_title}
                onChange={(e) => setForm({ ...form, problem_title: e.target.value })}
                placeholder="Problem title (optional)"
                className="bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
              />
            </div>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags — comma separated: dp, graphs, bfs"
              className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none font-mono"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="bg-lc-accent text-lc-bg font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
              >
                {creating ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lc-muted">No posts yet. Be the first to post a doubt!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-lc-surface border border-lc-border rounded-xl p-5 hover:border-lc-border/80 transition-colors animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-xs font-bold flex-shrink-0 mt-0.5">
                {post.author?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-lc-muted mb-1.5">
                  <span className="font-mono text-lc-text">{post.author?.username}</span>
                  <span>·</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>

                <h3 className="text-lc-text font-semibold mb-2">{post.title}</h3>
                <p className="text-lc-muted text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

                {post.problem_title && (
                  <a
                    href={post.problem_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-lc-link hover:underline mb-3"
                  >
                    <ExternalLink size={12} />
                    {post.problem_title}
                  </a>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-lc-border/50">
                  <button
                    onClick={() => handleLike(post.id, post.likes)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${liked.has(post.id) ? "text-lc-hard" : "text-lc-muted hover:text-lc-hard"}`}
                  >
                    <Heart size={14} className={liked.has(post.id) ? "fill-current" : ""} />
                    {post.likes}
                  </button>
                  <Link
                    href={`/feed/${post.id}`}
                    className="flex items-center gap-1.5 text-xs text-lc-muted hover:text-lc-text transition-colors"
                  >
                    <MessageSquare size={14} />
                    {post.comment_count?.[0]?.count ?? 0} comments
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
