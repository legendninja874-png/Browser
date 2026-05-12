import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useListTabs, useCreateTab, useUpdateTab, useCloseTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, RotateCw, X, Plus, Globe,
  Shield, Search, MoreVertical, Home,
} from "lucide-react";
import { motion } from "framer-motion";

function getDomain(url: string) {
  if (!url || url === "about:newtab") return null;
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

export default function Browser() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: tabs, isLoading } = useListTabs();
  const createTab  = useCreateTab();
  const updateTab  = useUpdateTab();
  const closeTab   = useCloseTab();

  const [urlValue, setUrlValue] = useState("");
  const [urlFocused, setUrlFocused] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading2, setIsLoading2] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs?.find(t => t.isActive);
  const tabCount  = tabs?.length ?? 0;

  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleNewTab = () =>
    createTab.mutate({ data: { url: "about:newtab", title: "New Tab" } }, { onSuccess: invalidateTabs });

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
    if (!url) return;
    setUrlFocused(false);
    setIsLoading2(true);
    setLoadProgress(30);
    setTimeout(() => setLoadProgress(70), 400);
    setTimeout(() => { setLoadProgress(100); setTimeout(() => { setIsLoading2(false); setLoadProgress(0); }, 300); }, 900);
    inputRef.current?.blur();
  };

  const displayUrl = urlFocused
    ? urlValue
    : (activeTab?.url && activeTab.url !== "about:newtab" ? activeTab.url : "");

  const domain = activeTab ? getDomain(activeTab.url ?? "") : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="shrink-0 bg-card border-b border-border">
        {/* Navigation row */}
        <div className="flex items-center gap-1 px-2 h-11">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Home className="w-4.5 h-4.5" />
          </button>

          {/* URL bar */}
          <div className="flex-1 flex items-center gap-2 h-8 bg-muted rounded-xl px-3 overflow-hidden">
            {domain
              ? <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
              : <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              value={displayUrl}
              onChange={e => setUrlValue(e.target.value)}
              onFocus={() => { setUrlFocused(true); setUrlValue(activeTab?.url ?? ""); }}
              onBlur={() => setUrlFocused(false)}
              onKeyDown={e => { if (e.key === "Enter") handleNavigate(); }}
              placeholder="Search or type URL"
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0 font-mono text-xs"
              data-testid="url-bar"
            />
            {urlFocused && urlValue && (
              <button onClick={() => setUrlValue("")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New tab + count + more */}
          <button
            onClick={handleNewTab}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid="btn-new-tab"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => navigate("/tabs")}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-semibold"
            data-testid="btn-tab-count"
          >
            <div className="w-5 h-5 border-2 border-current rounded-sm flex items-center justify-center text-[9px] font-bold">
              {tabCount > 99 ? ":" : tabCount}
            </div>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Progress bar */}
        {isLoading2 && (
          <motion.div
            className="h-0.5 bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${loadProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        )}

        {/* Browser nav controls */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-border/50">
          <NavBtn icon={ArrowLeft}  disabled />
          <NavBtn icon={ArrowRight} disabled />
          <NavBtn icon={RotateCw} onClick={() => {
            setIsLoading2(true);
            setLoadProgress(40);
            setTimeout(() => { setLoadProgress(100); setTimeout(() => { setIsLoading2(false); setLoadProgress(0); }, 300); }, 700);
          }} />
        </div>
      </div>

      {/* Tab strip (compact horizontal scroll) */}
      {tabs && tabs.length > 1 && (
        <div className="shrink-0 bg-card/60 border-b border-border flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
          {tabs.slice(0, 8).map(tab => (
            <div
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              role="tab"
              className={`relative flex items-center gap-1.5 min-w-0 max-w-[140px] h-7 px-2.5 rounded-lg text-left transition-colors group shrink-0 cursor-pointer select-none
                ${tab.isActive ? "bg-primary/15 border border-primary/25 text-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              data-testid={`tab-strip-${tab.id}`}
            >
              {tab.favicon
                ? <img src={tab.favicon} alt="" className="w-3.5 h-3.5 shrink-0" />
                : <Globe className="w-3.5 h-3.5 shrink-0" />
              }
              <span className="text-[11px] truncate flex-1">{tab.title || getDomain(tab.url ?? "") || "New Tab"}</span>
              <button
                onClick={e => handleClose(tab.id, e)}
                className="w-4 h-4 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted transition-all shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button
            onClick={handleNewTab}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Webview area */}
      <div className="flex-1 relative overflow-hidden">
        {!activeTab || activeTab.url === "about:newtab" ? (
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
              <span className="text-2xl font-light text-foreground/60">E</span>
            </div>
            <div className="text-center">
              <div className="text-base font-medium text-foreground/60 mb-1">New Tab</div>
              <div className="text-sm text-muted-foreground">Start typing to search or navigate</div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#f8f9fa] flex flex-col items-center justify-center gap-3">
            {isLoading2 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                />
              </div>
            )}
            <Globe className="w-10 h-10 text-gray-300" />
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">{domain ?? activeTab.url}</div>
              <div className="text-xs text-gray-400 mt-1">Simulated webview</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, disabled, onClick }: {
  icon: React.ElementType; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-default"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
