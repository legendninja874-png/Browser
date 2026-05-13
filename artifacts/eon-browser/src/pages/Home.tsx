import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetTopSites, useGetRecentHistory, useGetSmartSuggestions, useListTabs } from "@workspace/api-client-react";
import { Mic, ScanLine, Search, Plus, Shield, ShieldAlert, Wifi, BatteryMedium, ShieldCheck, ChevronRight } from "lucide-react";
import { useBrowserStore } from "@/store/browser";
import { Skeleton } from "@/components/ui/skeleton";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
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
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const { setUrlInputOpen, setPendingUrlInput } = useBrowserStore();

  const openSearch = (prefill?: string) => {
    if (prefill) setPendingUrlInput(prefill);
    setUrlInputOpen(true);
    navigate("/browser");
  };
  
  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: topSites, isLoading: loadingTop } = useGetTopSites();
  const { data: recentHistory } = useGetRecentHistory();
  const { data: suggestions, isLoading: loadingSugg } = useGetSmartSuggestions();
  const { data: tabs } = useListTabs();
  
  const recentTabs = tabs?.filter(t => !t.isActive && t.url !== "about:newtab").slice(0, 5) ?? [];

  return (
    <div className="h-full overflow-y-auto bg-background pb-16 no-scrollbar">
      <div className="max-w-xl mx-auto px-4 pt-12 flex flex-col gap-6">

        {/* Top Section */}
        <div className="flex flex-col items-center gap-6 pb-2">
          <div className="flex flex-col items-center">
            <h1 className="text-[28px] font-semibold text-foreground/90 tracking-tight">EoN</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">{timeStr}</p>
          </div>

          {/* Search Bar Pill */}
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-full flex items-center gap-3 h-14 px-5 bg-card/90 backdrop-blur-md border border-border/80 rounded-full shadow-lg">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => openSearch(query)}
                onKeyDown={e => { if (e.key === "Enter" && query.trim()) openSearch(query); }}
                placeholder="Search or type web address"
                className="flex-1 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70"
                readOnly
              />
              <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                <Mic className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />
                <ScanLine className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-medium text-muted-foreground whitespace-nowrap shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>34 trackers blocked</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-medium text-muted-foreground whitespace-nowrap shadow-sm">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <span>12 MB saved</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-medium text-muted-foreground whitespace-nowrap shadow-sm">
            <BatteryMedium className="w-3.5 h-3.5 text-yellow-500" />
            <span>2 tabs sleeping</span>
          </div>
        </div>

        {/* Quick Access */}
        <section>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-2">
            {loadingTop ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <Skeleton className="w-12 h-3 rounded" />
                </div>
              ))
            ) : (
              <>
                {topSites?.slice(0, 7).map((site, i) => (
                  <button
                    key={i}
                    onClick={() => openSearch(site.url)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 rounded-[18px] bg-card border border-border/80 flex items-center justify-center shadow-sm group-hover:bg-muted transition-colors">
                      <img src={getFavicon(site.url) || ""} alt="" className="w-7 h-7 rounded-md" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                      {site.title?.split(" ")[0] ?? getDomain(site.url)}
                    </span>
                  </button>
                ))}
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-[18px] bg-muted/50 border border-dashed border-border/80 flex items-center justify-center group-hover:bg-muted transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Add</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Continue Browsing */}
        {recentTabs.length > 0 && (
          <section className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[13px] font-semibold tracking-wide text-foreground/80 uppercase">Continue reading</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1">
              {recentTabs.map(tab => (
                <div key={tab.id} onClick={() => navigate("/browser")} className="w-[200px] shrink-0 browser-card p-3 flex flex-col gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      <img src={getFavicon(tab.url || "") || ""} className="w-4 h-4" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground truncate">{getDomain(tab.url || "")}</span>
                  </div>
                  <div className="text-[13px] font-medium leading-snug line-clamp-2 text-foreground/90">
                    {tab.title || "Untitled page"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-auto pt-1">{relativeTime(tab.createdAt)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discover Feed */}
        <section className="pt-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 px-1">
            <span className="text-[13px] font-semibold tracking-wide text-foreground/80 uppercase mr-2">Discover</span>
            {["For You", "Tech", "Gaming", "AI", "Science"].map(tag => (
              <button key={tag} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${tag === "For You" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {tag}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col gap-4">
            {loadingSugg ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="w-[100px] h-[75px] rounded-xl shrink-0" />
                </div>
              ))
            ) : (
              suggestions?.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="group flex gap-4 items-start">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <img src={getFavicon(s.url) || ""} className="w-3.5 h-3.5 rounded-sm" onError={e => (e.currentTarget.style.display = "none")} />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{getDomain(s.url)}</span>
                      <span className="text-[11px] text-muted-foreground/50">· {Math.floor(Math.random() * 12 + 1)}h</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {s.title}
                    </h3>
                  </div>
                  <div className="w-[100px] h-[75px] rounded-xl overflow-hidden shrink-0 bg-muted">
                    <img src={`https://picsum.photos/seed/${i + 10}/200/150`} className="w-full h-full object-cover" alt="" />
                  </div>
                </a>
              ))
            )}
            <button className="w-full py-3 mt-2 rounded-xl bg-muted/50 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors">
              Load more
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
