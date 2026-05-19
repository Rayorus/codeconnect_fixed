"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { Send, MessageCircle } from "lucide-react";

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
    <div className="glass-card !p-6">
      <h2 className="text-cc-text font-semibold mb-5 flex items-center gap-2">
        <MessageCircle size={16} className="text-cc-accent-light" />
        Comments ({comments.length})
      </h2>

      <form onSubmit={handleComment} className="flex gap-3 mb-6">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment or solution…"
          className="glass-input flex-1"
        />
        <button
          type="submit"
          disabled={!text.trim() || posting}
          className="btn-primary !p-3 !rounded-xl"
        >
          <Send size={15} />
        </button>
      </form>

      {comments.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-cc-muted text-sm">No comments yet. Be the first to help!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {c.author?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-cc-muted mb-1.5">
                  <span className="font-mono text-cc-text font-medium">{c.author?.username}</span>
                  <span className="text-cc-border">·</span>
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-cc-text/90 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
