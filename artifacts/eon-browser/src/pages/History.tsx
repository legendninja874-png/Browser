import { useState } from "react";
import { useLocation } from "wouter";
import { useListHistory, useClearHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search, Globe, Trash2, Clock, MoreVertical, ExternalLink, X, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; }
  catch { return null; }
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

export default function History() {
  const [, navigate]  = useLocation();
  const queryClient   = useQueryClient();
  const { data: history, isLoading } = useListHistory();
  const clearHistory  = useClearHistory();
  
  const [search, setSearch] = useState("");
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [activeContextMenu, setActiveContextMenu] = useState<number | null>(null);

  const handleClear = () => {
    clearHistory.mutate(undefined, { 
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
        setShowClearAlert(false);
      }
    });
  };

  const filtered = (history ?? []).filter(h =>
    !search ||
    h.title?.toLowerCase().includes(search.toLowerCase()) ||
    h.url.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, h) => {
    const d = new Date(h.visitedAt);
    let label = "";
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "MMMM d, yyyy");
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(h);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="flex flex-col h-full bg-background relative" onClick={() => setActiveContextMenu(null)}>
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-10 sticky top-0">
        <div className="flex items-center px-3 h-[48px]">
          <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[17px] font-semibold flex-1 text-center pr-2">History</span>
          <button
            onClick={() => setShowClearAlert(true)}
            disabled={clearHistory.isPending || !history?.length}
            className="h-8 px-3 rounded-full text-[13px] font-medium text-destructive/90 hover:bg-destructive/10 transition-colors disabled:opacity-40"
          >
            Clear all
          </button>
        </div>
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 h-[36px] px-3.5 bg-muted/60 rounded-full border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search history..."
              className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="w-5 h-5 flex items-center justify-center rounded-full bg-muted-foreground/20 text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="px-4 py-4 flex flex-col gap-6">
            <div>
              <Skeleton className="h-4 w-20 mb-3" />
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">No history</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Start browsing to see your history here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col px-2 py-2 gap-4">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                <div className="sticky top-[96px] z-10 bg-background/95 backdrop-blur py-1.5 px-4 text-[13px] font-semibold text-foreground/80 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                  {date}
                </div>
                <div className="flex flex-col">
                  {items.map((entry, i) => {
                    const fav = entry.favicon ?? getFavicon(entry.url);
                    const domain = getDomain(entry.url);
                    const isLast = i === items.length - 1;
                    
                    return (
                      <div key={entry.id} className="relative group flex items-center gap-3 px-3 h-[52px] hover:bg-muted/40 transition-colors rounded-xl mx-1">
                        <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {fav ? <img src={fav} alt="" className="w-4 h-4" /> : <Globe className="w-4 h-4 text-muted-foreground/60" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center border-b border-border/30 h-full" style={isLast ? { borderBottom: 'none' } : {}}>
                          <div className="text-[14px] text-foreground/90 truncate leading-snug">{entry.title || domain}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-muted-foreground truncate max-w-[200px]">{domain}</span>
                            <span className="text-[10px] text-muted-foreground/50">• {format(new Date(entry.visitedAt), "h:mm a")}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveContextMenu(activeContextMenu === entry.id ? null : entry.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Context Menu Dropdown */}
                        {activeContextMenu === entry.id && (
                          <div className="absolute right-6 top-10 z-50 w-48 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[13px] text-foreground text-left">
                              <ExternalLink className="w-4 h-4 text-muted-foreground" /> Open in new tab
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[13px] text-foreground text-left">
                              <Trash2 className="w-4 h-4 text-destructive" /> Remove from history
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      <AnimatePresence>
        {showClearAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearAlert(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-5 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-bold mb-2">Clear browsing history?</h3>
              <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
                This will remove all {history?.length || 0} items from your history across all connected devices. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearAlert(false)} className="flex-1 h-11 rounded-xl bg-muted font-medium text-[14px] hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={handleClear} disabled={clearHistory.isPending} className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-medium text-[14px] hover:bg-destructive/90 transition-colors flex items-center justify-center">
                  {clearHistory.isPending ? "Clearing..." : "Clear History"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
