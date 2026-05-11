import { useState } from "react";
import {
  useListTabs, useCreateTab, useUpdateTab, useCloseTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X,
  Moon, Pin, Globe, Shield, Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Browser() {
  const queryClient = useQueryClient();
  const { data: tabs, isLoading } = useListTabs();
  const createTab   = useCreateTab();
  const updateTab   = useUpdateTab();
  const closeTab    = useCloseTab();

  const [urlInput, setUrlInput] = useState("");
  const activeTab = tabs?.find(t => t.isActive);

  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleNewTab = () =>
    createTab.mutate({ data: { url: "about:newtab", title: "New Tab" } }, { onSuccess: invalidateTabs });

  const handleClose = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate({ id }, { onSuccess: invalidateTabs });
  };

  const handleActivate = (id: number) => {
    if (activeTab?.id === id) return;
    updateTab.mutate({ id, data: { isActive: true } }, { onSuccess: invalidateTabs });
  };

  const handleSleep = (id: number, sleeping: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTab.mutate({ id, data: { isSleeping: !sleeping } }, { onSuccess: invalidateTabs });
  };

  return (
    <div className="flex h-full bg-background">
      {/* Vertical Tab Sidebar — Arc-style */}
      <div className="w-[220px] flex flex-col border-r border-white/8 bg-sidebar shrink-0">

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-2 h-9 border-b border-white/8">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Tabs</span>
          <button
            onClick={handleNewTab}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            data-testid="btn-new-tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab list */}
        <ScrollArea className="flex-1">
          <div className="py-1 px-1.5 flex flex-col gap-px">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-7 w-full rounded bg-white/5" />)
              : tabs?.length === 0
                ? <div className="px-3 py-4 text-xs text-white/30">No open tabs</div>
                : tabs?.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => handleActivate(tab.id)}
                    className={`group flex items-center gap-2 h-7 px-2 rounded cursor-pointer transition-colors
                      ${tab.isActive
                        ? "bg-white/10 border-l-2 border-primary pl-[6px]"
                        : "hover:bg-white/6 border-l-2 border-transparent pl-[6px]"}
                      ${tab.isSleeping ? "opacity-40" : ""}
                    `}
                    data-testid={`tab-${tab.id}`}
                  >
                    {/* Favicon */}
                    <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                      {tab.favicon
                        ? <img src={tab.favicon} alt="" className="w-3 h-3" />
                        : <Globe className="w-3 h-3 text-white/30" />
                      }
                    </div>

                    {/* Group color dot */}
                    {tab.groupColor && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tab.groupColor }}
                      />
                    )}

                    {/* Title */}
                    <span className={`flex-1 text-[12px] truncate min-w-0 ${tab.isActive ? "text-white" : "text-white/50"}`}>
                      {tab.title || tab.url}
                    </span>

                    {/* Hover controls */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {tab.isSleeping && <Moon className="w-2.5 h-2.5 text-white/30" />}
                      {tab.isPinned && <Pin className="w-2.5 h-2.5 text-primary/60" />}
                      <button
                        onClick={e => handleSleep(tab.id, tab.isSleeping, e)}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white/60"
                        title={tab.isSleeping ? "Wake" : "Sleep"}
                      >
                        <Moon className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={e => handleClose(tab.id, e)}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white/80"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* URL / Navigation bar — slim */}
        <div className="flex items-center gap-1.5 h-9 px-3 border-b border-white/8 bg-background/95 shrink-0">
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/8 text-white/20 transition-colors" disabled>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors">
            <Home className="w-3.5 h-3.5" />
          </button>

          {/* URL bar */}
          <div className="flex-1 flex items-center max-w-2xl mx-auto">
            <div className="w-full flex items-center gap-2 h-6 bg-white/6 border border-white/10 rounded px-2.5 hover:bg-white/8 hover:border-white/15 focus-within:border-primary/40 focus-within:bg-white/8 transition-colors">
              <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
              <input
                type="text"
                value={activeTab?.url === "about:newtab" ? "" : (urlInput || activeTab?.url || "")}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Search or enter address"
                className="bg-transparent border-none outline-none text-[12px] text-white/70 flex-1 min-w-0 font-mono placeholder:text-white/25"
                data-testid="browser-url-input"
              />
              <Search className="w-3 h-3 text-white/20 shrink-0" />
            </div>
          </div>
        </div>

        {/* Webview content area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab ? (
            activeTab.url === "about:newtab" ? (
              <div className="absolute inset-0 bg-[#0d0e12] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <span className="text-base font-bold text-primary">E</span>
                </div>
                <p className="text-[13px] text-white/30 font-medium">New Tab</p>
              </div>
            ) : (
              <div className="absolute inset-0 bg-[#f4f4f4] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-sm text-gray-400">{activeTab.url}</p>
                  <p className="text-xs text-gray-300">Simulated webview</p>
                </div>
              </div>
            )
          ) : (
            <div className="absolute inset-0 bg-[#0d0e12] flex items-center justify-center">
              <p className="text-sm text-white/20">Open a tab to start browsing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
