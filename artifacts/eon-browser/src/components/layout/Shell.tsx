import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Shield, Mic, Search,
  MoreVertical, Star, RotateCw, Plus, EyeOff, Bookmark,
  History, Download, Settings, BrainCircuit, Activity,
  MonitorSmartphone, Share2, Printer
} from "lucide-react";
import {
  useListTabs, useCreateTab, useGetSyncStatus,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBrowserStore } from "@/store/browser";

interface ShellProps { children: React.ReactNode }

export function Shell({ children }: ShellProps) {
  const [location, navigate] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: tabs } = useListTabs();
  const createTab = useCreateTab();
  const { data: syncStatus } = useGetSyncStatus();

  const { isDesktopMode, setIsDesktopMode, setUrlInputOpen } = useBrowserStore();

  const activeTab = tabs?.find(t => t.isActive);
  const tabCount = tabs?.length ?? 0;

  const handleNewTab = () => {
    setShowMenu(false);
    createTab.mutate(
      { data: { url: "about:newtab", title: "New Tab" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
          navigate("/browser");
        },
      }
    );
  };

  const handleMenuAction = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  const isBrowser = location === "/browser";

  const getAddressLabel = () => {
    if (activeTab?.url && activeTab.url !== "about:newtab") {
      try { return new URL(activeTab.url).hostname.replace("www.", ""); } catch { return activeTab.url; }
    }
    return null;
  };

  const addressLabel = getAddressLabel();
  const isSecure = activeTab?.url?.startsWith("https://");

  const handleAddressTap = () => {
    // Set the store flag synchronously BEFORE navigating so Browser.tsx sees it on mount
    setUrlInputOpen(true);
    if (!isBrowser) navigate("/browser");
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative text-[14px]">
      {/* Page content */}
      <main className="flex-1 overflow-hidden min-w-0 z-0 relative">
        {children}
      </main>

      {/* Bottom navigation bar */}
      <nav className="shrink-0 h-[56px] glass-morphism border-t flex items-center px-2 gap-1 z-40">
        <NavButton icon={ArrowLeft} disabled={!isBrowser} onClick={() => {}} />
        <NavButton icon={ArrowRight} disabled={true} onClick={() => {}} />

        {/* Address bar pill — primary URL entry point */}
        <button
          onClick={handleAddressTap}
          className={`flex-1 flex items-center gap-2 h-10 px-3 rounded-full border transition-colors mx-1
            ${isBrowser && addressLabel
              ? "bg-card border-border/70 text-foreground"
              : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"}`}
        >
          {isBrowser && addressLabel ? (
            isSecure
              ? <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
              : <Search className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className={`flex-1 text-left text-[13px] truncate font-medium ${isBrowser && addressLabel ? "text-foreground" : "text-muted-foreground"}`}>
            {isBrowser && addressLabel ? addressLabel : "Search or type URL"}
          </span>
          <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>

        {/* Tab counter */}
        <button
          onClick={() => navigate("/tabs")}
          className="relative flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-5 h-5 border-[1.5px] border-current rounded-[4px] flex items-center justify-center text-[10px] font-bold">
            {tabCount > 99 ? "∞" : tabCount}
          </div>
        </button>

        {/* More menu */}
        <NavButton icon={MoreVertical} onClick={() => setShowMenu(true)} />
      </nav>

      {/* ── Menu bottom sheet ── */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bottom-sheet pb-safe max-h-[85vh] flex flex-col"
            >
              {/* Quick actions row */}
              <div className="flex items-center justify-around px-4 pt-5 pb-4 border-b border-border">
                {[
                  { icon: ArrowLeft,  label: "Back",     action: () => setShowMenu(false) },
                  { icon: ArrowRight, label: "Forward",  action: () => setShowMenu(false) },
                  { icon: Star,       label: "Bookmark", action: () => setShowMenu(false) },
                  { icon: Search,     label: "Find",     action: () => setShowMenu(false) },
                  { icon: RotateCw,   label: "Refresh",  action: () => setShowMenu(false) },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl group"
                  >
                    <div className="w-11 h-11 rounded-full bg-muted group-hover:bg-muted/80 group-active:scale-95 flex items-center justify-center transition-all">
                      <Icon className="w-5 h-5 text-foreground/70" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto py-2">
                {[
                  { icon: Plus,            label: "New tab",             action: handleNewTab },
                  { icon: EyeOff,          label: "New incognito tab",   action: handleNewTab },
                  null,
                  { icon: Bookmark,        label: "Bookmarks",           action: () => handleMenuAction("/bookmarks") },
                  { icon: History,         label: "History",             action: () => handleMenuAction("/history") },
                  { icon: Download,        label: "Downloads",           action: () => handleMenuAction("/downloads") },
                  null,
                  { icon: BrainCircuit,    label: "EoN AI",              action: () => handleMenuAction("/intelligence") },
                  { icon: Activity,        label: "Dashboard",           action: () => handleMenuAction("/dashboard") },
                  null,
                  {
                    icon: MonitorSmartphone,
                    label: isDesktopMode ? "Mobile site" : "Desktop site",
                    action: () => { setIsDesktopMode(!isDesktopMode); setShowMenu(false); },
                    rightLabel: isDesktopMode ? "On" : undefined,
                  },
                  { icon: Share2,  label: "Share…",   action: () => setShowMenu(false) },
                  { icon: Printer, label: "Print",    action: () => setShowMenu(false) },
                  null,
                  { icon: Settings, label: "Settings", action: () => handleMenuAction("/settings") },
                ].map((item, i) => {
                  if (!item) return <div key={i} className="h-[1px] bg-border mx-4 my-2" />;
                  const { icon: Icon, label, action, rightLabel } = item;
                  return (
                    <button
                      key={label}
                      onClick={action}
                      className="flex items-center gap-4 w-full px-5 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-foreground/70 shrink-0" />
                      <span className="text-[14px] text-foreground font-medium flex-1">{label}</span>
                      {rightLabel && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {rightLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sync status row */}
              <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 border-t border-border mt-auto">
                <div className={`w-2 h-2 rounded-full ${syncStatus?.deviceCount ? "bg-green-500" : "bg-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground font-medium">
                  {syncStatus?.deviceCount ? `Syncing to ${syncStatus.deviceCount} devices` : "Sync is paused"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon: Icon, disabled, onClick }: {
  icon: React.ElementType; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      <Icon className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
