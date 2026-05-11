import { useState, useRef, useEffect } from "react";
import {
  useListConversations, useGetConversationMessages, useSendAiMessage, useGetSmartSuggestions,
  getGetConversationMessagesQueryKey, getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Send, User, Bot, Sparkles, FileText, Languages, Code2, Search as SearchIcon, PenTool, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const AI_TOOLS = [
  { icon: FileText,    label: "Summarize",  color: "text-blue-400" },
  { icon: Languages,   label: "Translate",  color: "text-emerald-400" },
  { icon: Code2,       label: "Code",       color: "text-amber-400" },
  { icon: SearchIcon,  label: "Research",   color: "text-violet-400" },
  { icon: PenTool,     label: "Write",      color: "text-pink-400" },
  { icon: Sparkles,    label: "Explain",    color: "text-primary" },
];

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function Intelligence() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading: loadingConvos } = useListConversations();
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const { data: messages, isLoading: loadingMessages } = useGetConversationMessages(activeConvoId ?? 0, {
    query: { enabled: !!activeConvoId, queryKey: getGetConversationMessagesQueryKey(activeConvoId ?? 0) },
  });
  const { data: suggestions } = useGetSmartSuggestions();
  const sendMessage  = useSendAiMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvoId) {
      setActiveConvoId(conversations[0].id);
    }
  }, [conversations, activeConvoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");
    sendMessage.mutate(
      { data: { content, conversationId: activeConvoId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeConvoId ?? 0) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      },
    );
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">

      {/* Left panel — conversations */}
      <div className="w-[200px] flex flex-col border-r border-white/8 bg-sidebar shrink-0">

        <div className="flex items-center justify-between px-3 h-9 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[11px] font-semibold text-white/60">EoN AI</span>
          </div>
          <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Tools */}
        <div className="px-2 py-2 border-b border-white/8 shrink-0">
          <div className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5 px-1">Tools</div>
          <div className="grid grid-cols-3 gap-1">
            {AI_TOOLS.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1 py-1.5 px-1 rounded hover:bg-white/8 transition-colors group"
              >
                <Icon className={`w-3.5 h-3.5 ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <span className="text-[9px] text-white/30 group-hover:text-white/50">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          <div className="py-1 px-1.5 flex flex-col gap-px">
            <div className="text-[10px] text-white/25 uppercase tracking-widest px-2 py-1">Conversations</div>
            {loadingConvos
              ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded bg-white/5" />)
              : conversations?.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvoId(c.id)}
                  className={`flex flex-col items-start gap-0.5 w-full px-2 py-2 rounded text-left transition-colors
                    ${activeConvoId === c.id ? "bg-white/10 border-l-2 border-primary pl-[6px]" : "hover:bg-white/6 border-l-2 border-transparent pl-[6px]"}`}
                >
                  <span className={`text-[11px] truncate w-full ${activeConvoId === c.id ? "text-white/80" : "text-white/45"}`}>
                    {c.title}
                  </span>
                  <span className="text-[10px] text-white/25">{c.messageCount} msgs · {relativeTime(c.updatedAt)}</span>
                </button>
              ))
            }
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {!activeConvoId ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <BrainCircuit className="w-8 h-8 text-primary/30" />
                <p className="text-sm text-white/25">Select a conversation or start a new one</p>
              </div>
            ) : loadingMessages ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4 bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-1/2 bg-white/5 rounded-lg ml-auto" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <BrainCircuit className="w-8 h-8 text-primary/30" />
                <p className="text-sm text-white/25">Send a message to get started</p>
              </div>
            ) : (
              messages?.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.role === "user"
                      ? "bg-white/5 border-white/10 text-white/40"
                      : "bg-primary/10 border-primary/20 text-primary/60"
                  }`}>
                    {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm leading-relaxed max-w-[78%] ${
                    msg.role === "user"
                      ? "bg-white/6 border border-white/10 text-white/75 rounded-tr-sm"
                      : "bg-primary/6 border border-primary/15 text-white/70 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {sendMessage.isPending && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary/60" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-primary/6 border border-primary/15">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-3 border-t border-white/8 shrink-0 bg-background/95">
          <div className="max-w-2xl mx-auto">
            {/* Suggestion pills */}
            {suggestions && suggestions.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(`Tell me about: ${s.title}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/8 bg-white/4 text-[11px] text-white/40 hover:text-white/60 hover:border-white/15 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-primary/40" />
                    {s.title.slice(0, 30)}{s.title.length > 30 ? "..." : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-primary/25 focus-within:bg-white/6 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask EoN Intelligence..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white/75 placeholder:text-white/25 resize-none min-h-[24px] max-h-[120px] leading-snug"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={sendMessage.isPending || !input.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/80 hover:bg-primary text-black transition-colors disabled:opacity-30 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
