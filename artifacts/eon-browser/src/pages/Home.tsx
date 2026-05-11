import { useState, useEffect } from "react";
import { useGetTopSites, useGetRecentHistory, useGetSmartSuggestions } from "@workspace/api-client-react";
import { Search, Sparkles, Globe, Clock, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const { data: topSites,    isLoading: loadingTop }  = useGetTopSites();
  const { data: recentHistory, isLoading: loadingHist } = useGetRecentHistory();
  const { data: suggestions, isLoading: loadingSugg }  = useGetSmartSuggestions();
  const now = useClock();

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-full overflow-y-auto bg-[#0d0e12]">
      <div className="max-w-[680px] mx-auto px-6 pt-16 pb-10 flex flex-col gap-10">

        {/* Clock + Search */}
        <div className="flex flex-col items-center gap-5">
          <div className="text-center">
            <div className="text-4xl font-light tracking-tight text-white tabular-nums">{timeStr}</div>
            <div className="text-[11px] text-white/30 uppercase tracking-widest mt-1">{dateStr}</div>
          </div>

          <div className="w-full flex items-center gap-2 h-9 bg-white/5 border border-white/10 rounded-lg px-3 hover:bg-white/7 hover:border-white/15 focus-within:border-primary/30 focus-within:bg-white/7 transition-colors">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search the web or ask EoN AI..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25"
              data-testid="home-search-input"
            />
            <Sparkles className="w-3.5 h-3.5 text-primary/50 shrink-0" />
          </div>
        </div>

        {/* Top Sites */}
        <section>
          <div className="flex items-center gap-1.5 mb-3">
            <Globe className="w-3 h-3 text-white/30" />
            <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Frequently visited</span>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {loadingTop
              ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-white/5" />)
              : topSites?.slice(0, 8).map((site, i) => (
                <a
                  key={i}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/6 transition-colors group"
                  data-testid={`top-site-${i}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center overflow-hidden group-hover:border-white/15 transition-colors">
                    {site.favicon
                      ? <img src={site.favicon} alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <Globe className="w-4 h-4 text-white/25" />
                    }
                  </div>
                  <span className="text-[10px] text-white/40 group-hover:text-white/60 truncate w-full text-center transition-colors">
                    {site.title?.split(" ")[0] || new URL(site.url).hostname.replace("www.", "")}
                  </span>
                </a>
              ))
            }
          </div>
        </section>

        {/* Two-column: suggestions + history */}
        <div className="grid grid-cols-2 gap-6">

          {/* Smart Suggestions */}
          <section>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3 h-3 text-primary/50" />
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Suggestions</span>
            </div>
            <div className="flex flex-col gap-px">
              {loadingSugg
                ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-9 rounded bg-white/5" />)
                : suggestions?.slice(0, 5).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 h-9 px-2 rounded hover:bg-white/6 group transition-colors"
                    data-testid={`suggestion-${i}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white/60 group-hover:text-white/80 truncate transition-colors leading-tight">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-white/25 truncate">{s.reason}</div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-white/50 opacity-0 group-hover:opacity-100 shrink-0 transition-all" />
                  </a>
                ))
              }
            </div>
          </section>

          {/* Recent History */}
          <section>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Clock className="w-3 h-3 text-white/30" />
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Recent</span>
            </div>
            <div className="flex flex-col gap-px">
              {loadingHist
                ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-9 rounded bg-white/5" />)
                : recentHistory?.slice(0, 6).map((entry, i) => {
                  const favicon = getFavicon(entry.url);
                  return (
                    <a
                      key={i}
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 h-9 px-2 rounded hover:bg-white/6 group transition-colors"
                      data-testid={`history-${i}`}
                    >
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {favicon
                          ? <img src={favicon} alt="" className="w-3.5 h-3.5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <Globe className="w-3 h-3 text-white/25" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-white/60 group-hover:text-white/80 truncate transition-colors">
                          {entry.title || entry.url}
                        </div>
                      </div>
                      <span className="text-[10px] text-white/25 shrink-0">{relativeTime(entry.visitedAt)}</span>
                    </a>
                  );
                })
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
