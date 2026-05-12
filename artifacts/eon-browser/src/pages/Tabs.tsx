import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListTabs, useCreateTab, useUpdateTab, useCloseTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Globe, EyeOff, MoreVertical, Grid3X3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function getDomain(url: string) {
  if (!url || url === "about:newtab") return "New Tab";
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch { return null; }
}

export default function Tabs() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: tabs, isLoading } = useListTabs();
  const createTab  = useCreateTab();
  const updateTab  = useUpdateTab();
  const closeTab   = useCloseTab();

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all" | "incognito">("all");

  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleNewTab = () =>
    createTab.mutate({ data: { url: "about:newtab", title: "New Tab" } }, {
      onSuccess: () => { invalidateTabs(); navigate("/browser"); },
    });

  const handleActivate = (id: number) =>
    updateTab.mutate({ id, data: { isActive: true } }, {
      onSuccess: () => { invalidateTabs(); navigate("/browser"); },
    });

  const handleClose = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate({ id }, { onSuccess: invalidateTabs });
  };

  const filtered = (tabs ?? []).filter(t => {
    if (filter === "incognito" && !t.isIncognito) return false;
    if (filter === "all" && t.isIncognito) return false;
    const q = search.toLowerCase();
    return !q || t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q);
  });

  const allCount       = (tabs ?? []).filter(t => !t.isIncognito).length;
  const incognitoCount = (tabs ?? []).filter(t => t.isIncognito).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="shrink-0 bg-card border-b border-border px-4 pt-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleNewTab}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground"
            data-testid="btn-new-tab"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-sm font-medium transition-colors
                ${filter === "all" ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>{allCount}</span>
            </button>
            {incognitoCount > 0 && (
              <button
                onClick={() => setFilter("incognito")}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-sm font-medium transition-colors
                  ${filter === "incognito" ? "bg-foreground/10 text-foreground border border-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                <EyeOff className="w-4 h-4" />
                <span>{incognitoCount}</span>
              </button>
            )}
          </div>

          <button className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 h-9 px-3 bg-muted rounded-xl mb-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your tabs"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="tabs-search"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tab grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground/60">No tabs</div>
              <div className="text-xs text-muted-foreground mt-1">Open a new tab to get started</div>
            </div>
            <button
              onClick={handleNewTab}
              className="flex items-center gap-2 h-9 px-5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New tab
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map(tab => {
                const fav = tab.favicon ?? getFavicon(tab.url ?? "");
                const domain = getDomain(tab.url ?? "");
                return (
                  <motion.div
                    key={tab.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleActivate(tab.id)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-colors
                      ${tab.isActive
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:ring-1 hover:ring-border"}
                      ${tab.isIncognito ? "bg-zinc-900" : "bg-card"} border border-border`}
                    data-testid={`tab-card-${tab.id}`}
                  >
                    {/* Tab preview area */}
                    <div className={`h-28 flex items-center justify-center ${tab.isIncognito ? "bg-zinc-800" : "bg-muted/60"}`}>
                      {tab.url && tab.url !== "about:newtab" ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
                            {fav
                              ? <img src={fav} alt="" className="w-6 h-6" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <Globe className="w-5 h-5 text-muted-foreground" />
                            }
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">{domain}</div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
                            <span className="text-base font-light text-foreground/40">E</span>
                          </div>
                          <div className="text-xs text-muted-foreground">New Tab</div>
                        </div>
                      )}
                    </div>

                    {/* Tab info row */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-foreground/80 truncate leading-tight">
                          {tab.title || domain}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{domain}</div>
                      </div>
                      <button
                        onClick={e => handleClose(tab.id, e)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        data-testid={`close-tab-${tab.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {tab.isSleeping && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/50 text-[9px] text-white/70 font-medium">
                        Sleeping
                      </div>
                    )}
                    {tab.isPinned && (
                      <div className="absolute top-2 right-8 w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
                        <span className="text-[8px] text-white">📌</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
