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
    <div className="p-4 pt-14 md:pt-6 md:p-8 max-w-2xl mx-auto">
      <Link href="/feed" className="flex items-center gap-1.5 text-sm text-cc-muted hover:text-cc-text transition-colors mb-6 px-3 py-1.5 rounded-lg hover:bg-cc-hover w-fit">
        <ArrowLeft size={14} /> Back to Feed
      </Link>

      <div className="glass-card !p-7 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
            {(post.author as { username: string } | null)?.username?.[0]?.toUpperCase()}
          </div>
          <div className="text-xs text-cc-muted">
            <span className="font-mono text-cc-text font-medium">{(post.author as { username: string } | null)?.username}</span>
            <span className="mx-1.5">·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-cc-text mb-3">{post.title}</h1>
        <p className="text-cc-muted text-sm leading-relaxed whitespace-pre-wrap mb-5">{post.content}</p>

        {post.problem_title && (
          <a
            href={post.problem_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cc-link hover:text-cc-accent-light mb-4 transition-colors"
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
