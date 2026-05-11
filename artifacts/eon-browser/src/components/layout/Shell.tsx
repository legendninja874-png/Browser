import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Globe, LayoutGrid, Bookmark, History as HistoryIcon, 
  Download, BrainCircuit, Activity, Settings, Maximize, 
  PanelLeftClose, PanelLeftOpen 
} from "lucide-react";
import { useListWorkspaces, useGetSyncStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: Globe, label: "Home" },
  { href: "/browser", icon: Maximize, label: "Browser" },
  { href: "/workspaces", icon: LayoutGrid, label: "Workspaces" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/history", icon: HistoryIcon, label: "History" },
  { href: "/downloads", icon: Download, label: "Downloads" },
  { href: "/intelligence", icon: BrainCircuit, label: "Intelligence" },
  { href: "/dashboard", icon: Activity, label: "Dashboard" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: workspaces } = useListWorkspaces();
  const { data: syncStatus } = useGetSyncStatus();
  
  const activeWorkspace = workspaces?.find(w => w.isActive) || workspaces?.[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        className="relative flex flex-col h-full border-r border-white/10 bg-card/40 backdrop-blur-xl z-20"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-black neon-box">
              E
            </div>
            {isSidebarOpen && (
              <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 whitespace-nowrap">
                EoN BROWSER
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
                    ${isActive 
                      ? "bg-primary/20 text-primary neon-box" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "group-hover:text-white"}`} />
                  {isSidebarOpen && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/10 flex flex-col gap-2">
          {activeWorkspace && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/20 border border-white/5" title="Active Workspace">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: activeWorkspace.color, boxShadow: `0 0 10px ${activeWorkspace.color}` }} 
              />
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Workspace</span>
                  <span className="text-sm font-medium truncate">{activeWorkspace.name}</span>
                </div>
              )}
            </div>
          )}
          
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
              ${location === "/settings" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"}
            `}>
              <Settings className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">Settings</span>}
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-white hover:bg-white/10"
              data-testid="toggle-sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            
            {/* Contextual top bar content could go here based on route */}
          </div>
          
          <div className="flex items-center gap-4">
            {syncStatus && (
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">SYNC: <span className="text-white">{syncStatus.deviceCount} DEV</span></span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
