import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id, title, content, problem_url, problem_title, tags, likes, created_at,
      author:users!posts_author_id_fkey(id, username, display_name, avatar_url),
      comment_count:comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: likedPosts } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", user.id);

  const likedIds = new Set((likedPosts || []).map((l) => l.post_id));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FeedClient
        currentUserId={user.id}
        posts={(posts as any) || []}
        likedPostIds={[...likedIds]}
      />
    </div>
  );
}
