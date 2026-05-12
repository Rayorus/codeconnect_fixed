import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const targetUserId = params.user;

  // Get conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id, participant1_id, participant2_id, last_message, last_message_at,
      p1:users!conversations_participant1_id_fkey(id, username, avatar_url),
      p2:users!conversations_participant2_id_fkey(id, username, avatar_url)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  // Get friends for starting new conversations
  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id, friend:users!friends_friend_id_fkey(id, username, avatar_url)")
    .eq("user_id", user.id);

  return (
    <ChatClient
      currentUserId={user.id}
      conversations={conversations as any || []}
      friends={friends as any || []}
      initialTargetUserId={targetUserId}
    />
  );
}
