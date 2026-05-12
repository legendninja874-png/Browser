import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListTabs, useCreateTab, useUpdateTab, useCloseTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Globe, EyeOff, MoreVertical, LayoutGrid, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getDomain(url: string) {
  if (!url || url === "about:newtab") return "New Tab";
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

export default function Tabs() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: tabs } = useListTabs();
  const createTab = useCreateTab();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();

  const [filter, setFilter] = useState<"all" | "incognito">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const closeAll = () => {
    tabs?.forEach(t => {
      if ((filter === "incognito" && t.isIncognito) || (filter === "all" && !t.isIncognito)) {
        closeTab.mutate({ id: t.id });
      }
    });
    setTimeout(invalidateTabs, 300);
  };

  const filtered = (tabs ?? []).filter(t => {
    if (filter === "incognito" && !t.isIncognito) return false;
    if (filter === "all" && t.isIncognito) return false;
    return true;
  });

  const isIncognitoMode = filter === "incognito";

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isIncognitoMode ? "bg-[#000] text-gray-200" : "bg-muted/30"}`}>
      
      {/* Top Header Bar */}
      <div className={`shrink-0 px-4 pt-12 pb-3 flex items-center justify-between z-10 ${isIncognitoMode ? "bg-[#111] border-[#222]" : "bg-card border-border"} border-b shadow-sm`}>
        <div className="flex-1">
          <span className={`text-lg font-semibold ${isIncognitoMode ? "text-white" : "text-foreground"}`}>
            {filtered.length} {filtered.length === 1 ? "tab" : "tabs"}
          </span>
        </div>

        {/* Toggle Pills */}
        <div className={`flex p-1 rounded-full ${isIncognitoMode ? "bg-[#222]" : "bg-muted"}`}>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${!isIncognitoMode ? "bg-background text-foreground shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("incognito")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${isIncognitoMode ? "bg-[#333] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <EyeOff className="w-3.5 h-3.5" /> Incognito
          </button>
        </div>

        <div className="flex-1 flex justify-end gap-1">
          <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isIncognitoMode ? "hover:bg-[#222] text-gray-300" : "hover:bg-muted text-foreground"}`}>
            {viewMode === "grid" ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
          <button className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isIncognitoMode ? "hover:bg-[#222] text-gray-300" : "hover:bg-muted text-foreground"}`}>
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative">
        {filtered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-16">
            {isIncognitoMode ? (
              <EyeOff className="w-16 h-16 text-gray-700 mb-4" />
            ) : (
              <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
            )}
            <h2 className={`text-lg font-medium mb-1 ${isIncognitoMode ? "text-white" : "text-foreground"}`}>
              No open tabs
            </h2>
            <p className={`text-sm mb-6 ${isIncognitoMode ? "text-gray-400" : "text-muted-foreground"}`}>
              {isIncognitoMode ? "Your incognito browsing history won't be saved." : "Open a new tab to start browsing."}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4 pb-24" : "flex flex-col gap-3 pb-24"}>
            <AnimatePresence>
              {filtered.map((tab, idx) => (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", damping: 25, stiffness: 300, delay: idx * 0.03 }}
                  onClick={() => handleActivate(tab.id)}
                  className={`
                    flex cursor-pointer overflow-hidden transition-shadow shadow-sm hover:shadow-md
                    ${viewMode === "grid" ? "flex-col rounded-2xl h-[200px]" : "flex-row items-center rounded-xl h-[72px]"}
                    ${isIncognitoMode ? "bg-[#1a1a1a] border-[#333]" : "bg-card border-border"}
                    border
                    ${tab.isActive && !isIncognitoMode ? "ring-2 ring-primary border-transparent shadow-md" : ""}
                    ${tab.isActive && isIncognitoMode ? "ring-2 ring-gray-400 border-transparent" : ""}
                  `}
                >
                  {/* Preview Area (Grid Only) */}
                  {viewMode === "grid" && (
                    <div className={`flex-1 relative flex items-center justify-center p-4 border-b ${isIncognitoMode ? "bg-[#111] border-[#333]" : "bg-muted/30 border-border"}`}>
                      {/* Simulated page content layout */}
                      <div className="w-full h-full flex flex-col gap-2 opacity-50">
                        <div className={`w-3/4 h-3 rounded-full ${isIncognitoMode ? "bg-[#333]" : "bg-border"}`} />
                        <div className={`w-1/2 h-3 rounded-full ${isIncognitoMode ? "bg-[#333]" : "bg-border"}`} />
                        <div className={`w-full flex-1 rounded-lg mt-2 ${isIncognitoMode ? "bg-[#222]" : "bg-background"}`} />
                      </div>
                      
                      {/* Big Favicon centered */}
                      <div className={`absolute w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isIncognitoMode ? "bg-[#222] border border-[#444]" : "bg-card border border-border"}`}>
                        <img src={getFavicon(tab.url || "") || ""} className="w-8 h-8 rounded-lg" alt="" onError={e => (e.currentTarget.style.display = "none")} />
                        {!getFavicon(tab.url || "") && <Globe className="w-6 h-6 text-muted-foreground" />}
                      </div>
                    </div>
                  )}

                  {/* Header/Info Row */}
                  <div className={`flex items-center gap-3 px-3 ${viewMode === "grid" ? "py-2.5 h-[52px]" : "h-full w-full py-2"}`}>
                    {viewMode === "list" && (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIncognitoMode ? "bg-[#222]" : "bg-muted"}`}>
                        <img src={getFavicon(tab.url || "") || ""} className="w-5 h-5 rounded-md" alt="" onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className={`text-[13px] font-medium truncate leading-tight mb-0.5 ${isIncognitoMode ? "text-gray-200" : "text-foreground"}`}>
                        {tab.title || getDomain(tab.url || "")}
                      </div>
                      <div className={`text-[11px] truncate ${isIncognitoMode ? "text-gray-500" : "text-muted-foreground"}`}>
                        {getDomain(tab.url || "")}
                      </div>
                    </div>
                    
                    <button
                      onClick={e => handleClose(tab.id, e)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors shrink-0 ${isIncognitoMode ? "hover:bg-[#333] text-gray-400 hover:text-white" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center z-20 pointer-events-none">
        <div className={`flex items-center gap-2 p-1.5 rounded-full shadow-xl pointer-events-auto backdrop-blur-md ${isIncognitoMode ? "bg-[#222]/90 border border-[#444]" : "bg-card/90 border border-border"}`}>
          {filtered.length > 0 && (
            <button
              onClick={closeAll}
              className={`px-5 py-3 rounded-full text-[14px] font-medium transition-colors ${isIncognitoMode ? "text-gray-300 hover:bg-[#333]" : "text-foreground hover:bg-muted"}`}
            >
              Close All
            </button>
          )}
          <button
            onClick={handleNewTab}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium shadow-md transition-transform hover:scale-105 active:scale-95
              ${isIncognitoMode ? "bg-white text-black" : "bg-primary text-white"}`}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            New tab
          </button>
        </div>
      </div>
    </div>
  );
}
