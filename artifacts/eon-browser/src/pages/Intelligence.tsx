import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListConversations, useGetConversationMessages, useSendAiMessage, useGetSmartSuggestions,
  getGetConversationMessagesQueryKey, getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send, User, BrainCircuit, Sparkles, Plus, FileText, Languages, Code2, Search, PenTool, Menu, X, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

function relTime(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

const TOOLS = [
  { icon: FileText,  label: "Summarize", action: "Summarize the current page: " },
  { icon: Languages, label: "Translate", action: "Translate this text to English: " },
  { icon: Code2,     label: "Code",      action: "Write a script to: " },
  { icon: Search,    label: "Research",  action: "Research the topic of: " },
  { icon: PenTool,   label: "Write",     action: "Draft an email about: " },
  { icon: Sparkles,  label: "Explain",   action: "Explain this concept simply: " },
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
  const sendMsg = useSendAiMessage();
  
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMsg.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMsg.isPending) return;
    const content = input;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    sendMsg.mutate({ data: { content, conversationId: activeId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeId ?? 0) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
    });
  };

  const startNewChat = () => {
    setActiveId(null);
    setShowSidebar(false);
    setInput("");
  };

  const handleToolClick = (action: string) => {
    setInput(action);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-background/90 backdrop-blur-xl border-b border-border/50 flex items-center px-2 h-[56px] z-10">
        <button onClick={() => setShowSidebar(true)} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 flex justify-center items-center gap-2">
          <span className="text-[16px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">EoN AI</span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <button onClick={startNewChat} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Overlay */}
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowSidebar(false)} />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute left-0 top-0 bottom-0 w-[80%] max-w-sm bg-card border-r border-border shadow-2xl z-50 flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-[18px]">Conversations</h2>
                  <button onClick={() => setShowSidebar(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3">
                  <button onClick={startNewChat} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium text-[14px] hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4" /> New Conversation
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                  {loadingConvos ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-xl" />)
                  ) : conversations?.map(c => (
                    <button key={c.id} onClick={() => { setActiveId(c.id); setShowSidebar(false); }} className={`w-full flex flex-col text-left px-4 py-3 rounded-xl transition-colors ${activeId === c.id ? "bg-muted" : "hover:bg-muted/50"}`}>
                      <span className={`text-[14px] truncate w-full ${activeId === c.id ? "font-semibold" : "font-medium text-foreground/80"}`}>{c.title}</span>
                      <span className="text-[11px] text-muted-foreground mt-1">{relTime(c.updatedAt)} ago • {c.messageCount} msgs</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-dot-pattern">
          <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
            {!activeId || (messages?.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]">
                  <BrainCircuit className="w-10 h-10 text-primary animate-[pulse_3s_ease-in-out_infinite]" strokeWidth={1.5} />
                </div>
                <h2 className="text-[24px] font-bold text-foreground mb-2">How can I help?</h2>
                <p className="text-[14px] text-muted-foreground text-center mb-8">Ask me anything about the current page, summarize long articles, or generate new ideas.</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[
                    { label: "Summarize page", icon: FileText },
                    { label: "Find key points", icon: Sparkles },
                    { label: "Translate text", icon: Languages },
                    { label: "Explain terms", icon: Search }
                  ].map((s, i) => (
                    <button key={i} onClick={() => handleToolClick(`${s.label}: `)} className="bg-card border border-border/50 hover:bg-muted/50 p-3 rounded-2xl flex flex-col gap-2 items-start transition-all active:scale-[0.98]">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <s.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[13px] font-medium text-foreground/80">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingMsgs ? (
              <div className="space-y-6">
                <Skeleton className="h-16 w-[80%] rounded-2xl rounded-tl-sm bg-card border border-border" />
                <Skeleton className="h-12 w-[60%] rounded-2xl rounded-tr-sm bg-primary/20 ml-auto" />
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                {messages?.map(msg => (
                  <div key={msg.id} className={`flex gap-3 w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 ${msg.role === "user" ? "bg-muted" : "bg-gradient-to-br from-primary to-purple-500 shadow-sm"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4 text-muted-foreground" /> : <Sparkles className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                          : "bg-card border border-border/50 text-foreground rounded-2xl rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 px-1">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                    </div>
                  </div>
                ))}
                
                {sendMsg.isPending && (
                  <div className="flex gap-3 w-full flex-row">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-sm flex items-center justify-center shrink-0 mt-auto mb-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-card border border-border/50 flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-background/90 backdrop-blur-xl border-t border-border/50 p-3 pt-2 pb-safe">
            {/* Tools Scroll */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-3 px-1">
              {TOOLS.map((t, i) => (
                <button key={i} onClick={() => handleToolClick(t.action)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-[12px] font-medium text-foreground/70 hover:text-foreground hover:bg-muted whitespace-nowrap shrink-0 transition-colors">
                  <t.icon className="w-3.5 h-3.5 opacity-70" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative flex items-end gap-2 bg-card border border-border/80 shadow-sm rounded-[24px] px-2 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
              <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0 mb-0.5 ml-0.5">
                <Plus className="w-5 h-5" />
              </button>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-0 outline-none resize-none text-[15px] py-2.5 max-h-[120px] placeholder:text-muted-foreground"
                rows={1}
                style={{ minHeight: "44px" }}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMsg.isPending}
                className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 mb-0.5 mr-0.5 transition-all duration-300 ${
                  input.trim() ? "bg-primary text-white shadow-md hover:scale-105 active:scale-95" : "bg-muted text-muted-foreground"
                }`}
              >
                <ArrowDown className="w-5 h-5 -rotate-90" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
