import { Link, useLocation } from "wouter";
import {
  Globe, LayoutGrid, Bookmark, History as HistoryIcon,
  Download, BrainCircuit, Activity, Settings, Maximize,
} from "lucide-react";
import { useListWorkspaces, useGetSyncStatus } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/",             icon: Globe,          label: "Home" },
  { href: "/browser",      icon: Maximize,       label: "Browser" },
  { href: "/workspaces",   icon: LayoutGrid,     label: "Workspaces" },
  { href: "/bookmarks",    icon: Bookmark,       label: "Bookmarks" },
  { href: "/history",      icon: HistoryIcon,    label: "History" },
  { href: "/downloads",    icon: Download,       label: "Downloads" },
  { href: "/intelligence", icon: BrainCircuit,   label: "Intelligence" },
  { href: "/dashboard",    icon: Activity,       label: "Dashboard" },
  { href: "/settings",     icon: Settings,       label: "Settings" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: workspaces } = useListWorkspaces();
  const { data: syncStatus } = useGetSyncStatus();
  const activeWorkspace = workspaces?.find(w => w.isActive) ?? workspaces?.[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar — 40px collapsed, 180px on hover */}
      <nav className="group/sidebar flex flex-col h-full w-10 hover:w-[180px] transition-[width] duration-200 ease-out border-r border-white/8 bg-sidebar shrink-0 overflow-hidden z-30">

        {/* Logo */}
        <div className="flex items-center h-10 px-2.5 border-b border-white/8 shrink-0">
          <div className="w-5 h-5 rounded bg-primary/90 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
            E
          </div>
          <span className="ml-2.5 text-xs font-semibold tracking-widest text-white/70 uppercase opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
            EoN Browser
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 flex flex-col gap-0.5 py-2 px-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Tooltip key={href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={href}>
                    <div
                      className={`flex items-center gap-2.5 h-8 px-2 rounded cursor-pointer transition-colors duration-100 group/item
                        ${isActive
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:bg-white/6 hover:text-white/80"
                        }`}
                      data-testid={`nav-${label.toLowerCase()}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span className="text-xs font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
                        {label}
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-primary opacity-0 group-hover/sidebar:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-hover/sidebar:hidden text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom — workspace + sync */}
        <div className="shrink-0 py-2 px-1.5 border-t border-white/8 flex flex-col gap-1">
          {activeWorkspace && (
            <div className="flex items-center gap-2.5 h-7 px-2 rounded overflow-hidden">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activeWorkspace.color }}
              />
              <span className="text-[11px] text-white/40 truncate whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
                {activeWorkspace.name}
              </span>
            </div>
          )}
          {syncStatus && (
            <div className="flex items-center gap-2.5 h-7 px-2 rounded overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] text-white/30 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
                {syncStatus.deviceCount} devices synced
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
