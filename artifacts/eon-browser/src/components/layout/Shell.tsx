import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Square, LayoutGrid, AlignJustify,
  Plus, EyeOff, Bookmark, History, Download,
  BrainCircuit, Activity, Settings, Share2,
  Search, RotateCw, Star, Info, ChevronRight,
  X, Trash2, Shield,
} from "lucide-react";
import {
  useListTabs, useCreateTab, useGetSyncStatus,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface ShellProps { children: React.ReactNode }

export function Shell({ children }: ShellProps) {
  const [location, navigate] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: tabs } = useListTabs();
  const createTab = useCreateTab();
  const { data: syncStatus } = useGetSyncStatus();

  const activeTab = tabs?.find(t => t.isActive);
  const tabCount = tabs?.length ?? 0;

  const handleNewTab = () => {
    createTab.mutate(
      { data: { url: "about:newtab", title: "New Tab" } },
      { onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        navigate("/browser");
      }}
    );
  };

  const handleMenuAction = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  const isHome     = location === "/";
  const isBrowser  = location === "/browser";
  const isTabs     = location === "/tabs";

  const getAddressLabel = () => {
    if (isBrowser && activeTab?.url && activeTab.url !== "about:newtab") {
      try {
        return new URL(activeTab.url).hostname.replace("www.", "");
      } catch { return activeTab.url; }
    }
    return null;
  };

  const addressLabel = getAddressLabel();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Page content */}
      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>

      {/* Bottom navigation bar */}
      <nav className="shrink-0 h-14 bg-card/95 backdrop-blur-md border-t border-border flex items-center px-2 gap-1 z-40">
        {/* Home */}
        <NavButton
          icon={Home}
          active={isHome}
          onClick={() => navigate("/")}
          testId="nav-home"
        />

        {/* Tabs */}
        <button
          onClick={() => navigate("/tabs")}
          className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors
            ${isTabs ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          data-testid="nav-tabs"
        >
          <Square className="w-5 h-5" strokeWidth={2} />
          {tabCount > 0 && (
            <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center
              ${isTabs ? "bg-primary text-white" : "bg-muted-foreground/60 text-background"}`}>
              {tabCount > 99 ? "99" : tabCount}
            </span>
          )}
        </button>

        {/* Address bar pill */}
        <button
          onClick={() => navigate("/browser")}
          className={`flex-1 flex items-center gap-2 h-9 px-3.5 rounded-full border transition-colors
            ${isBrowser
              ? "bg-muted/80 border-border/60 text-foreground"
              : "bg-muted/50 border-border/40 text-muted-foreground hover:bg-muted hover:border-border"}`}
          data-testid="nav-address"
        >
          {isBrowser && activeTab?.url && activeTab.url !== "about:newtab" && (
            <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
          {!isBrowser && <Search className="w-3.5 h-3.5 shrink-0" />}
          <span className={`flex-1 text-left text-sm truncate ${addressLabel ? "text-foreground/80" : "text-muted-foreground"}`}>
            {addressLabel ?? "Search or type URL"}
          </span>
          {isBrowser && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-muted-foreground">🎙</span>
              <span className="text-[11px] text-muted-foreground">⊡</span>
            </div>
          )}
        </button>

        {/* Workspaces */}
        <NavButton
          icon={LayoutGrid}
          active={location === "/workspaces"}
          onClick={() => navigate("/workspaces")}
          testId="nav-workspaces"
        />

        {/* Menu */}
        <NavButton
          icon={AlignJustify}
          active={showMenu}
          onClick={() => setShowMenu(true)}
          testId="nav-menu"
        />
      </nav>

      {/* Menu bottom sheet */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bottom-sheet pb-safe"
            >
              {/* Quick action row */}
              <div className="flex items-center justify-around px-4 pt-4 pb-3 border-b border-border">
                {[
                  { icon: ChevronRight,  label: "Forward" },
                  { icon: Star,          label: "Bookmark" },
                  { icon: Download,      label: "Download" },
                  { icon: Info,          label: "Info" },
                  { icon: RotateCw,      label: "Refresh" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-foreground/70" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>

              {/* Menu items */}
              <div className="overflow-y-auto max-h-72">
                {[
                  { icon: Plus,         label: "New tab",            action: () => { handleNewTab(); } },
                  { icon: EyeOff,       label: "New Incognito tab",  action: () => handleMenuAction("/browser") },
                  { icon: LayoutGrid,   label: "Add tab to group",   action: () => handleMenuAction("/workspaces") },
                  null,
                  { icon: History,      label: "History",            action: () => handleMenuAction("/history") },
                  { icon: Trash2,       label: "Clear browsing data", action: () => handleMenuAction("/settings") },
                  null,
                  { icon: Download,     label: "Downloads",          action: () => handleMenuAction("/downloads") },
                  { icon: Star,         label: "Bookmarks",          action: () => handleMenuAction("/bookmarks") },
                  { icon: Square,       label: "Recent tabs",        action: () => handleMenuAction("/tabs") },
                  null,
                  { icon: BrainCircuit, label: "EoN Intelligence",   action: () => handleMenuAction("/intelligence") },
                  { icon: Activity,     label: "Dashboard",          action: () => handleMenuAction("/dashboard") },
                  null,
                  { icon: Share2,       label: "Share...",           action: () => setShowMenu(false) },
                  { icon: Search,       label: "Find in page",       action: () => setShowMenu(false) },
                  { icon: Settings,     label: "Settings",           action: () => handleMenuAction("/settings") },
                ].map((item, i) => {
                  if (!item) return <div key={i} className="h-px bg-border mx-4" />;
                  const { icon: Icon, label, action } = item;
                  return (
                    <button
                      key={label}
                      onClick={action}
                      className="flex items-center gap-4 w-full px-5 py-3.5 hover:bg-muted/60 transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-foreground/60 shrink-0" />
                      <span className="text-sm text-foreground/85">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sync badge */}
              {syncStatus && (
                <div className="flex items-center justify-center gap-2 py-3 border-t border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">{syncStatus.deviceCount} devices synced</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon: Icon, active, onClick, testId }: {
  icon: React.ElementType; active: boolean; onClick: () => void; testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors
        ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
