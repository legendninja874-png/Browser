import { useLocation } from "wouter";
import {
  useGetDashboardOverview, useGetActivityFeed, useGetSyncStatus,
  usePushSync, useGetTabStats, getGetSyncStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, RefreshCw, Shield, Cpu, HardDrive, Zap, Bookmark, History, LayoutGrid } from "lucide-react";
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

  const handleSync = () =>
    pushSync.mutate(
      { data: { includeTabs: true, includeBookmarks: true, includeHistory: true, includeSettings: true } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() }) },
    );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 bg-card border-b border-border flex items-center gap-3 px-4 h-12">
        <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold">Dashboard</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* Stats */}
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">System</div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Memory" value={overview ? `${Math.round(overview.memoryUsedMb)} MB` : undefined} icon={Cpu} loading={loadingOv} />
            <StatCard label="Trackers blocked" value={overview?.trackersBlocked.toLocaleString()} icon={Shield} loading={loadingOv} iconColor="text-green-500" />
            <StatCard label="Data saved" value={overview ? `${Math.round(overview.dataSavedMb)} MB` : undefined} icon={HardDrive} loading={loadingOv} iconColor="text-primary" />
            <StatCard label="AI operations" value={overview?.aiUsesToday?.toString()} icon={Zap} loading={loadingOv} iconColor="text-yellow-500" />
          </div>
        </section>

        {/* Library */}
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Library</div>
          <div className="browser-card divide-y divide-border overflow-hidden">
            <CountRow label="Workspaces" value={overview?.workspaceCount} icon={LayoutGrid} loading={loadingOv} />
            <CountRow label="Bookmarks"  value={overview?.bookmarkCount}  icon={Bookmark}   loading={loadingOv} />
            <CountRow label="History"    value={overview?.historyCount}   icon={History}    loading={loadingOv} />
          </div>
        </section>

        {/* Tab stats */}
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Tabs</div>
          <div className="browser-card divide-y divide-border overflow-hidden">
            <CountRow label="Total"    value={tabStats?.total}    loading={loadingStats} />
            <CountRow label="Sleeping" value={tabStats?.sleeping} loading={loadingStats} />
            <CountRow label="Pinned"   value={tabStats?.pinned}   loading={loadingStats} />
            <CountRow label="Incognito" value={tabStats?.incognito} loading={loadingStats} />
          </div>
        </section>

        {/* Sync */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cloud Sync</span>
            <button
              onClick={handleSync}
              disabled={pushSync.isPending}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pushSync.isPending ? "animate-spin" : ""}`} />
              Sync now
            </button>
          </div>
          <div className="browser-card divide-y divide-border overflow-hidden">
            {loadingSync ? <Skeleton className="h-28 m-4" /> : (
              <>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground/70">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-500 font-medium">Online</span>
                  </div>
                </div>
                <CountRow label="Connected devices" value={sync?.deviceCount} loading={false} />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground/70">Last synced</span>
                  <span className="text-sm text-muted-foreground">
                    {sync?.lastSyncAt ? formatDistanceToNow(new Date(sync.lastSyncAt), { addSuffix: true }) : "Never"}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Activity */}
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Recent Activity</div>
          <div className="browser-card divide-y divide-border overflow-hidden">
            {loadingAct
              ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)
              : activity?.slice(0, 8).map(item => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/80 truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                  </div>
                  <span className="text-xs text-muted-foreground/60 shrink-0">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))
            }
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, loading, iconColor }: {
  label: string; value?: string; icon: React.ElementType; loading: boolean; iconColor?: string;
}) {
  return (
    <div className="browser-card p-4 flex items-center gap-3">
      <Icon className={`w-5 h-5 shrink-0 ${iconColor ?? "text-muted-foreground"}`} />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {loading
          ? <Skeleton className="h-5 w-16 mt-1" />
          : <div className="text-base font-semibold text-foreground/85 tabular-nums mt-0.5">{value ?? "—"}</div>
        }
      </div>
    </div>
  );
}

function CountRow({ label, value, icon: Icon, loading }: {
  label: string; value?: number; icon?: React.ElementType; loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm text-foreground/75">{label}</span>
      </div>
      {loading
        ? <Skeleton className="h-4 w-10" />
        : <span className="text-sm font-semibold text-foreground/80 tabular-nums">{value ?? 0}</span>
      }
    </div>
  );
}
