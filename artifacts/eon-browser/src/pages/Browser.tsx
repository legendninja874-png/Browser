import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListTabs, useUpdateTab, useCloseTab, useAddHistoryEntry,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Shield, Search, Lock, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getDomain(url: string) {
  if (!url || url === "about:newtab") return null;
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; }
}

export default function Browser() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: tabs } = useListTabs();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();
  const addHistory = useAddHistoryEntry();

  const [urlValue, setUrlValue] = useState("");
  const [urlFocused, setUrlFocused] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs?.find(t => t.isActive);

  useEffect(() => {
    if (activeTab && activeTab.url !== "about:newtab") {
      setUrlValue(activeTab.url);
    } else {
      setUrlValue("");
    }
  }, [activeTab]);

  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleActivate = (id: number) => {
    if (activeTab?.id === id) return;
    updateTab.mutate({ id, data: { isActive: true } }, { onSuccess: invalidateTabs });
  };

  const handleClose = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate({ id }, { onSuccess: invalidateTabs });
  };

  const handleNavigate = () => {
    const url = urlValue.trim();
    if (!url || !activeTab) return;
    
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = url.includes('.') && !url.includes(' ') ? `https://${url}` : `https://google.com/search?q=${encodeURIComponent(url)}`;
    }

    setUrlFocused(false);
    inputRef.current?.blur();
    
    // Simulate loading
    setIsLoading2(true);
    setProgress(10);
    const interval = setInterval(() => setProgress(p => p + (100 - p) * 0.2), 100);
    
    updateTab.mutate(
      { id: activeTab.id, data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } },
      { 
        onSuccess: () => {
          invalidateTabs();
          addHistory.mutate({ data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } });
          setTimeout(() => {
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => { setIsLoading2(false); setProgress(0); }, 300);
          }, 600);
        }
      }
    );
  };

  const displayUrl = urlFocused ? urlValue : (activeTab?.url && activeTab.url !== "about:newtab" ? activeTab.url : "");
  const domain = activeTab ? getDomain(activeTab.url ?? "") : null;
  const isSecure = activeTab?.url?.startsWith("https://");

  return (
    <div className="flex flex-col h-full bg-background relative">
      
      {/* Top compact tab strip (Chrome style) */}
      {tabs && tabs.length > 1 && (
        <div className="shrink-0 bg-background flex items-end px-1 pt-1 h-[38px] overflow-x-auto no-scrollbar border-b border-border/50">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              className={`relative flex items-center gap-2 min-w-[120px] max-w-[200px] h-[34px] px-3 rounded-t-xl shrink-0 cursor-pointer select-none transition-colors border-t border-x border-transparent
                ${tab.isActive 
                  ? "bg-card border-border/80 text-foreground z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]" 
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 border-transparent z-0"}`}
            >
              <img src={getFavicon(tab.url || "") || ""} className="w-3.5 h-3.5 shrink-0" alt="" onError={e => (e.currentTarget.style.display = "none")} />
              <span className="text-[12px] font-medium truncate flex-1 leading-none">{tab.title || getDomain(tab.url ?? "") || "New Tab"}</span>
              <button
                onClick={e => handleClose(tab.id, e)}
                className={`w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-all shrink-0 ${tab.isActive ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
              >
                <X className="w-3 h-3" />
              </button>
              {tab.isActive && (
                <>
                  <div className="absolute -bottom-px -left-2 w-2 h-2 rounded-br-lg shadow-[2px_2px_0_2px_var(--color-card)]" />
                  <div className="absolute -bottom-px -right-2 w-2 h-2 rounded-bl-lg shadow-[-2px_2px_0_2px_var(--color-card)]" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Address Bar (Visible when in Browser mode) */}
      <div className={`shrink-0 bg-card border-b border-border z-30 transition-all ${urlFocused ? "absolute inset-0 h-full flex flex-col bg-background/95 backdrop-blur" : "relative"}`}>
        <div className="flex items-center gap-2 px-2 h-14">
          <div className={`flex-1 flex items-center gap-2 bg-muted/60 border border-border/50 rounded-full px-4 transition-all ${urlFocused ? "h-12 shadow-sm bg-card border-primary/50" : "h-11"}`}>
            {urlFocused ? (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : domain ? (
              isSecure ? <Shield className="w-4 h-4 text-green-500 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            
            <input
              ref={inputRef}
              type="text"
              value={displayUrl}
              onChange={e => setUrlValue(e.target.value)}
              onFocus={() => { setUrlFocused(true); setUrlValue(activeTab?.url === "about:newtab" ? "" : (activeTab?.url ?? "")); }}
              onBlur={() => setTimeout(() => setUrlFocused(false), 150)}
              onKeyDown={e => { if (e.key === "Enter") handleNavigate(); }}
              placeholder="Search or type web address"
              className="flex-1 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground min-w-0"
              autoComplete="off"
              autoCorrect="off"
            />
            
            {urlFocused && urlValue && (
              <button onClick={() => setUrlValue("")} className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {!urlFocused && (
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
          {urlFocused && (
            <button onClick={() => setUrlFocused(false)} className="px-2 text-[15px] font-medium text-primary">
              Cancel
            </button>
          )}
        </div>

        {/* Loading Progress Bar */}
        <div className="h-0.5 w-full bg-transparent overflow-hidden">
          {isLoading2 && (
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          )}
        </div>

        {/* Search Suggestions Panel */}
        <AnimatePresence>
          {urlFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex-1 bg-card overflow-y-auto"
            >
              <div className="flex flex-col">
                <div className="px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase border-b border-border/50">
                  Trending searches
                </div>
                {["weather today", "latest ai news", "how to build react app", "top movies 2025"].map((term, i) => (
                  <button
                    key={i}
                    onClick={() => { setUrlValue(term); setTimeout(handleNavigate, 50); }}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 border-b border-border/50 text-left transition-colors"
                  >
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-[15px] text-foreground font-medium flex-1">{term}</span>
                    <div className="w-6 h-6 flex items-center justify-center rounded bg-muted/50 text-[10px] text-muted-foreground font-mono">
                      ↖
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Webview Content Area */}
      <div className="flex-1 relative bg-background">
        {!activeTab || activeTab.url === "about:newtab" ? (
          // New Tab / Empty State
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-20">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground/80 mb-6">EoN</h1>
            <button onClick={() => inputRef.current?.focus()} className="flex items-center gap-3 px-5 py-3.5 bg-card border border-border rounded-full shadow-sm text-muted-foreground font-medium text-[15px] w-64 justify-center hover:bg-muted/50 transition-colors">
              <Search className="w-4 h-4" /> Search the web
            </button>
          </div>
        ) : (
          // Simulated Webview Container
          <div className="absolute inset-0 bg-[#ffffff] dark:bg-[#121212] overflow-y-auto no-scrollbar">
            {isLoading2 ? (
              <div className="w-full h-full flex flex-col pt-12 px-6">
                <Skeleton className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md mb-6" />
                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-sm mb-3" />
                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-sm mb-3" />
                <Skeleton className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded-sm mb-8" />
                
                <Skeleton className="h-48 w-full bg-gray-200 dark:bg-gray-800 rounded-xl mb-6" />
              </div>
            ) : (
              <div className="w-full min-h-full flex flex-col items-center justify-center text-center p-6 pb-20 opacity-0 animate-in fade-in duration-500">
                <img src={getFavicon(activeTab.url || "") || ""} className="w-16 h-16 rounded-2xl mb-6 shadow-md" alt="" onError={e => (e.currentTarget.style.display = "none")} />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{domain}</h2>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-[280px] mb-8">
                  This is a simulated webview for {activeTab.url}. In a real browser, the native rendering engine would display the site content here.
                </p>
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[13px] font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Connection is secure
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
