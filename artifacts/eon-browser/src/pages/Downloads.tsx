import { useState } from "react";
import { useListDownloads, useStartDownload, getListDownloadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { File, CheckCircle, XCircle, Loader2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const statusColor: Record<string, string> = {
  complete:    "text-emerald-400",
  downloading: "text-primary",
  paused:      "text-amber-400",
  failed:      "text-red-400",
};

export default function Downloads() {
  const queryClient = useQueryClient();
  const { data: downloads, isLoading } = useListDownloads();
  const startDownload = useStartDownload();

  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleStart = () => {
    if (!url || !filename) return;
    startDownload.mutate({ data: { url, filename } }, {
      onSuccess: () => {
        setUrl("");
        setFilename("");
        setShowForm(false);
        queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white/75">Downloads</div>
            <div className="text-[11px] text-white/30 mt-0.5">{downloads?.length ?? 0} files</div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/8 transition-colors"
            data-testid="btn-new-download"
          >
            <Plus className="w-3.5 h-3.5" />
            New download
          </button>
        </div>

        {/* New download form */}
        {showForm && (
          <div className="rounded-lg border border-white/10 bg-white/4 p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-white/40">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/file.zip"
                  className="h-8 bg-white/6 border border-white/10 rounded px-2.5 text-[12px] text-white/70 placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
                  data-testid="input-download-url"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-white/40">Filename</label>
                <input
                  type="text"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  placeholder="file.zip"
                  className="h-8 bg-white/6 border border-white/10 rounded px-2.5 text-[12px] text-white/70 placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
                  data-testid="input-download-filename"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="h-7 px-3 rounded text-[12px] text-white/35 hover:text-white/55 hover:bg-white/6 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={!url || !filename || startDownload.isPending}
                className="h-7 px-3 rounded text-[12px] bg-primary/80 hover:bg-primary text-black font-medium transition-colors disabled:opacity-40"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Download list */}
        {isLoading
          ? <div className="space-y-1">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full bg-white/5" />)}</div>
          : downloads?.length === 0
            ? <div className="py-10 text-center text-sm text-white/25">No downloads yet</div>
            : (
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
                {downloads?.map(dl => {
                  const pct = dl.sizeBytes ? (dl.downloadedBytes / dl.sizeBytes) * 100 : dl.status === "complete" ? 100 : 0;
                  return (
                    <div key={dl.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded bg-white/6 border border-white/8 flex items-center justify-center shrink-0">
                        <File className="w-3.5 h-3.5 text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[12px] text-white/70 truncate">{dl.filename}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {dl.status === "complete" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {dl.status === "failed"   && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            {dl.status === "downloading" && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                            <span className={`text-[11px] font-mono capitalize ${statusColor[dl.status] ?? "text-white/35"}`}>
                              {dl.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="flex-1 h-1 bg-white/8" />
                          <span className="text-[10px] text-white/25 font-mono shrink-0">
                            {formatBytes(dl.downloadedBytes)}{dl.sizeBytes ? ` / ${formatBytes(dl.sizeBytes)}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>
    </div>
  );
}
