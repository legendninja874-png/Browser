import { useListHistory, useClearHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon, Search, Trash2, Globe, Clock, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";

export default function History() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useListHistory();
  const clearHistory = useClearHistory();

  const [search, setSearch] = useState("");

  const handleClear = () => {
    clearHistory.mutate(
      undefined,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
        }
      }
    );
  };

  const filteredHistory = history?.filter(h => h.title.toLowerCase().includes(search.toLowerCase()) || h.url.toLowerCase().includes(search.toLowerCase()));

  // Group by date
  const groupedHistory = filteredHistory?.reduce((acc, curr) => {
    const date = new Date(curr.visitedAt);
    let dateStr = "";
    if (isToday(date)) dateStr = "Today";
    else if (isYesterday(date)) dateStr = "Yesterday";
    else dateStr = format(date, "MMMM d, yyyy");

    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(curr);
    return acc;
  }, {} as Record<string, typeof history>) || {};

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <HistoryIcon className="text-accent w-8 h-8" />
            History
          </h1>
          <p className="text-muted-foreground">Your browsing timeline.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-black/50 border-white/10"
            />
          </div>
          <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-8">
        {isLoading ? (
          <div className="space-y-4">
             {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />)}
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
            No history found.
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10 border-b border-white/5">
                {date}
              </h3>
              
              <div className="bg-card/40 border border-white/10 rounded-xl overflow-hidden glass-panel">
                {items.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group
                      ${index !== items.length - 1 ? 'border-b border-white/5' : ''}
                    `}
                  >
                    <div className="text-xs text-muted-foreground font-mono w-16 shrink-0">
                      {format(new Date(entry.visitedAt), "HH:mm")}
                    </div>
                    
                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                      {entry.favicon ? (
                        <img src={entry.favicon} alt="" className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <a href={entry.url} target="_blank" rel="noreferrer" className="font-medium text-white hover:text-accent transition-colors truncate block">
                        {entry.title || entry.url}
                      </a>
                      <p className="text-xs text-muted-foreground truncate">{entry.url}</p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" asChild>
                          <a href={entry.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
