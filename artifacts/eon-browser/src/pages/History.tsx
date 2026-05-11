import { useState } from "react";
import { useListHistory, useClearHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Globe, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday } from "date-fns";

function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch { return null; }
}

export default function History() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useListHistory();
  const clearHistory = useClearHistory();
  const [search, setSearch] = useState("");

  const handleClear = () =>
    clearHistory.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() }),
    });

  const filtered = history?.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.url.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const grouped = filtered.reduce((acc, h) => {
    const d = new Date(h.visitedAt);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
    if (!acc[label]) acc[label] = [];
    acc[label].push(h);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-5">

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 h-8 bg-white/5 border border-white/10 rounded px-2.5 focus-within:border-white/20 transition-colors">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search history..."
              className="flex-1 bg-transparent outline-none text-[12px] text-white/70 placeholder:text-white/25"
              data-testid="history-search"
            />
          </div>
          <button
            onClick={handleClear}
            disabled={clearHistory.isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-40"
            data-testid="btn-clear-history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        {/* Groups */}
        {isLoading
          ? <div className="space-y-1">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-full bg-white/5" />)}</div>
          : Object.keys(grouped).length === 0
            ? <div className="py-10 text-center text-sm text-white/25">No history found</div>
            : Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                <div className="text-[10px] font-medium text-white/25 uppercase tracking-widest mb-1.5 px-1">{date}</div>
                <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
                  {items.map(entry => {
                    const favicon = getFavicon(entry.url);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 h-9 px-3 hover:bg-white/4 group transition-colors">
                        <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">
                          {format(new Date(entry.visitedAt), "HH:mm")}
                        </span>
                        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                          {favicon
                            ? <img src={favicon} alt="" className="w-3 h-3" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            : <Globe className="w-3 h-3 text-white/25" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-white/60 truncate hover:text-white/80 transition-colors cursor-pointer">
                            {entry.title || entry.url}
                          </span>
                        </div>
                        {entry.visitCount > 1 && (
                          <span className="text-[10px] text-white/20 font-mono shrink-0">{entry.visitCount}x</span>
                        )}
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-white/50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
        }
      </div>
    </div>
  );
}
