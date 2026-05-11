import { useListDownloads, useStartDownload, getListDownloadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Download as DownloadIcon, File, CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Downloads() {
  const queryClient = useQueryClient();
  const { data: downloads, isLoading } = useListDownloads();
  const startDownload = useStartDownload();

  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");

  const handleStart = () => {
    if (!url || !filename) return;
    startDownload.mutate(
      { data: { url, filename } },
      {
        onSuccess: () => {
          setUrl("");
          setFilename("");
          queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
        }
      }
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <DownloadIcon className="text-green-500 w-8 h-8" />
          Downloads
        </h1>
        <p className="text-muted-foreground">Manage your downloaded files.</p>
      </div>

      <div className="glass-panel p-4 rounded-xl mb-8 flex gap-4 items-end border-primary/20">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">URL</label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/file.zip" className="bg-black/50" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Filename</label>
          <Input value={filename} onChange={e => setFilename(e.target.value)} placeholder="file.zip" className="bg-black/50" />
        </div>
        <Button onClick={handleStart} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-black border border-green-500/50">
          <Play className="w-4 h-4 mr-2" /> Start Download
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />)
        ) : downloads?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
            No downloads yet.
          </div>
        ) : (
          downloads?.map(download => (
            <div key={download.id} className="glass-panel p-5 rounded-xl border-white/10 flex items-center gap-6">
              <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                <File className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white truncate">{download.filename}</h4>
                    <p className="text-xs text-muted-foreground truncate">{download.url}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {download.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {download.status === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
                    {download.status === 'downloading' && <Clock className="w-5 h-5 text-accent animate-pulse" />}
                    <span className="capitalize font-mono">{download.status}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{formatBytes(download.downloadedBytes)} / {download.sizeBytes ? formatBytes(download.sizeBytes) : 'Unknown'}</span>
                    {download.sizeBytes && <span>{Math.round((download.downloadedBytes / download.sizeBytes) * 100)}%</span>}
                  </div>
                  <Progress 
                    value={download.sizeBytes ? (download.downloadedBytes / download.sizeBytes) * 100 : (download.status === 'completed' ? 100 : undefined)} 
                    className="h-1.5 bg-black/50"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
