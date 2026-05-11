import {
  useGetDashboardOverview, useGetActivityFeed, useGetSyncStatus, usePushSync, useGetTabStats,
  getGetSyncStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Shield, Cpu, HardDrive, Zap, LayoutGrid, Bookmark, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const activityTypeColor: Record<string, string> = {
  ai:        "bg-primary/60",
  tab_group: "bg-blue-400/60",
  sync:      "bg-emerald-400/60",
  download:  "bg-amber-400/60",
  bookmark:  "bg-violet-400/60",
  security:  "bg-green-400/60",
  tab_sleep: "bg-slate-400/60",
  workspace: "bg-cyan-400/60",
};

export default function Dashboard() {
  const queryClient  = useQueryClient();
  const { data: overview, isLoading: loadingOv }   = useGetDashboardOverview();
  const { data: activity, isLoading: loadingAct }  = useGetActivityFeed();
  const { data: sync,     isLoading: loadingSync } = useGetSyncStatus();
  const { data: tabStats, isLoading: loadingStats } = useGetTabStats();
  const pushSync = usePushSync();

  const handleSync = () =>
    pushSync.mutate(
      { data: { includeTabs: true, includeBookmarks: true, includeHistory: true, includeSettings: true } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() }) },
    );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Page heading */}
        <div>
          <h1 className="text-sm font-semibold text-white/80 tracking-wide">Command Center</h1>
          <p className="text-[11px] text-white/35 mt-0.5">Browser telemetry and system health</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Memory"    value={overview ? `${Math.round(overview.memoryUsedMb)} MB` : undefined} icon={Cpu}      color="text-violet-400" loading={loadingOv} />
          <Stat label="Trackers"  value={overview?.trackersBlocked.toLocaleString()}                         icon={Shield}   color="text-emerald-400" loading={loadingOv} />
          <Stat label="Saved"     value={overview ? `${Math.round(overview.dataSavedMb)} MB` : undefined}    icon={HardDrive} color="text-primary" loading={loadingOv} />
          <Stat label="AI Ops"    value={overview?.aiUsesToday?.toString()}                                   icon={Zap}      color="text-amber-400" loading={loadingOv} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Activity feed — spans 2 cols */}
          <section className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Recent Activity</span>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/3 overflow-hidden divide-y divide-white/5">
              {loadingAct
                ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)
                : activity?.slice(0, 8).map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-white/4 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activityTypeColor[item.type] ?? "bg-white/30"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white/70 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-white/35 truncate">{item.description}</div>
                    </div>
                    <span className="text-[10px] text-white/25 shrink-0 font-mono">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))
              }
            </div>
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Data counts */}
            <section className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Library</span>
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5">
                <DataRow icon={LayoutGrid} label="Workspaces" value={overview?.workspaceCount} loading={loadingOv} />
                <DataRow icon={Bookmark}   label="Bookmarks"  value={overview?.bookmarkCount}  loading={loadingOv} />
                <DataRow icon={History}    label="History"    value={overview?.historyCount}    loading={loadingOv} />
              </div>
            </section>

            {/* Tab stats */}
            <section className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Tabs</span>
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5">
                <DataRow label="Total"    value={tabStats?.total}    loading={loadingStats} />
                <DataRow label="Sleeping" value={tabStats?.sleeping} loading={loadingStats} />
                <DataRow label="Pinned"   value={tabStats?.pinned}   loading={loadingStats} />
                <DataRow label="Incognito" value={tabStats?.incognito} loading={loadingStats} />
              </div>
            </section>

            {/* Sync */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Sync</span>
                <button
                  onClick={handleSync}
                  disabled={pushSync.isPending}
                  className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary px-2 py-0.5 rounded hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${pushSync.isPending ? "animate-spin" : ""}`} />
                  Sync now
                </button>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5">
                {loadingSync ? <Skeleton className="h-16 w-full" /> : (
                  <>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[11px] text-white/40">Status</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online
                      </span>
                    </div>
                    <DataRow label="Devices" value={sync?.deviceCount} loading={false} />
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[11px] text-white/40">Last sync</span>
                      <span className="text-[11px] text-white/60 font-mono">
                        {sync?.lastSyncAt
                          ? formatDistanceToNow(new Date(sync.lastSyncAt), { addSuffix: true })
                          : "Never"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color, loading }: {
  label: string; value?: string; icon: React.ElementType; color: string; loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-3 flex items-center gap-3">
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <div className="min-w-0">
        <div className="text-[11px] text-white/35">{label}</div>
        {loading
          ? <Skeleton className="h-4 w-16 mt-1 bg-white/5" />
          : <div className="text-sm font-semibold text-white/85 font-mono tabular-nums">{value ?? "—"}</div>
        }
      </div>
    </div>
  );
}

function DataRow({ label, value, loading, icon: Icon }: {
  label: string; value?: number; loading: boolean; icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3 text-white/30" />}
        <span className="text-[11px] text-white/40">{label}</span>
      </div>
      {loading
        ? <Skeleton className="h-3.5 w-8 bg-white/5" />
        : <span className="text-[12px] font-semibold text-white/70 font-mono">{value ?? 0}</span>
      }
    </div>
  );
}
