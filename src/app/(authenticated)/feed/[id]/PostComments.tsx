"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Send } from "lucide-react";

interface CommentAuthor {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: CommentAuthor | null;
}

export default function PostComments({
  postId,
  currentUserId,
  initialComments,
}: {
  postId: string;
  currentUserId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);

    const { data } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: currentUserId, content: text.trim() })
      .select(`*, author:users!comments_author_id_fkey(id, username, avatar_url)`)
      .single();

    if (data) setComments((prev) => [...prev, data as unknown as Comment]);
    setText("");
    setPosting(false);
  }

  return (
    <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
      <h2 className="text-lc-text font-semibold mb-4">Comments ({comments.length})</h2>

      <form onSubmit={handleComment} className="flex gap-2 mb-5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment or solution…"
          className="flex-1 bg-lc-card border border-lc-border rounded-lg px-3 py-2 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || posting}
          className="bg-lc-accent text-lc-bg p-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send size={15} />
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-lc-muted text-sm text-center py-6">No comments yet. Be the first to help!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-xs font-bold flex-shrink-0 mt-0.5">
                {c.author?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-lc-muted mb-1">
                  <span className="font-mono text-lc-text">{c.author?.username}</span>
                  <span>·</span>
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-lc-text/90 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
