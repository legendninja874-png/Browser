import { useState, useRef, useEffect } from "react";
import { useListConversations, useGetConversationMessages, useSendAiMessage, useGetSmartSuggestions, getGetConversationMessagesQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Send, User, Bot, Sparkles, FileText, Languages, Code2, Search as SearchIcon, PenTool } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Intelligence() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading: loadingConvos } = useListConversations();
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);

  const { data: messages, isLoading: loadingMessages } = useGetConversationMessages(activeConvoId || 0, {
    query: { enabled: !!activeConvoId, queryKey: getGetConversationMessagesQueryKey(activeConvoId || 0) }
  });

  const { data: suggestions } = useGetSmartSuggestions();
  const sendMessage = useSendAiMessage();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvoId) {
      setActiveConvoId(conversations[0].id);
    }
  }, [conversations, activeConvoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");
    
    sendMessage.mutate(
      { data: { content, conversationId: activeConvoId } },
      {
        onSuccess: (res) => {
          // If a new conversation was created implicitly by the backend, we might need to refetch list and set active
          queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeConvoId || 0) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Sidebar - History & Tools */}
      <div className="w-80 border-r border-white/10 bg-card/40 backdrop-blur-xl flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-gradient-to-br from-primary/10 to-transparent">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="text-primary w-7 h-7" />
            EoN Core
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Browser Intelligence System</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">AI Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <ToolBtn icon={FileText} label="Summarize" color="text-blue-400" />
                <ToolBtn icon={Languages} label="Translate" color="text-green-400" />
                <ToolBtn icon={Code2} label="Code Assist" color="text-yellow-400" />
                <ToolBtn icon={SearchIcon} label="Research" color="text-purple-400" />
                <ToolBtn icon={PenTool} label="Write" color="text-pink-400" />
                <ToolBtn icon={Sparkles} label="Explain" color="text-primary" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Conversations</h3>
              <div className="space-y-1">
                {loadingConvos ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />)
                ) : conversations?.map(convo => (
                  <div 
                    key={convo.id}
                    onClick={() => setActiveConvoId(convo.id)}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all flex flex-col gap-1
                      ${activeConvoId === convo.id ? 'bg-primary/20 border border-primary/30 neon-box' : 'hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    <span className={`text-sm font-medium truncate ${activeConvoId === convo.id ? 'text-primary' : 'text-gray-300'}`}>
                      {convo.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{convo.messageCount} messages</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {activeConvoId ? (
              loadingMessages ? (
                <div className="space-y-6">
                  <Skeleton className="h-24 w-3/4 bg-white/5 rounded-2xl rounded-tl-none" />
                  <Skeleton className="h-16 w-1/2 bg-primary/10 rounded-2xl rounded-tr-none ml-auto" />
                </div>
              ) : messages?.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center neon-box">
                     <BrainCircuit className="w-8 h-8 text-primary" />
                   </div>
                   <p className="text-muted-foreground">Start a new conversation with EoN AI.</p>
                </div>
              ) : (
                messages?.map(msg => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-primary/20 border-primary text-primary neon-box'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-secondary/10 border border-secondary/20 rounded-tr-none text-white' : 'glass-panel border-primary/30 rounded-tl-none text-gray-200'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )
            ) : (
               <div className="text-center py-20 flex flex-col items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center neon-box">
                   <BrainCircuit className="w-8 h-8 text-primary" />
                 </div>
                 <h2 className="text-2xl font-light text-white">EoN Intelligence</h2>
                 <p className="text-muted-foreground">Select or start a conversation.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-white/10 shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            {suggestions && suggestions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                {suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex-shrink-0 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground hover:text-white hover:border-primary/50 cursor-pointer transition-colors whitespace-nowrap" onClick={() => setInput(`Tell me about: ${s.title}`)}>
                    <Sparkles className="w-3 h-3 inline mr-1 text-primary" /> {s.title}
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative flex items-end gap-2 p-2 glass-panel border-primary/30 rounded-xl neon-box focus-within:border-primary transition-colors">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask EoN AI anything..."
                className="w-full bg-transparent border-0 resize-none outline-none text-white p-2 min-h-[44px] max-h-[200px]"
                rows={1}
              />
              <Button 
                onClick={handleSend} 
                disabled={sendMessage.isPending || !input.trim()}
                className="shrink-0 h-11 w-11 rounded-lg bg-primary text-black hover:bg-primary/80"
              >
                <Send className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className="p-3 rounded-xl border border-white/5 bg-black/40 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col items-center gap-2 group">
      <Icon className={`w-5 h-5 ${color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-white">{label}</span>
    </div>
  );
}
