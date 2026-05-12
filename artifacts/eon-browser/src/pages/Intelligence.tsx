import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListConversations, useGetConversationMessages, useSendAiMessage, useGetSmartSuggestions,
  getGetConversationMessagesQueryKey, getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Send, User, Bot, Sparkles, Plus,
  FileText, Languages, Code2, Search, PenTool, X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

function relTime(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const TOOLS = [
  { icon: FileText,  label: "Summarize", color: "text-blue-400" },
  { icon: Languages, label: "Translate", color: "text-green-400" },
  { icon: Code2,     label: "Code",      color: "text-yellow-400" },
  { icon: Search,    label: "Research",  color: "text-violet-400" },
  { icon: PenTool,   label: "Write",     color: "text-pink-400" },
  { icon: Sparkles,  label: "Explain",   color: "text-primary" },
];

export default function Intelligence() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: conversations, isLoading: loadingConvos } = useListConversations();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { data: messages, isLoading: loadingMsgs } = useGetConversationMessages(activeId ?? 0, {
    query: { enabled: !!activeId, queryKey: getGetConversationMessagesQueryKey(activeId ?? 0) },
  });
  const { data: suggestions } = useGetSmartSuggestions();
  const sendMsg   = useSendAiMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMsg.isPending) return;
    const content = input;
    setInput("");
    sendMsg.mutate({ data: { content, conversationId: activeId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeId ?? 0) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border flex items-center gap-3 px-4 h-12">
        <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold flex-1">EoN Intelligence</span>
        <button onClick={() => setShowSidebar(!showSidebar)} className="h-7 px-3 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
          Chats
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Conversations sidebar overlay */}
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 z-10"
                onClick={() => setShowSidebar(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-20 flex flex-col"
              >
                <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
                  <span className="text-sm font-semibold text-foreground/80">Conversations</span>
                  <button onClick={() => setShowSidebar(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AI tools */}
                <div className="px-3 py-3 border-b border-border shrink-0">
                  <div className="grid grid-cols-3 gap-1">
                    {TOOLS.map(({ icon: Icon, label, color }) => (
                      <button key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors group">
                        <Icon className={`w-4 h-4 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {loadingConvos
                    ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 mx-3 mb-1 rounded-xl" />)
                    : conversations?.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveId(c.id); setShowSidebar(false); }}
                        className={`flex flex-col items-start w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors
                          ${activeId === c.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                      >
                        <span className={`text-sm truncate w-full ${activeId === c.id ? "text-foreground/90 font-medium" : "text-foreground/70"}`}>
                          {c.title}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">{c.messageCount} messages · {relTime(c.updatedAt)} ago</span>
                      </button>
                    ))
                  }
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!activeId ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                  <Bot className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground/60">EoN Intelligence</div>
                  <div className="text-xs text-muted-foreground mt-1">Select a chat or start a new one</div>
                </div>
              </div>
            ) : loadingMsgs ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-3/4 rounded-2xl" />
                <Skeleton className="h-10 w-1/2 rounded-2xl ml-auto" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Bot className="w-8 h-8 text-muted-foreground/40" />
                <div className="text-sm text-muted-foreground">Send a message to get started</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                {messages?.map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.role === "user" ? "bg-muted border-border" : "bg-primary/10 border-primary/20"
                    }`}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-foreground/60" />
                        : <Bot className="w-3.5 h-3.5 text-primary/70" />
                      }
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[78%] ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-card border border-border text-foreground/85 rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sendMsg.isPending && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex gap-1">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-border bg-card/95 backdrop-blur">
            {/* Quick suggestion pills */}
            {suggestions && suggestions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(`Tell me about: ${s.title}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-primary/60" />
                    {s.title.slice(0, 28)}{s.title.length > 28 ? "…" : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask EoN Intelligence..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[22px] max-h-[100px] leading-snug"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={sendMsg.isPending || !input.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-30 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
