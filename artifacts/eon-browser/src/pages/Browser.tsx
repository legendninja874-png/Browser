import { useState, useRef } from "react";
import {
  useListTabs, useUpdateTab, useCloseTab, useAddHistoryEntry,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Shield, ShieldAlert, Search, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

function isNative(): boolean {
  return typeof window !== "undefined" &&
    typeof window.Capacitor !== "undefined" &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform();
}

async function openWebView(url: string): Promise<void> {
  try {
    const { InAppBrowser, ToolbarPosition } = await import("@capacitor/inappbrowser");
    await InAppBrowser.openInWebView({
      url,
      options: {
        showURL: true,
        showToolbar: true,
        toolbarPosition: ToolbarPosition.BOTTOM,
        showNavigationButtons: true,
        closeButtonText: "Done",
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

function getDomain(url: string) {
  if (!url || url === "about:newtab") return null;
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return null; }
}

export default function Browser() {
  const queryClient = useQueryClient();
  const { data: tabs } = useListTabs();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();
  const addHistory = useAddHistoryEntry();

  const [urlValue, setUrlValue] = useState("");
  const [urlFocused, setUrlFocused] = useState(false);
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

  const handleNavigate = async () => {
    const url = urlValue.trim();
    if (!url) return;

    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = url.includes(".") && !url.includes(" ")
        ? `https://${url}`
        : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    setUrlFocused(false);
    inputRef.current?.blur();

    setIsLoading(true);
    setProgress(30);
    setTimeout(() => setProgress(80), 200);

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
    setTimeout(() => { setIsLoading(false); setProgress(0); }, 400);
  };

  const displayUrl = urlFocused
    ? urlValue
    : (activeTab?.url && activeTab.url !== "about:newtab" ? activeTab.url : "");

  const domain = activeTab ? getDomain(activeTab.url ?? "") : null;
  const isSecure = activeTab?.url?.startsWith("https://");
  const faviconUrl = activeTab?.url ? getFavicon(activeTab.url) : null;

  return (
    <div className="flex flex-col h-full bg-background relative">

      {/* Compact tab strip */}
      {tabs && tabs.length > 1 && (
        <div className="shrink-0 bg-background flex items-end px-1 pt-1 h-[38px] overflow-x-auto no-scrollbar border-b border-border/50">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              className={`relative flex items-center gap-2 min-w-[120px] max-w-[200px] h-[34px] px-3 rounded-t-xl shrink-0 cursor-pointer select-none transition-colors border-t border-x
                ${tab.isActive
                  ? "bg-card border-border/80 text-foreground z-10"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 border-transparent"}`}
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
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-all shrink-0 opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Address Bar */}
      <div className={`shrink-0 bg-card border-b border-border z-30 ${urlFocused ? "absolute inset-0 flex flex-col bg-background/97 backdrop-blur" : "relative"}`}>
        <div className="flex items-center gap-2 px-2 h-14">
          <div
            className={`flex-1 flex items-center gap-2 bg-muted/60 border border-border/50 rounded-full px-4 transition-all
              ${urlFocused ? "h-12 shadow-sm bg-card border-primary/50" : "h-11"}`}
          >
            {urlFocused ? (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : domain ? (
              isSecure
                ? <Shield className="w-4 h-4 text-green-500 shrink-0" />
                : <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            )}

            <input
              ref={inputRef}
              type="text"
              value={displayUrl}
              onChange={e => setUrlValue(e.target.value)}
              onFocus={() => {
                setUrlFocused(true);
                setUrlValue(activeTab?.url === "about:newtab" ? "" : (activeTab?.url ?? ""));
              }}
              onBlur={() => setTimeout(() => setUrlFocused(false), 150)}
              onKeyDown={e => { if (e.key === "Enter") handleNavigate(); }}
              placeholder="Search or type web address"
              className="flex-1 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground min-w-0"
              autoComplete="off"
              autoCorrect="off"
            />

            {urlFocused && urlValue && (
              <button
                onClick={() => setUrlValue("")}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-foreground shrink-0"
              >
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
            <button
              onClick={() => setUrlFocused(false)}
              className="px-2 text-[15px] font-medium text-primary shrink-0"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-transparent overflow-hidden">
          {isLoading && (
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.25 }}
            />
          )}
        </div>

        {/* Search suggestions overlay */}
        <AnimatePresence>
          {urlFocused && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex-1 bg-card overflow-y-auto"
            >
              <div className="px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase border-b border-border/50">
                Quick searches
              </div>
              {[
                { label: "YouTube", url: "https://m.youtube.com" },
                { label: "Google", url: "https://www.google.com" },
                { label: "Reddit", url: "https://www.reddit.com" },
                { label: "Wikipedia", url: "https://en.m.wikipedia.org" },
                { label: "GitHub", url: "https://github.com" },
                { label: "CNET", url: "https://cnet.com" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setUrlValue(item.url); setTimeout(handleNavigate, 50); }}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 border-b border-border/50 text-left transition-colors w-full"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`}
                    className="w-5 h-5 rounded"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] text-foreground font-medium">{item.label}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{new URL(item.url).hostname}</div>
                  </div>
                  <div className="text-muted-foreground text-[18px] leading-none">↗</div>
                </button>
              ))}

              {urlValue && (
                <button
                  onClick={() => setTimeout(handleNavigate, 50)}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 text-left transition-colors w-full"
                >
                  <Search className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] text-foreground font-medium truncate">Search for "{urlValue}"</div>
                    <div className="text-[12px] text-muted-foreground">google.com</div>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {!activeTab || activeTab.url === "about:newtab" ? (
          /* New tab state */
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-16 gap-5 px-6">
            <h1 className="text-[44px] font-bold tracking-tight text-foreground/80">EoN</h1>
            <button
              onClick={() => inputRef.current?.focus()}
              className="flex items-center gap-3 px-6 py-3.5 bg-card border border-border rounded-full shadow-sm text-muted-foreground font-medium text-[15px] w-full max-w-xs justify-center hover:bg-muted/50 transition-colors"
            >
              <Search className="w-4 h-4" /> Search or type a URL
            </button>

            {/* Quick site grid */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-xs mt-2">
              {[
                { label: "YouTube", url: "https://m.youtube.com" },
                { label: "Google", url: "https://www.google.com" },
                { label: "Reddit", url: "https://www.reddit.com" },
                { label: "Wikipedia", url: "https://en.m.wikipedia.org" },
              ].map((site, i) => (
                <button
                  key={i}
                  onClick={() => { setUrlValue(site.url); setTimeout(handleNavigate, 50); }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center shadow-sm hover:bg-muted/50 transition-colors">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`}
                      className="w-8 h-8 rounded"
                      alt={site.label}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{site.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active tab state — site card */
          <div className="absolute inset-0 flex flex-col">
            {/* Site hero */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 pb-12 px-6">
              {faviconUrl && (
                <div className="w-20 h-20 bg-card border border-border rounded-3xl flex items-center justify-center shadow-lg">
                  <img
                    src={faviconUrl}
                    className="w-12 h-12 rounded-xl"
                    alt=""
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-1">{domain}</h2>
                <p className="text-sm text-muted-foreground max-w-xs truncate">{activeTab.url}</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNavigate}
                className="flex items-center gap-2.5 px-7 py-3.5 bg-primary text-white rounded-full font-semibold text-[15px] shadow-md active:opacity-90"
              >
                <Search className="w-4 h-4" />
                Open {domain}
              </motion.button>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                ${isSecure ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-600"}`}>
                {isSecure
                  ? <><Shield className="w-3.5 h-3.5" /> Secure connection</>
                  : <><ShieldAlert className="w-3.5 h-3.5" /> Not secure</>}
              </div>
            </div>

            {/* Recently visited from new tab page */}
            {tabs && tabs.filter(t => t.url && t.url !== "about:newtab" && t.id !== activeTab.id).length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground font-medium mb-2">Other open tabs</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {tabs
                    .filter(t => t.url && t.url !== "about:newtab" && t.id !== activeTab.id)
                    .slice(0, 5)
                    .map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleActivate(tab.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl shrink-0 hover:bg-muted/50 transition-colors"
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
    </div>
  );
}
