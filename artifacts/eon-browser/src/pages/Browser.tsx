import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  useListTabs, useUpdateTab, useCloseTab, useAddHistoryEntry,
  useListHistory, useGetRecentBookmarks, useGetTopSites,
  useCreateBookmark, useCreateTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X, Search, ArrowLeft, Mic, Globe,
  Clock, Bookmark, Plus, RefreshCw, AlertTriangle, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrowserStore } from "@/store/browser";

function buildUrl(input: string, engine: string): string {
  const t = input.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.includes(".") && !t.includes(" ")) return `https://${t}`;
  const bases: Record<string, string> = {
    google: "https://www.google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q=",
    brave: "https://search.brave.com/search?q=",
    ecosia: "https://www.ecosia.org/search?q=",
    yahoo: "https://search.yahoo.com/search?p=",
  };
  return `${bases[engine] ?? bases.google}${encodeURIComponent(t)}`;
}

function looksLikeUrl(s: string) {
  const t = s.trim();
  return (t.includes(".") && !t.includes(" ") && !t.startsWith("http")) ||
    t.startsWith("http://") || t.startsWith("https://");
}

function getDomain(url: string) {
  if (!url || url === "about:newtab") return null;
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

function toProxyUrl(url: string): string {
  if (!url || url === "about:newtab") return "";
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

const QUICK_SITES = [
  { label: "YouTube",   url: "https://m.youtube.com" },
  { label: "Google",    url: "https://www.google.com" },
  { label: "Reddit",    url: "https://www.reddit.com" },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org" },
  { label: "GitHub",    url: "https://github.com" },
  { label: "X",         url: "https://x.com" },
  { label: "Instagram", url: "https://www.instagram.com" },
  { label: "WhatsApp",  url: "https://web.whatsapp.com" },
];

export default function Browser() {
  const queryClient = useQueryClient();

  const { data: tabs } = useListTabs();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();
  const addHistory = useAddHistoryEntry();
  const createBookmark = useCreateBookmark();
  const createTab = useCreateTab();

  const { data: allHistory } = useListHistory();
  const { data: recentBookmarks } = useGetRecentBookmarks();
  const { data: topSites } = useGetTopSites();

  const {
    urlInputOpen, setUrlInputOpen,
    pendingUrlInput, setPendingUrlInput,
    searchEngine,
  } = useBrowserStore();

  const [urlValue, setUrlValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTab = tabs?.find(t => t.isActive);
  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleActivate = (id: number) => {
    if (activeTab?.id === id) return;
    updateTab.mutate({ id, data: { isActive: true } }, { onSuccess: invalidateTabs });
  };

  const handleCloseTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate({ id }, { onSuccess: invalidateTabs });
  };

  const handleNewTab = () => {
    createTab.mutate(
      { data: { url: "about:newtab", title: "New Tab" } },
      { onSuccess: () => invalidateTabs() },
    );
  };

  const startProgress = useCallback(() => {
    setIsLoading(true);
    setProgress(15);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => setProgress(60), 300);
  }, []);

  const finishProgress = useCallback(() => {
    setProgress(100);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 400);
  }, []);

  const handleIframeLoad = useCallback(() => {
    finishProgress();
    setIframeBlocked(false);
    try {
      const search = iframeRef.current?.contentWindow?.location?.search ?? "";
      const proxiedUrl = new URLSearchParams(search).get("url");
      if (proxiedUrl && activeTab && proxiedUrl !== activeTab.url) {
        updateTab.mutate(
          { id: activeTab.id, data: { url: proxiedUrl, title: getDomain(proxiedUrl) || proxiedUrl } },
          { onSuccess: invalidateTabs },
        );
      }
    } catch { /* cross-origin expected */ }
  }, [activeTab, finishProgress]);

  const handleIframeError = useCallback(() => {
    finishProgress();
    setIframeBlocked(true);
  }, [finishProgress]);

  const handleNavigate = useCallback((overrideUrl?: string) => {
    const raw = (overrideUrl ?? urlValue).trim();
    if (!raw) return;
    const finalUrl = buildUrl(raw, searchEngine);
    if (!finalUrl) return;

    setUrlInputOpen(false);
    setUrlValue("");
    setIframeBlocked(false);
    startProgress();

    const onDone = (tabId: number) => {
      invalidateTabs();
      addHistory.mutate({ data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } });
    };

    if (activeTab) {
      updateTab.mutate(
        { id: activeTab.id, data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } },
        { onSuccess: (_, vars) => onDone(vars.id) },
      );
    } else {
      // No tab exists yet — create one, then immediately mark it active
      createTab.mutate(
        { data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } },
        {
          onSuccess: (newTab) => {
            updateTab.mutate(
              { id: (newTab as { id: number }).id, data: { isActive: true } },
              {
                onSuccess: () => {
                  invalidateTabs();
                  addHistory.mutate({ data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } });
                },
              },
            );
          },
        },
      );
    }
  }, [urlValue, searchEngine, activeTab, startProgress]);

  const handleReload = useCallback(() => {
    setIframeBlocked(false);
    startProgress();
    setIframeKey(k => k + 1);
  }, [startProgress]);

  const handleBack = useCallback(() => {
    try { iframeRef.current?.contentWindow?.history.back(); } catch { /* ignore */ }
  }, []);

  const handleForward = useCallback(() => {
    try { iframeRef.current?.contentWindow?.history.forward(); } catch { /* ignore */ }
  }, []);

  const handleBookmarkCurrent = useCallback(() => {
    if (!activeTab?.url || activeTab.url === "about:newtab") return;
    createBookmark.mutate({
      data: { url: activeTab.url, title: activeTab.title || getDomain(activeTab.url) || activeTab.url },
    });
  }, [activeTab]);

  // Listen for shell control events (back, forward, reload, bookmark)
  useEffect(() => {
    const onBack     = () => handleBack();
    const onForward  = () => handleForward();
    const onReload   = () => handleReload();
    const onBookmark = () => handleBookmarkCurrent();

    window.addEventListener("eon-browser-back",     onBack);
    window.addEventListener("eon-browser-forward",  onForward);
    window.addEventListener("eon-browser-reload",   onReload);
    window.addEventListener("eon-browser-bookmark", onBookmark);
    return () => {
      window.removeEventListener("eon-browser-back",     onBack);
      window.removeEventListener("eon-browser-forward",  onForward);
      window.removeEventListener("eon-browser-reload",   onReload);
      window.removeEventListener("eon-browser-bookmark", onBookmark);
    };
  }, [handleBack, handleForward, handleReload, handleBookmarkCurrent]);

  // Listen for in-page navigation messages from the proxy shim
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "eon-navigate" && e.data.url) {
        const targetUrl: string = e.data.url;
        setIframeBlocked(false);
        startProgress();
        if (activeTab) {
          updateTab.mutate(
            { id: activeTab.id, data: { url: targetUrl, title: getDomain(targetUrl) || targetUrl } },
            {
              onSuccess: () => {
                invalidateTabs();
                addHistory.mutate({ data: { url: targetUrl, title: getDomain(targetUrl) || targetUrl } });
              },
            },
          );
        }
      }

      if (e.data.type === "eon-urlchange" && e.data.url) {
        const targetUrl: string = e.data.url;
        if (activeTab && targetUrl !== activeTab.url) {
          updateTab.mutate(
            { id: activeTab.id, data: { url: targetUrl, title: getDomain(targetUrl) || targetUrl } },
            { onSuccess: invalidateTabs },
          );
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeTab, startProgress]);

  // Reset iframe when tab URL changes
  useEffect(() => {
    setIframeBlocked(false);
    setIframeKey(k => k + 1);
    if (hasUrl) startProgress();
  }, [activeTab?.url]);

  // Open URL overlay
  useEffect(() => {
    if (urlInputOpen) {
      const pending = pendingUrlInput;
      const current = activeTab?.url && activeTab.url !== "about:newtab" ? activeTab.url : "";
      const init = pending || current;
      setUrlValue(init);
      if (pending) setPendingUrlInput("");
      setTimeout(() => {
        inputRef.current?.focus();
        if (init) inputRef.current?.select();
      }, 60);
    }
  }, [urlInputOpen]);

  const historyMatches = useMemo(() => {
    const q = urlValue.trim().toLowerCase();
    if (!q) return (allHistory ?? []).slice(0, 8);
    return (allHistory ?? [])
      .filter(h => h.url.toLowerCase().includes(q) || h.title?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [urlValue, allHistory]);

  const bookmarkMatches = useMemo(() => {
    const q = urlValue.trim().toLowerCase();
    if (!q) return (recentBookmarks ?? []).slice(0, 4);
    return (recentBookmarks ?? [])
      .filter(b => b.url.toLowerCase().includes(q) || b.title?.toLowerCase().includes(q))
      .slice(0, 3);
  }, [urlValue, recentBookmarks]);

  const hasUrl = !!activeTab?.url && activeTab.url !== "about:newtab";
  const domain = activeTab ? getDomain(activeTab.url ?? "") : null;
  const faviconUrl = activeTab?.url ? getFavicon(activeTab.url) : null;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">

      {/* Loading progress bar — thin strip at very top */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute top-0 inset-x-0 h-[2px] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-tab strip — only when 2+ tabs open */}
      {tabs && tabs.length > 1 && (
        <div className="shrink-0 bg-background flex items-end px-1 pt-1 h-[38px] overflow-x-auto no-scrollbar border-b border-border/30 z-10">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              className={`relative flex items-center gap-1.5 min-w-[100px] max-w-[160px] h-[34px] px-2.5 rounded-t-lg shrink-0 cursor-pointer select-none transition-colors border-t border-x
                ${tab.isActive
                  ? "bg-card border-border/60 text-foreground z-10"
                  : "bg-transparent text-muted-foreground hover:bg-muted/30 border-transparent"}`}
            >
              <img src={getFavicon(tab.url || "") || ""} className="w-3.5 h-3.5 shrink-0" alt=""
                onError={e => (e.currentTarget.style.display = "none")} />
              <span className="text-[11.5px] font-medium truncate flex-1 leading-none">
                {tab.title || getDomain(tab.url ?? "") || "New Tab"}
              </span>
              <button
                onClick={e => handleCloseTab(tab.id, e)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 opacity-60 hover:opacity-100"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button
            onClick={handleNewTab}
            className="flex items-center justify-center w-8 h-8 rounded-t-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* NEW TAB PAGE */}
        {!hasUrl && (
          <div className="absolute inset-0 flex flex-col items-center pt-10 pb-4 px-4 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-sm flex flex-col gap-7">

              <div className="flex flex-col items-center gap-1">
                <h1 className="text-[38px] font-bold tracking-tight text-foreground/85 leading-none">EoN</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">New tab</p>
              </div>

              <button
                onClick={() => setUrlInputOpen(true)}
                className="w-full flex items-center gap-3 h-12 px-4 bg-muted/60 border border-border/50 rounded-full text-muted-foreground active:bg-muted transition-colors"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="text-[14px] font-medium flex-1 text-left">Search or type a URL</span>
                <Mic className="w-4 h-4 shrink-0" />
              </button>

              {/* Quick site grid */}
              <div className="grid grid-cols-4 gap-3">
                {(topSites && topSites.length > 0 ? topSites.slice(0, 8) : QUICK_SITES).map((site, i) => {
                  const siteUrl = "url" in site ? site.url : "";
                  const siteLabel = "title" in site
                    ? (site.title || getDomain(siteUrl) || "")
                    : ("label" in site ? (site as { label: string }).label : "");
                  return (
                    <button key={i} onClick={() => handleNavigate(siteUrl)} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 bg-card border border-border/60 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(siteUrl).hostname; } catch { return ""; } })()}&sz=64`}
                          className="w-8 h-8 rounded-lg" alt={siteLabel}
                          onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium leading-none truncate w-full text-center">{siteLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Recent history */}
              {allHistory && allHistory.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Recent</p>
                  <div className="flex flex-col gap-0.5">
                    {allHistory.slice(0, 5).map((h, i) => (
                      <button key={i} onClick={() => handleNavigate(h.url)}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/40 active:bg-muted transition-colors text-left w-full">
                        <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center shrink-0">
                          <img src={getFavicon(h.url) || ""} className="w-5 h-5 rounded" alt=""
                            onError={e => (e.currentTarget.style.display = "none")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                            {h.title || getDomain(h.url) || h.url}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{getDomain(h.url)}</p>
                        </div>
                        <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEBVIEW — real iframe through proxy */}
        {hasUrl && (
          <div className="absolute inset-0">
            {iframeBlocked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 bg-background">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-[17px] font-bold text-foreground">Can't display this page</h2>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">{domain}</strong> refused to load.
                    You can still open it in a new browser tab.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.open(activeTab?.url ?? "", "_blank")}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white rounded-full font-semibold text-[15px]"
                  >
                    <ExternalLink className="w-4 h-4" /> Open {domain}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReload}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-muted text-foreground rounded-full font-medium text-[14px]"
                  >
                    <RefreshCw className="w-4 h-4" /> Try again
                  </motion.button>
                </div>
              </div>
            ) : (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={toProxyUrl(activeTab?.url ?? "")}
                title={domain || "Browser"}
                className="w-full h-full border-0 block bg-white"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals"
                allow="autoplay; encrypted-media; fullscreen; geolocation; camera; microphone"
              />
            )}
          </div>
        )}
      </div>

      {/* ── URL OVERLAY — full-screen slide-up ── */}
      <AnimatePresence>
        {urlInputOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className="absolute inset-0 z-50 bg-background flex flex-col"
          >
            {/* Input row */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-border/40 shrink-0">
              <button
                onClick={() => { setUrlInputOpen(false); setUrlValue(""); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center gap-2.5 h-11 px-4 bg-muted/60 border border-border/50 rounded-full">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={urlValue}
                  onChange={e => setUrlValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleNavigate(); }}
                  placeholder="Search or type URL"
                  className="flex-1 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground min-w-0"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                  enterKeyHint="go"
                />
                {urlValue ? (
                  <button
                    onClick={() => setUrlValue("")}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-foreground shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto">

              {urlValue.trim() && (
                <div className="border-b border-border/30">
                  <button onClick={() => handleNavigate()}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors w-full text-left">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-foreground truncate">Search "{urlValue}"</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{searchEngine}.com</p>
                    </div>
                  </button>
                  {looksLikeUrl(urlValue) && (
                    <button
                      onClick={() => handleNavigate(urlValue.startsWith("http") ? urlValue : `https://${urlValue}`)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors w-full text-left"
                    >
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-foreground truncate">
                          {urlValue.startsWith("http") ? urlValue : `https://${urlValue}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Navigate to site</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {historyMatches.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {urlValue.trim() ? "From history" : "Recent"}
                  </p>
                  {historyMatches.map((h, i) => (
                    <button key={i} onClick={() => handleNavigate(h.url)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors w-full text-left border-b border-border/20 last:border-0">
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <img src={getFavicon(h.url) || ""} className="w-5 h-5 rounded" alt=""
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-foreground truncate">{h.title || getDomain(h.url)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{getDomain(h.url)}</p>
                      </div>
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {bookmarkMatches.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Bookmarks</p>
                  {bookmarkMatches.map((b, i) => (
                    <button key={i} onClick={() => handleNavigate(b.url)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors w-full text-left border-b border-border/20 last:border-0">
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <img src={getFavicon(b.url) || ""} className="w-5 h-5 rounded" alt=""
                          onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-foreground truncate">{b.title || getDomain(b.url)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{getDomain(b.url)}</p>
                      </div>
                      <Bookmark className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {!urlValue.trim() && (
                <div className="px-4 pt-4 pb-6">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick access</p>
                  <div className="grid grid-cols-4 gap-3">
                    {QUICK_SITES.map(site => (
                      <button key={site.url} onClick={() => handleNavigate(site.url)}
                        className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-card border border-border/50 rounded-xl flex items-center justify-center group-active:scale-95 transition-transform">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`}
                            className="w-7 h-7 rounded" alt={site.label}
                            onError={e => (e.currentTarget.style.display = "none")} />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium">{site.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
