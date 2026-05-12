import { useState } from "react";
import { useLocation } from "wouter";
import { useGetTopSites, useGetRecentHistory, useGetSmartSuggestions, useListTabs } from "@workspace/api-client-react";
import { Mic, ScanLine, Globe, Bookmark, Clock, Search, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch { return null; }
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

const QUICK_SHORTCUTS = [
  { label: "Bookmarks", icon: Bookmark,  bg: "bg-blue-600",   href: "/bookmarks" },
  { label: "History",   icon: Clock,     bg: "bg-orange-500", href: "/history" },
  { label: "Downloads", icon: Globe,     bg: "bg-green-600",  href: "/downloads" },
  { label: "Search",    icon: Search,    bg: "bg-violet-600", href: "/browser" },
];

export default function Home() {
  const [, navigate]  = useLocation();
  const [query, setQuery] = useState("");

  const { data: topSites,     isLoading: loadingTop  } = useGetTopSites();
  const { data: recentHistory, isLoading: loadingHist } = useGetRecentHistory();
  const { data: suggestions,  isLoading: loadingSugg } = useGetSmartSuggestions();
  const { data: tabs } = useListTabs();
  const recentTabs = tabs?.filter(t => !t.isActive && t.url !== "about:newtab").slice(0, 4) ?? [];

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-lg mx-auto px-4 pt-16 pb-6 flex flex-col gap-8">

        {/* Branding */}
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-5xl font-light tracking-tight text-foreground/90 select-none">EoN</h1>

          {/* Search bar — Lemur style */}
          <div className="w-full flex items-center gap-3 h-12 px-4 bg-card border border-border rounded-full shadow-sm hover:shadow-md transition-shadow">
            <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && query.trim()) navigate("/browser"); }}
              placeholder="Search or type URL"
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              data-testid="home-search"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Mic className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ScanLine className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick shortcuts */}
        <div className="flex items-start justify-center gap-6">
          {QUICK_SHORTCUTS.map(({ label, icon: Icon, bg, href }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            </button>
          ))}
        </div>

        {/* Top Sites */}
        {(loadingTop || (topSites && topSites.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground/70">Top Sites</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {loadingTop
                ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <Skeleton className="w-10 h-2.5 rounded" />
                  </div>
                ))
                : topSites?.slice(0, 8).map((site, i) => {
                  const fav = getFavicon(site.url);
                  return (
                    <a
                      key={i}
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                      data-testid={`top-site-${i}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden group-hover:border-primary/30 transition-colors shadow-sm">
                        {fav
                          ? <img src={fav} alt="" className="w-7 h-7" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <Globe className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate w-full text-center transition-colors">
                        {site.title?.split(" ")[0] ?? getDomain(site.url)}
                      </span>
                    </a>
                  );
                })
              }
            </div>
          </section>
        )}

        {/* Continue browsing */}
        {recentTabs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground/70">Continue browsing</span>
              <button onClick={() => navigate("/tabs")} className="text-xs text-primary flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="browser-card divide-y divide-border overflow-hidden">
              {recentTabs.map(tab => {
                const fav = tab.favicon ?? getFavicon(tab.url);
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate("/browser")}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {fav
                        ? <img src={fav} alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <Globe className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground/80 truncate">{tab.title || getDomain(tab.url)}</div>
                      <div className="text-xs text-muted-foreground truncate">{getDomain(tab.url)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Smart Suggestions */}
        {(loadingSugg || (suggestions && suggestions.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground/70">For you</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {loadingSugg
                ? Array(3).fill(0).map((_, i) => (
                  <div key={i} className="browser-card p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
                : suggestions?.slice(0, 4).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="browser-card p-4 hover:bg-muted/30 transition-colors block"
                    data-testid={`suggestion-${i}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground/85 leading-snug mb-1">{s.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{getDomain(s.url)}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    </div>
                    <div className="text-xs text-muted-foreground/60 mt-1.5 line-clamp-2">{s.reason}</div>
                  </a>
                ))
              }
            </div>
          </section>
        )}

        {/* Recent History */}
        {(loadingHist || (recentHistory && recentHistory.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground/70">Recent</span>
              <button onClick={() => navigate("/history")} className="text-xs text-primary flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="browser-card divide-y divide-border overflow-hidden">
              {loadingHist
                ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))
                : recentHistory?.slice(0, 5).map((entry, i) => {
                  const fav = getFavicon(entry.url);
                  return (
                    <a
                      key={i}
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      data-testid={`recent-${i}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {fav
                          ? <img src={fav} alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <Globe className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground/80 truncate">{entry.title || getDomain(entry.url)}</div>
                        <div className="text-xs text-muted-foreground truncate">{getDomain(entry.url)}</div>
                      </div>
                      <span className="text-xs text-muted-foreground/60 shrink-0">{relativeTime(entry.visitedAt)}</span>
                    </a>
                  );
                })
              }
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
