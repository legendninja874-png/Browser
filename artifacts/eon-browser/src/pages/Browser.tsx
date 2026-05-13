import { useState, useRef, useEffect, useCallback } from "react";
import {
  useListTabs, useUpdateTab, useCloseTab, useAddHistoryEntry,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Shield, ShieldAlert, Search, RotateCw, ArrowLeft, Mic, Globe, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrowserStore } from "@/store/browser";

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.Capacitor !== "undefined" &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform()
  );
}

async function openWebView(url: string): Promise<void> {
  try {
    const { InAppBrowser } = await import("@capacitor/inappbrowser");
    await InAppBrowser.openInWebView({
      url,
      options: {
        showURL: false,
        showToolbar: false,
        mediaPlaybackRequiresUserAction: false,
        android: {
          allowZoom: true,
          hardwareBack: true,
          pauseMedia: true,
        },
      },
    });
  } catch {
    window.open(url, "_blank");
  }
}

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

function getDomain(url: string) {
  if (!url || url === "about:newtab") return null;
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

const QUICK_SITES = [
  { label: "YouTube",   url: "https://m.youtube.com",           color: "#ff0000" },
  { label: "Google",    url: "https://www.google.com",           color: "#4285f4" },
  { label: "Reddit",    url: "https://www.reddit.com",           color: "#ff4500" },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org",       color: "#737373" },
  { label: "GitHub",    url: "https://github.com",               color: "#171515" },
  { label: "X",         url: "https://x.com",                    color: "#000000" },
  { label: "Instagram", url: "https://www.instagram.com",        color: "#e1306c" },
  { label: "WhatsApp",  url: "https://web.whatsapp.com",         color: "#25d366" },
];

export default function Browser() {
  const queryClient = useQueryClient();
  const { data: tabs } = useListTabs();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();
  const addHistory = useAddHistoryEntry();

  const { urlInputOpen, setUrlInputOpen, searchEngine } = useBrowserStore();

  const [urlValue, setUrlValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs?.find(t => t.isActive);
  const invalidateTabs = () => queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

  const handleActivate = (id: number) => {
    if (activeTab?.id === id) return;
    updateTab.mutate({ id, data: { isActive: true } }, { onSuccess: invalidateTabs });
  };

  const handleClose = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate({ id }, { onSuccess: invalidateTabs });
  };

  const handleNavigate = useCallback(async (overrideUrl?: string) => {
    const raw = (overrideUrl ?? urlValue).trim();
    if (!raw) return;

    const finalUrl = buildUrl(raw, searchEngine);
    if (!finalUrl) return;

    setUrlInputOpen(false);
    setUrlValue("");

    setIsLoading(true);
    setProgress(30);
    setTimeout(() => setProgress(75), 300);

    if (activeTab) {
      updateTab.mutate(
        { id: activeTab.id, data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } },
        {
          onSuccess: () => {
            invalidateTabs();
            addHistory.mutate({ data: { url: finalUrl, title: getDomain(finalUrl) || finalUrl } });
          },
        },
      );
    }

    if (isNative()) {
      await openWebView(finalUrl);
    } else {
      window.open(finalUrl, "_blank");
    }

    setProgress(100);
    setTimeout(() => { setIsLoading(false); setProgress(0); }, 500);
  }, [urlValue, searchEngine, activeTab]);

  useEffect(() => {
    if (urlInputOpen) {
      const current = activeTab?.url && activeTab.url !== "about:newtab" ? activeTab.url : "";
      setUrlValue(current);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
    }
  }, [urlInputOpen]);

  const domain = activeTab ? getDomain(activeTab.url ?? "") : null;
  const isSecure = activeTab?.url?.startsWith("https://");
  const faviconUrl = activeTab?.url ? getFavicon(activeTab.url) : null;
  const hasUrl = !!activeTab?.url && activeTab.url !== "about:newtab";

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">

      {/* Loading progress bar — pinned to top */}
      <div className="absolute top-0 inset-x-0 h-[2px] z-50 overflow-hidden">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              exit={{ opacity: 0 }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Compact tab strip — only when 2+ tabs */}
      {tabs && tabs.length > 1 && (
        <div className="shrink-0 bg-background flex items-end px-1 pt-1 h-[38px] overflow-x-auto no-scrollbar border-b border-border/40">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              className={`relative flex items-center gap-1.5 min-w-[110px] max-w-[180px] h-[34px] px-3 rounded-t-lg shrink-0 cursor-pointer select-none transition-colors border-t border-x
                ${tab.isActive
                  ? "bg-card border-border/60 text-foreground z-10"
                  : "bg-transparent text-muted-foreground hover:bg-muted/40 border-transparent"}`}
            >
              <img
                src={getFavicon(tab.url || "") || ""}
                className="w-3.5 h-3.5 shrink-0"
                alt=""
                onError={e => (e.currentTarget.style.display = "none")}
              />
              <span className="text-[12px] font-medium truncate flex-1 leading-none">
                {tab.title || getDomain(tab.url ?? "") || "New Tab"}
              </span>
              <button
                onClick={e => handleClose(tab.id, e)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 opacity-50 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 relative bg-background overflow-hidden">

        {/* NEW TAB STATE */}
        {!hasUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 pb-8 px-5 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">

              <div className="flex flex-col items-center gap-1">
                <h1 className="text-[42px] font-bold tracking-tight text-foreground/85">EoN</h1>
                <p className="text-sm text-muted-foreground font-medium">New tab</p>
              </div>

              {/* Quick site grid */}
              <div className="grid grid-cols-4 gap-3 w-full">
                {QUICK_SITES.map((site) => (
                  <button
                    key={site.url}
                    onClick={() => handleNavigate(site.url)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 bg-card border border-border/60 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`}
                        className="w-8 h-8 rounded-lg"
                        alt={site.label}
                        onError={e => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium leading-none">{site.label}</span>
                  </button>
                ))}
              </div>

              {/* Tap to search hint */}
              <button
                onClick={() => setUrlInputOpen(true)}
                className="w-full flex items-center gap-3 h-12 px-4 bg-muted/50 border border-border/50 rounded-full text-muted-foreground transition-colors active:bg-muted"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="text-[14px] font-medium">Search or type a URL</span>
                <Mic className="w-4 h-4 ml-auto shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TAB STATE — site loaded */}
        {hasUrl && (
          <div className="absolute inset-0 flex flex-col">

            {/* Top browser chrome bar — like Chrome Mobile */}
            <div className="shrink-0 bg-card border-b border-border/50 px-3 h-14 flex items-center gap-2">

              {/* Security + domain pill — tappable to open URL input */}
              <button
                onClick={() => setUrlInputOpen(true)}
                className="flex-1 flex items-center gap-2 h-10 px-3.5 bg-muted/60 rounded-full border border-border/40 active:bg-muted transition-colors min-w-0"
              >
                {isSecure
                  ? <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  : <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                }
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    className="w-4 h-4 rounded shrink-0"
                    alt=""
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                )}
                <span className="text-[14px] font-semibold text-foreground truncate flex-1 text-left">
                  {domain}
                </span>
              </button>

              {/* Reload */}
              <button
                onClick={() => handleNavigate(activeTab?.url ?? "")}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground active:scale-90"
              >
                <RotateCw className="w-[18px] h-[18px]" />
              </button>

              {/* Open externally (web) / opens webview (native) */}
              <button
                onClick={() => handleNavigate(activeTab?.url ?? "")}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground active:scale-90"
              >
                <ExternalLink className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Content area — site hero */}
            <div className="flex-1 flex flex-col items-center justify-center pb-12 px-6 gap-6">
              <div className="w-24 h-24 bg-card border border-border/60 rounded-3xl flex items-center justify-center shadow-lg">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    className="w-14 h-14 rounded-2xl"
                    alt=""
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                    }}
                  />
                ) : null}
                <Globe className="w-10 h-10 text-muted-foreground hidden" />
              </div>

              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{domain}</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">{activeTab?.url}</p>
              </div>

              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold
                ${isSecure ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-600"}`}>
                {isSecure
                  ? <><Shield className="w-3 h-3" /> Secure connection</>
                  : <><ShieldAlert className="w-3 h-3" /> Not secure</>}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleNavigate(activeTab?.url ?? "")}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-primary text-white rounded-full font-semibold text-[15px] shadow-md w-full max-w-[260px] justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                Open {domain}
              </motion.button>
            </div>

            {/* Other open tabs strip */}
            {tabs && tabs.filter(t => t.url && t.url !== "about:newtab" && t.id !== activeTab?.id).length > 0 && (
              <div className="border-t border-border/40 px-4 pb-3 pt-2 shrink-0">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Other tabs</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {tabs
                    .filter(t => t.url && t.url !== "about:newtab" && t.id !== activeTab?.id)
                    .slice(0, 6)
                    .map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleActivate(tab.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-xl shrink-0 active:bg-muted transition-colors"
                      >
                        <img
                          src={getFavicon(tab.url || "") || ""}
                          className="w-4 h-4 rounded"
                          alt=""
                          onError={e => (e.currentTarget.style.display = "none")}
                        />
                        <span className="text-[13px] text-foreground font-medium max-w-[80px] truncate">
                          {getDomain(tab.url ?? "") || "Tab"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── URL Input Overlay — Chrome-style full screen ── */}
      <AnimatePresence>
        {urlInputOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="absolute inset-0 z-50 bg-background flex flex-col"
          >
            {/* Input row */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-border/50">
              <button
                onClick={() => { setUrlInputOpen(false); setUrlValue(""); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center gap-2.5 h-11 px-4 bg-muted/70 border border-border/50 rounded-full">
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

              {/* Quick sites row */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick access</p>
                <div className="grid grid-cols-4 gap-3">
                  {QUICK_SITES.slice(0, 8).map(site => (
                    <button
                      key={site.url}
                      onClick={() => handleNavigate(site.url)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-12 h-12 bg-card border border-border/50 rounded-xl flex items-center justify-center group-active:scale-95 transition-transform">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`}
                          className="w-7 h-7 rounded"
                          alt={site.label}
                          onError={e => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">{site.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-border/40 mx-4 my-3" />

              {/* Inline search suggestion */}
              {urlValue && (
                <button
                  onClick={() => handleNavigate()}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground truncate">Search for "{urlValue}"</p>
                    <p className="text-[12px] text-muted-foreground capitalize">{searchEngine}.com</p>
                  </div>
                </button>
              )}

              {/* Navigate directly suggestion */}
              {urlValue && (urlValue.includes(".") || urlValue.startsWith("http")) && (
                <button
                  onClick={() => {
                    const direct = urlValue.startsWith("http") ? urlValue : `https://${urlValue}`;
                    handleNavigate(direct);
                  }}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {urlValue.startsWith("http") ? urlValue : `https://${urlValue}`}
                    </p>
                    <p className="text-[12px] text-muted-foreground">Navigate to site</p>
                  </div>
                </button>
              )}

              {/* Static quick searches when no value */}
              {!urlValue && [
                { label: "YouTube",   url: "https://m.youtube.com" },
                { label: "Google",    url: "https://www.google.com" },
                { label: "Reddit",    url: "https://www.reddit.com" },
                { label: "Wikipedia", url: "https://en.m.wikipedia.org" },
                { label: "GitHub",    url: "https://github.com" },
              ].map((item) => (
                <button
                  key={item.url}
                  onClick={() => handleNavigate(item.url)}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors w-full text-left border-b border-border/30 last:border-0"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`}
                    className="w-10 h-10 rounded-xl"
                    alt=""
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{item.label}</p>
                    <p className="text-[12px] text-muted-foreground">{new URL(item.url).hostname}</p>
                  </div>
                  <span className="text-muted-foreground text-lg">↗</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
