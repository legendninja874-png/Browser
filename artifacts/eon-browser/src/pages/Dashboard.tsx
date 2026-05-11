import { 
  useGetDashboardOverview, useGetActivityFeed, useGetSyncStatus, usePushSync, useGetTabStats,
  getGetSyncStatusQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Cpu, Database, HardDrive, RefreshCw, Shield, LayoutGrid, Bookmark, History, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: overview, isLoading: loadingOverview } = useGetDashboardOverview();
  const { data: activity, isLoading: loadingActivity } = useGetActivityFeed();
  const { data: sync, isLoading: loadingSync } = useGetSyncStatus();
  const { data: tabStats, isLoading: loadingStats } = useGetTabStats();
  const pushSync = usePushSync();

  const handleSync = () => {
    pushSync.mutate(
      { data: { includeTabs: true, includeBookmarks: true, includeHistory: true, includeSettings: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          Command Center
        </h1>
        <p className="text-muted-foreground">System telemetry and browser health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Memory Used" value={overview ? `${overview.memoryUsedMb} MB` : ''} icon={Cpu} color="text-secondary" loading={loadingOverview} />
        <StatCard title="Trackers Blocked" value={overview?.trackersBlocked.toLocaleString()} icon={Shield} color="text-green-500" loading={loadingOverview} />
        <StatCard title="Data Saved" value={overview ? `${overview.dataSavedMb} MB` : ''} icon={HardDrive} color="text-primary" loading={loadingOverview} />
        <StatCard title="AI Operations" value={overview?.aiUsesToday.toString()} icon={Zap} color="text-accent" loading={loadingOverview} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-primary" />
                Data Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{overview?.workspaceCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1"><LayoutGrid className="w-3 h-3"/> Workspaces</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{overview?.bookmarkCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1"><Bookmark className="w-3 h-3"/> Bookmarks</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{overview?.historyCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1"><History className="w-3 h-3"/> History Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-secondary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  {activity?.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0 neon-box" />
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase font-mono">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="glass-panel border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-accent" />
                Sync Engine
              </CardTitle>
              <Button size="sm" variant="outline" className="h-8 border-accent/30 text-accent hover:bg-accent hover:text-black" onClick={handleSync} disabled={pushSync.isPending}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${pushSync.isPending ? 'animate-spin' : ''}`} />
                Force Sync
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSync ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-green-500 font-mono font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ONLINE
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Devices Connected</span>
                    <span className="text-white font-mono font-medium">{sync?.deviceCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last Synced</span>
                    <span className="text-white font-mono font-medium text-xs">
                      {sync?.lastSyncAt ? formatDistanceToNow(new Date(sync.lastSyncAt), { addSuffix: true }) : 'Never'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10 bg-gradient-to-br from-card/40 to-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Tab Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Total Active</span>
                    <span className="text-2xl font-bold text-primary">{tabStats?.total}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Sleeping</span>
                    <span className="text-xl font-bold text-muted-foreground">{tabStats?.sleeping}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Pinned</span>
                    <span className="text-xl font-bold text-secondary">{tabStats?.pinned}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-muted-foreground text-sm">Incognito</span>
                    <span className="text-xl font-bold text-accent">{tabStats?.incognito}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }: { title: string, value?: string, icon: any, color: string, loading: boolean }) {
  return (
    <Card className="glass-panel border-white/10 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-bl-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110 ${color}`} />
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold text-white font-mono mt-1">{value}</h3>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
