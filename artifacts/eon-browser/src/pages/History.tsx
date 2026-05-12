import { useState } from "react";
import { useLocation } from "wouter";
import { useListHistory, useClearHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search, Globe, ExternalLink, Trash2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday } from "date-fns";

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
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

  const handleClear = () =>
    clearHistory.mutate(undefined, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() }) });

  const filtered = (history ?? []).filter(h =>
    !search ||
    h.title?.toLowerCase().includes(search.toLowerCase()) ||
    h.url.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, h) => {
    const d = new Date(h.visitedAt);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
    if (!acc[label]) acc[label] = [];
    acc[label].push(h);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold flex-1">History</span>
          <button
            onClick={handleClear}
            disabled={clearHistory.isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-sm transition-colors disabled:opacity-40"
            data-testid="btn-clear-history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2 h-9 mx-4 mb-3 px-3 bg-muted rounded-xl">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search history"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="history-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {isLoading ? (
          <div className="browser-card divide-y divide-border overflow-hidden">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Clock className="w-10 h-10 text-muted-foreground/30" />
            <div className="text-sm text-muted-foreground">No history found</div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <section key={date}>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">{date}</div>
              <div className="browser-card divide-y divide-border overflow-hidden">
                {items.map(entry => {
                  const fav = entry.favicon ?? getFavicon(entry.url);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {fav
                          ? <img src={fav} alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <Globe className="w-4.5 h-4.5 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground/85 truncate">{entry.title || getDomain(entry.url)}</div>
                        <div className="text-xs text-muted-foreground truncate">{getDomain(entry.url)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground/60 font-mono">
                          {format(new Date(entry.visitedAt), "HH:mm")}
                        </span>
                        <a href={entry.url} target="_blank" rel="noreferrer"
                          className="w-7 h-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 hidden group-hover:flex">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
