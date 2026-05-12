import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import PostComments from "./PostComments";
import { ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: post } = await supabase
    .from("posts")
    .select(`*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url)`)
    .eq("id", id)
    .single();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select(`*, author:users!comments_author_id_fkey(id, username, avatar_url)`)
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/feed" className="flex items-center gap-1.5 text-sm text-lc-muted hover:text-lc-text transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Feed
      </Link>

      <div className="bg-lc-surface border border-lc-border rounded-xl p-6 mb-5">
        <div className="flex items-center gap-2 text-xs text-lc-muted mb-3">
          <span className="font-mono text-lc-text">{(post.author as { username: string } | null)?.username}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        <h1 className="text-xl font-bold text-lc-text mb-3">{post.title}</h1>
        <p className="text-lc-muted text-sm leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

        {post.problem_title && (
          <a
            href={post.problem_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-lc-link hover:underline mb-4"
          >
            <ExternalLink size={13} />
            {post.problem_title}
          </a>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag: string) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <PostComments
        postId={id}
        currentUserId={user.id}
        initialComments={comments || []}
      />
    </div>
  );
}
