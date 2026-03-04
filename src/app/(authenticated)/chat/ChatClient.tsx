"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { timeAgo } from "@/lib/utils";
import { Send, MessageSquare } from "lucide-react";

interface ChatUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ConvRow {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  p1: ChatUser | null;
  p2: ChatUser | null;
}

interface FriendRow {
  friend_id: string;
  friend: ChatUser | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: string;
  created_at: string;
}

export default function ChatClient({
  currentUserId,
  conversations,
  friends,
  initialTargetUserId,
}: {
  currentUserId: string;
  conversations: ConvRow[];
  friends: FriendRow[];
  initialTargetUserId?: string;
}) {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [convList, setConvList] = useState(conversations);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const getOtherUser = (conv: ConvRow): ChatUser | null => {
    return conv.participant1_id === currentUserId ? conv.p2 : conv.p1;
  };

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, [supabase]);

  // Initialize with target user if provided
  useEffect(() => {
    if (initialTargetUserId) {
      const existing = convList.find(
        (c) =>
          (c.participant1_id === currentUserId && c.participant2_id === initialTargetUserId) ||
          (c.participant2_id === currentUserId && c.participant1_id === initialTargetUserId)
      );
      if (existing) setActiveConvId(existing.id);
    }
  }, [initialTargetUserId, convList, currentUserId]);

  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, loadMessages, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startOrOpenConversation(friendId: string) {
    const existing = convList.find(
      (c) =>
        (c.participant1_id === currentUserId && c.participant2_id === friendId) ||
        (c.participant2_id === currentUserId && c.participant1_id === friendId)
    );

    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    const { data } = await supabase
      .from("conversations")
      .insert({ participant1_id: currentUserId, participant2_id: friendId })
      .select(`id, participant1_id, participant2_id, last_message, last_message_at,
        p1:users!conversations_participant1_id_fkey(id, username, avatar_url),
        p2:users!conversations_participant2_id_fkey(id, username, avatar_url)`)
      .single();

    if (data) {
      setConvList((prev) => [data as unknown as ConvRow, ...prev]);
      setActiveConvId(data.id);
    }
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConvId || sending) return;
    setSending(true);

    const encrypted = encryptMessage(newMsg.trim());

    await supabase.from("messages").insert({
      conversation_id: activeConvId,
      sender_id: currentUserId,
      content: encrypted,
      status: "sent",
    });

    await supabase
      .from("conversations")
      .update({ last_message: newMsg.trim().slice(0, 50), last_message_at: new Date().toISOString() })
      .eq("id", activeConvId);

    setNewMsg("");
    setSending(false);
    // Auto-refresh messages after sending
    await loadMessages(activeConvId);
  }

  const activeConv = convList.find((c) => c.id === activeConvId);
  const activeUser = activeConv ? getOtherUser(activeConv) : null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r border-lc-border bg-lc-surface flex flex-col">
        <div className="p-4 border-b border-lc-border">
          <h2 className="text-lc-text font-semibold">Messages</h2>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {convList.length === 0 && friends.length === 0 && (
            <p className="text-lc-muted text-xs text-center p-4">Add friends to start chatting</p>
          )}

          {convList.map((conv) => {
            const other = getOtherUser(conv);
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 hover:bg-lc-hover transition-colors border-b border-lc-border/50 ${activeConvId === conv.id ? "bg-lc-accent/10" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-xs font-bold flex-shrink-0">
                    {other?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-lc-text font-mono truncate">{other?.username}</p>
                    {conv.last_message && (
                      <p className="text-xs text-lc-muted truncate">{conv.last_message}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* New conversation from friends */}
          {friends.length > 0 && (
            <div className="p-3 border-t border-lc-border">
              <p className="text-xs text-lc-muted mb-2">Start new chat</p>
              {friends
                .filter((f) => !convList.some(
                  (c) =>
                    (c.participant1_id === currentUserId && c.participant2_id === f.friend_id) ||
                    (c.participant2_id === currentUserId && c.participant1_id === f.friend_id)
                ))
                .map((f) => (
                  <button
                    key={f.friend_id}
                    onClick={() => startOrOpenConversation(f.friend_id)}
                    className="w-full text-left p-2 hover:bg-lc-hover rounded text-sm text-lc-muted hover:text-lc-text transition-colors font-mono"
                  >
                    + {f.friend?.username}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConv && activeUser ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-lc-border bg-lc-surface flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-xs font-bold">
              {activeUser.username[0].toUpperCase()}
            </div>
            <span className="font-mono text-lc-text font-medium">{activeUser.username}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const text = decryptMessage(msg.content);
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={isMine ? "msg-sent" : "msg-received"}>
                    <p>{text}</p>
                    <p className={`text-xs mt-1 ${isMine ? "text-lc-bg/60" : "text-lc-muted"}`}>
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-lc-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-sm text-lc-text placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                className="bg-lc-accent text-lc-bg p-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <MessageSquare size={48} className="text-lc-border mx-auto mb-4" />
            <p className="text-lc-muted">Select a conversation or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
