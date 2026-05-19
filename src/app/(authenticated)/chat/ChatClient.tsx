"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { timeAgo } from "@/lib/utils";
import { Send, MessageSquare, Plus, Lock, ArrowLeft, ChevronRight, Search, MoreVertical } from "lucide-react";

interface ChatUser { id: string; username: string; avatar_url: string | null; }
interface ConvRow { id: string; participant1_id: string; participant2_id: string; last_message: string | null; last_message_at: string | null; p1: ChatUser | null; p2: ChatUser | null; }
interface FriendRow { friend_id: string; friend: ChatUser | null; }
interface Message { id: string; conversation_id: string; sender_id: string; content: string; status: string; created_at: string; }

function dedupeMessages(msgs: Message[]): Message[] {
  const seen = new Map<string, Message>();
  for (const m of msgs) seen.set(m.id, m);
  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}


export default function ChatClient({ currentUserId, conversations, friends, initialTargetUserId }: {
  currentUserId: string; conversations: ConvRow[]; friends: FriendRow[]; initialTargetUserId?: string;
}) {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [convList, setConvList] = useState<ConvRow[]>(() => {
    const seen = new Map<string, ConvRow>();
    for (const c of conversations) {
      const key = [c.participant1_id, c.participant2_id].sort().join("-");
      if (!seen.has(key) || (c.last_message_at && (!seen.get(key)!.last_message_at || c.last_message_at > seen.get(key)!.last_message_at!))) {
        seen.set(key, c);
      }
    }
    return Array.from(seen.values());
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const getOtherUser = (conv: ConvRow): ChatUser | null =>
    conv.participant1_id === currentUserId ? conv.p2 : conv.p1;

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    if (data) setMessages(dedupeMessages(data));
  }, [supabase]);

  useEffect(() => {
    if (initialTargetUserId) {
      const existing = convList.find(c =>
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
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        setMessages(prev => dedupeMessages([...prev, payload.new as Message]));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, loadMessages, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startOrOpenConversation(friendId: string) {
    const existing = convList.find(c =>
      (c.participant1_id === currentUserId && c.participant2_id === friendId) ||
      (c.participant2_id === currentUserId && c.participant1_id === friendId)
    );
    if (existing) { setActiveConvId(existing.id); return; }

    const { data } = await supabase.from("conversations")
      .insert({ participant1_id: currentUserId, participant2_id: friendId })
      .select(`id, participant1_id, participant2_id, last_message, last_message_at,
        p1:users!conversations_participant1_id_fkey(id, username, avatar_url),
        p2:users!conversations_participant2_id_fkey(id, username, avatar_url)`)
      .single();
    if (data) {
      const newConv = data as unknown as ConvRow;
      setConvList(prev => {
        if (prev.some(c => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConvId(data.id);
    }
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConvId || sending) return;
    setSending(true);
    const text = newMsg.trim();
    const encrypted = encryptMessage(text);
    setNewMsg("");

    await supabase.from("messages").insert({
      conversation_id: activeConvId,
      sender_id: currentUserId,
      content: encrypted,
      status: "sent",
    });
    await supabase.from("conversations").update({
      last_message: text.slice(0, 50),
      last_message_at: new Date().toISOString(),
    }).eq("id", activeConvId);

    setSending(false);
  }

  const activeConv = convList.find(c => c.id === activeConvId);
  const activeUser = activeConv ? getOtherUser(activeConv) : null;
  const showChatArea = activeConv && activeUser;

  const friendsWithoutConv = friends.filter(f =>
    !convList.some(c =>
      (c.participant1_id === currentUserId && c.participant2_id === f.friend_id) ||
      (c.participant2_id === currentUserId && c.participant1_id === f.friend_id)
    )
  );

  // Filter conversations by search
  const filteredConvs = convList.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherUser(conv);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[100dvh]">
      {/* ── Sidebar ── */}
      <div className={`${showChatArea ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col border-r border-cc-border/40 bg-cc-bg/50`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-cc-border/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-cc-text font-bold text-xl tracking-tight">Messages</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-cc-muted">
              <Lock size={9} /> Encrypted
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cc-muted/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-cc-border/20 rounded-xl text-sm text-cc-text placeholder:text-cc-muted/30 focus:outline-none focus:border-cc-accent/30 transition-colors"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 && friends.length === 0 && (
            <div className="text-center p-10">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-cc-muted text-sm">Add friends to start chatting</p>
            </div>
          )}

          {filteredConvs.map((conv, i) => {
            const other = getOtherUser(conv);
            if (!other) return null;
            const isActive = activeConvId === conv.id;

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-5 py-3.5 flex items-center gap-3.5 transition-all duration-150 tap-scale-sm relative border-b border-cc-border/10 ${
                  isActive ? "bg-cc-accent/8" : "hover:bg-white/[0.02]"
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-cc-accent rounded-r-full" />}
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {other.username?.[0]?.toUpperCase()}
                  </div>
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-cc-easy border-2 border-cc-bg rounded-full online-dot" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-cc-accent-light" : "text-cc-text"}`}>
                      {other.username}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-[10px] text-cc-muted/50 flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-cc-muted truncate">{conv.last_message}</p>
                  )}
                </div>
              </motion.button>
            );
          })}

          {/* New chat section */}
          {friendsWithoutConv.length > 0 && (
            <div className="px-5 py-3 border-t border-cc-border/30">
              <p className="text-[10px] text-cc-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                <Plus size={10} /> Start new chat
              </p>
              {friendsWithoutConv.map(f => (
                <button
                  key={f.friend_id}
                  onClick={() => startOrOpenConversation(f.friend_id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm text-cc-muted hover:text-cc-text hover:bg-white/[0.03] transition-all tap-scale-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-cc-accent/10 flex items-center justify-center text-cc-accent text-xs font-semibold">
                    {f.friend?.username?.[0]?.toUpperCase()}
                  </div>
                  {f.friend?.username}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      {showChatArea ? (
        <div className="flex-1 flex flex-col w-full min-h-0 bg-cc-bg/30">
          {/* Chat header */}
          <div className="px-4 md:px-6 py-3 border-b border-cc-border/30 bg-cc-bg/60 backdrop-blur-md flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveConvId(null)} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-cc-hover tap-scale-sm">
                <ArrowLeft size={20} className="text-cc-accent" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-sm font-semibold">
                  {activeUser.username[0].toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cc-easy border-2 border-cc-bg rounded-full online-dot" />
              </div>
              <div>
                <span className="text-cc-text font-semibold text-[15px]">{activeUser.username}</span>
                <p className="text-[10px] text-cc-easy flex items-center gap-1">Active now</p>
              </div>
            </div>
            <button className="p-2 hover:bg-cc-hover rounded-lg transition-colors tap-scale-sm">
              <MoreVertical size={18} className="text-cc-muted" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col justify-end min-h-0">
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  const text = decryptMessage(msg.content);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18, ease: [0.22, 0.68, 0, 1] }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={isMine ? "msg-sent" : "msg-received"}>
                        <p className="break-words leading-relaxed">{text}</p>
                        <p className={`text-[9px] mt-1 ${isMine ? "text-white/35" : "text-cc-muted/60"}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="px-3 py-2.5 md:px-5 md:py-3 border-t border-cc-border/20 bg-cc-bg/60 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-white/[0.04] rounded-full px-4 py-1 border border-cc-border/15 focus-within:border-cc-accent/30 transition-colors">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message…"
                className="flex-1 bg-transparent border-none outline-none text-cc-text text-sm placeholder:text-cc-muted/40 py-2"
              />
              {newMsg.trim() && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={sendMessage}
                  disabled={sending}
                  className="w-7 h-7 rounded-full bg-cc-accent text-white flex items-center justify-center tap-scale-sm flex-shrink-0"
                >
                  <Send size={13} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center bg-cc-bg/20">
          <div>
            <div className="w-16 h-16 rounded-full bg-cc-accent/6 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-cc-accent/20" />
            </div>
            <p className="text-cc-muted font-medium text-lg">Messages</p>
            <p className="text-cc-muted/40 text-sm mt-1">Select a conversation to start</p>
          </div>
        </div>
      )}
    </div>
  );
}
