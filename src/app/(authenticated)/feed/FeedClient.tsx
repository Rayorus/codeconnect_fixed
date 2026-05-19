"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Heart, MessageCircle, Share2, Plus, X, ExternalLink, Sparkles, Send, Rss } from "lucide-react";
import Link from "next/link";

interface PostAuthor { id: string; username: string; display_name: string | null; avatar_url: string | null; }
interface Post { id: string; title: string; content: string; problem_url: string | null; problem_title: string | null; tags: string[]; likes: number; created_at: string; author: PostAuthor | null; comment_count: { count: number }[]; }

export default function FeedClient({ currentUserId, posts: initialPosts, likedPostIds }: {
  currentUserId: string; posts: Post[]; likedPostIds: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState(new Set(likedPostIds));
  const [heartPopping, setHeartPopping] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", problem_url: "", problem_title: "", tags: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLike(postId: string, currentLikes: number) {
    const isLiked = liked.has(postId);
    if (!isLiked) { setHeartPopping(postId); setTimeout(() => setHeartPopping(null), 350); }
    if (isLiked) {
      setLiked(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
      await supabase.from("posts").update({ likes: currentLikes - 1 }).eq("id", postId);
    } else {
      setLiked(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
      await supabase.from("posts").update({ likes: currentLikes + 1 }).eq("id", postId);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { data } = await supabase.from("posts")
      .insert({ author_id: currentUserId, title: form.title, content: form.content, problem_url: form.problem_url || null, problem_title: form.problem_title || null, tags, likes: 0 })
      .select(`id, title, content, problem_url, problem_title, tags, likes, created_at, author:users!posts_author_id_fkey(id, username, display_name, avatar_url)`).single();
    if (data) {
      setPosts(prev => [{ ...(data as unknown as Post), comment_count: [{ count: 0 }] }, ...prev]);
      setForm({ title: "", content: "", problem_url: "", problem_title: "", tags: "" }); setShowCreate(false);
    }
    setCreating(false);
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-cc-text flex items-center gap-2">
            <Rss size={20} className="text-cc-accent" /> Feed
          </h1>
          <p className="text-cc-muted text-xs md:text-sm mt-0.5">See what the community is working on</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-1.5 text-sm !px-4 !py-2.5 tap-scale-sm">
          <Plus size={15} /> <span className="hidden sm:inline">Post a doubt</span><span className="sm:hidden">Post</span>
        </button>
      </div>

      {/* Create Post */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="glass-card !p-5 md:!p-6 !border-cc-accent/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-cc-text font-semibold flex items-center gap-2 text-sm md:text-base">
                  <Sparkles size={15} className="text-cc-accent" /> Share your coding journey
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-cc-muted p-1.5 rounded-lg hover:bg-cc-hover tap-scale-sm"><X size={15} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  placeholder="Title — e.g. 'How does BFS work?'" className="glass-input" />
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={3}
                  placeholder="Describe your doubt…" className="glass-input resize-none" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="url" value={form.problem_url} onChange={e => setForm({ ...form, problem_url: e.target.value })}
                    placeholder="LeetCode URL (optional)" className="glass-input" />
                  <input type="text" value={form.problem_title} onChange={e => setForm({ ...form, problem_title: e.target.value })}
                    placeholder="Problem title (optional)" className="glass-input" />
                </div>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="Tags: dp, graphs, bfs" className="glass-input font-mono" />
                <div className="flex justify-end">
                  <button type="submit" disabled={creating} className="btn-primary text-sm !px-6 !py-2.5 tap-scale-sm flex items-center gap-2">
                    {creating ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting…</> : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="glass-card !p-16 text-center">
          <div className="text-4xl mb-3">💭</div>
          <p className="text-cc-muted text-sm mb-4">No posts yet. Be the first to share!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm !px-5 !py-2.5">Create Post</button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="glass-card !p-5 md:!p-6 card-hover"
            >
              {/* User info */}
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/users/${post.author?.id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-sm font-bold flex-shrink-0 tap-scale-sm">
                  {post.author?.username?.[0]?.toUpperCase()}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/users/${post.author?.id}`} className="font-medium text-cc-text text-sm hover:text-cc-accent transition-colors">{post.author?.username}</Link>
                  <div className="text-[10px] text-cc-muted">{timeAgo(post.created_at)}</div>
                </div>
                {post.tags?.[0] && (
                  <span className="tag-pill text-[10px]">{post.tags[0]}</span>
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                {post.problem_title && (
                  <a href={post.problem_url || "#"} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cc-link hover:text-cc-accent transition-colors mb-2">
                    <ExternalLink size={10} /> {post.problem_title}
                  </a>
                )}
                <Link href={`/feed/${post.id}`}>
                  <h3 className="text-cc-text font-semibold text-sm md:text-base mb-1.5 hover:text-cc-accent transition-colors">{post.title}</h3>
                </Link>
                <p className="text-cc-muted text-xs md:text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">{post.content}</p>
              </div>

              {/* Tags */}
              {post.tags?.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.slice(1).map(tag => <span key={tag} className="tag-pill text-[10px]">{tag}</span>)}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5 pt-3 border-t border-cc-border/20">
                <button
                  onClick={() => handleLike(post.id, post.likes)}
                  className={`flex items-center gap-1.5 text-xs transition-all like-btn ${liked.has(post.id) ? "text-cc-hard liked" : "text-cc-muted hover:text-cc-hard"}`}
                >
                  <Heart size={16} className={heartPopping === post.id ? "heart-pop" : ""} fill={liked.has(post.id) ? "currentColor" : "none"} />
                  <span className="font-medium">{post.likes}</span>
                </button>
                <Link href={`/feed/${post.id}`} className="flex items-center gap-1.5 text-xs text-cc-muted hover:text-cc-accent transition-colors like-btn">
                  <MessageCircle size={16} />
                  <span className="font-medium">{post.comment_count?.[0]?.count ?? 0}</span>
                </Link>
                <button className="flex items-center gap-1.5 text-xs text-cc-muted hover:text-cc-easy transition-colors like-btn ml-auto">
                  <Share2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
