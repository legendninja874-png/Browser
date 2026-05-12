import { useState } from "react";
import { useLocation } from "wouter";
import { useListDownloads, useStartDownload, getListDownloadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, File, CheckCircle, XCircle, Loader2, Download, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Downloads() {
  const [, navigate]  = useLocation();
  const queryClient   = useQueryClient();
  const { data: downloads, isLoading } = useListDownloads();
  const startDownload = useStartDownload();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl]           = useState("");
  const [filename, setFilename] = useState("");

  const handleStart = () => {
    if (!url || !filename) return;
    startDownload.mutate({ data: { url, filename } }, {
      onSuccess: () => {
        setUrl(""); setFilename(""); setShowForm(false);
        queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
      },
    });
  };

  const statusIcon = (s: string) => {
    if (s === "complete" || s === "completed")    return <CheckCircle className="w-4.5 h-4.5 text-green-500" />;
    if (s === "failed")     return <XCircle className="w-4.5 h-4.5 text-destructive" />;
    if (s === "downloading") return <Loader2 className="w-4.5 h-4.5 text-primary animate-spin" />;
    return <Download className="w-4.5 h-4.5 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold flex-1">Downloads</span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            data-testid="btn-new-download"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {showForm && (
          <div className="browser-card p-4 flex flex-col gap-3">
            <div className="text-sm font-medium text-foreground/70">New download</div>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/file.zip"
              className="h-10 bg-muted rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              data-testid="input-url"
            />
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="filename.zip"
              className="h-10 bg-muted rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              data-testid="input-filename"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl bg-muted text-sm text-foreground/70 hover:bg-muted/80 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={!url || !filename || startDownload.isPending}
                className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : downloads?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Download className="w-10 h-10 text-muted-foreground/30" />
            <div className="text-sm text-muted-foreground">No downloads yet</div>
          </div>
        ) : (
          <div className="browser-card divide-y divide-border overflow-hidden">
            {downloads?.map(dl => {
              const pct = dl.sizeBytes
                ? Math.round((dl.downloadedBytes / dl.sizeBytes) * 100)
                : dl.status === "complete" || dl.status === "completed" ? 100 : 0;
              return (
                <div key={dl.id} className="flex items-center gap-3 px-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm text-foreground/85 truncate font-medium">{dl.filename}</span>
                      {statusIcon(dl.status)}
                    </div>
                    <Progress value={pct} className="h-1 bg-muted mb-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(dl.downloadedBytes)}{dl.sizeBytes ? ` / ${formatBytes(dl.sizeBytes)}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{dl.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
