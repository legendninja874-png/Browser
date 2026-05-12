import { useLocation } from "wouter";
import {
  useGetDashboardOverview, useGetActivityFeed, useGetSyncStatus,
  usePushSync, useGetTabStats, getGetSyncStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, RefreshCw, Shield, Cpu, CloudOff, Zap, Bookmark, History, LayoutGrid, Smartphone, Laptop, Settings, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: overview,  isLoading: loadingOv }  = useGetDashboardOverview();
  const { data: activity,  isLoading: loadingAct } = useGetActivityFeed();
  const { data: sync,      isLoading: loadingSync } = useGetSyncStatus();
  const { data: tabStats,  isLoading: loadingStats } = useGetTabStats();
  const pushSync = usePushSync();

  const handleSync = () => {
    pushSync.mutate(
      { data: { includeTabs: true, includeBookmarks: true, includeHistory: true, includeSettings: true } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() }) },
    );
  };

  const getPercentage = (val: number, total: number) => {
    if (!total) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 flex items-center gap-2 px-3 h-[48px] sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[17px] font-semibold flex-1">Dashboard</span>
        <button 
          onClick={handleSync}
          disabled={pushSync.isPending}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${pushSync.isPending ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border/50 rounded-[20px] p-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-3"><Cpu className="w-5 h-5 text-muted-foreground/40" /></div>
            <div className="text-[13px] font-medium text-muted-foreground mb-1">Memory Used</div>
            {loadingOv ? <Skeleton className="h-8 w-20" /> : (
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight">{Math.round(overview?.memoryUsedMb || 0)}</span>
                <span className="text-[14px] text-muted-foreground font-medium">MB</span>
              </div>
            )}
            <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-[20px] p-4 relative overflow-hidden group hover:border-green-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-3"><Shield className="w-5 h-5 text-green-500/40" /></div>
            <div className="text-[13px] font-medium text-muted-foreground mb-1">Trackers Blocked</div>
            {loadingOv ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-[28px] font-bold tracking-tight text-foreground">{overview?.trackersBlocked.toLocaleString()}</div>
            )}
            <div className="text-[12px] text-green-500 font-medium mt-1">+12 today</div>
          </div>

          <div className="bg-card border border-border/50 rounded-[20px] p-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-3"><CloudOff className="w-5 h-5 text-primary/40" /></div>
            <div className="text-[13px] font-medium text-muted-foreground mb-1">Data Saved</div>
            {loadingOv ? <Skeleton className="h-8 w-20" /> : (
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight">{Math.round(overview?.dataSavedMb || 0)}</span>
                <span className="text-[14px] text-muted-foreground font-medium">MB</span>
              </div>
            )}
            <div className="text-[12px] text-primary font-medium mt-1">Reader mode</div>
          </div>

          <div className="bg-card border border-border/50 rounded-[20px] p-4 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-3"><Zap className="w-5 h-5 text-purple-500/40" /></div>
            <div className="text-[13px] font-medium text-muted-foreground mb-1">AI Operations</div>
            {loadingOv ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-[28px] font-bold tracking-tight">{overview?.aiUsesToday || 0}</div>
            )}
            <div className="text-[12px] text-purple-500 font-medium mt-1">Uses today</div>
          </div>
        </div>

        {/* Sync Section */}
        <section>
          <h3 className="text-[14px] font-bold px-1 mb-3 text-foreground/90">Sync & Devices</h3>
          <div className="bg-card border border-border/50 rounded-[24px] p-1 overflow-hidden">
            {loadingSync ? <Skeleton className="h-[120px] w-full rounded-[20px]" /> : (
              <div className="bg-muted/30 rounded-[20px] p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold flex items-center gap-2">
                        Sync is Active <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">
                        {sync?.lastSyncAt ? `Synced ${formatDistanceToNow(new Date(sync.lastSyncAt))} ago` : "Never synced"}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSync} disabled={pushSync.isPending} className="bg-card shadow-sm border border-border/50 px-3 py-1.5 rounded-full text-[12px] font-semibold hover:bg-muted transition-colors">
                    Sync Now
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div className="text-[13px] font-medium">This Phone</div>
                  </div>
                  <div className="flex-1 bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3 opacity-60">
                    <Laptop className="w-5 h-5 text-muted-foreground" />
                    <div className="text-[13px] font-medium">MacBook</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Browser Library & Tab Health inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section>
            <h3 className="text-[14px] font-bold px-1 mb-3 text-foreground/90">Tab Health</h3>
            <div className="bg-card border border-border/50 rounded-[24px] p-5">
              {loadingStats ? <Skeleton className="h-[100px] w-full" /> : (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-[32px] font-bold leading-none">{tabStats?.total || 0}</div>
                      <div className="text-[13px] text-muted-foreground mt-1">Total open tabs</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-3 w-full flex rounded-full overflow-hidden mb-4">
                    <div className="bg-primary" style={{ width: `${getPercentage(tabStats?.active || 0, tabStats?.total || 1)}%` }} />
                    <div className="bg-orange-400" style={{ width: `${getPercentage(tabStats?.sleeping || 0, tabStats?.total || 1)}%` }} />
                    <div className="bg-purple-500" style={{ width: `${getPercentage(tabStats?.pinned || 0, tabStats?.total || 1)}%` }} />
                  </div>
                  
                  <div className="flex justify-between text-[12px] font-medium">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Active {tabStats?.active}</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /> Sleeping {tabStats?.sleeping}</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Pinned {tabStats?.pinned}</div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-bold px-1 mb-3 text-foreground/90">Library</h3>
            <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden p-2">
              <div className="flex flex-col gap-1">
                {[
                  { icon: LayoutGrid, label: "Workspaces", count: overview?.workspaceCount, color: "text-blue-500" },
                  { icon: Bookmark, label: "Bookmarks", count: overview?.bookmarkCount, color: "text-yellow-500" },
                  { icon: History, label: "History Entries", count: overview?.historyCount, color: "text-green-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-[14px] font-medium flex-1">{item.label}</span>
                    <span className="text-[14px] font-bold text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50">{loadingOv ? "..." : item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Activity Feed */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-[14px] font-bold text-foreground/90">Activity Feed</h3>
          </div>
          <div className="bg-card border border-border/50 rounded-[24px] p-2 overflow-hidden">
            {loadingAct ? (
              <div className="p-4 space-y-4">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : activity?.length === 0 ? (
              <div className="text-center p-8 text-[14px] text-muted-foreground">No recent activity</div>
            ) : (
              <div className="flex flex-col relative">
                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border/50" />
                {activity?.slice(0, 8).map((item, i) => (
                  <div key={item.id} className="flex items-start gap-4 p-3 relative z-10 hover:bg-muted/30 rounded-xl transition-colors">
                    <div className="w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_0_4px_var(--card)]">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="text-[14px] font-medium text-foreground/90">{item.title}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 font-medium pt-1">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }).replace("about ", "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
