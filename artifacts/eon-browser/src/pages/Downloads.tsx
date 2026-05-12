import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useListDownloads, useStartDownload, getListDownloadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Download, FileText, Image as ImageIcon, Video, Music, Archive, Check, Pause, Play, RotateCcw, X, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const FILTERS = ["All", "Images", "Videos", "Documents", "Audio", "Archives"];

function getFileType(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'Images';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return 'Videos';
  if (['pdf','doc','docx','txt','xls','xlsx','ppt','pptx'].includes(ext)) return 'Documents';
  if (['mp3','wav','ogg','m4a'].includes(ext)) return 'Audio';
  if (['zip','rar','7z','tar','gz','apk'].includes(ext)) return 'Archives';
  return 'Other';
}

function getFileIcon(type: string) {
  switch(type) {
    case 'Images': return { icon: ImageIcon, color: "text-green-500", bg: "bg-green-500/10" };
    case 'Videos': return { icon: Video, color: "text-blue-500", bg: "bg-blue-500/10" };
    case 'Documents': return { icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" };
    case 'Audio': return { icon: Music, color: "text-pink-500", bg: "bg-pink-500/10" };
    case 'Archives': return { icon: Archive, color: "text-purple-500", bg: "bg-purple-500/10" };
    default: return { icon: FileText, color: "text-muted-foreground", bg: "bg-muted" };
  }
}

export default function Downloads() {
  const [, navigate]  = useLocation();
  const queryClient   = useQueryClient();
  const { data: downloads, isLoading } = useListDownloads();
  const startDownload = useStartDownload();
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [url, setUrl]           = useState("");
  const [filename, setFilename] = useState("");

  const handleStart = () => {
    if (!url || !filename) return;
    startDownload.mutate({ data: { url, filename } }, {
      onSuccess: () => {
        setUrl(""); setFilename(""); setShowAddSheet(false);
        queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
      },
    });
  };

  const filteredDownloads = useMemo(() => {
    if (!downloads) return [];
    if (activeFilter === "All") return downloads;
    return downloads.filter(d => getFileType(d.filename) === activeFilter);
  }, [downloads, activeFilter]);

  const stats = useMemo(() => {
    if (!downloads) return { completed: 0, downloading: 0, totalMb: 0 };
    return {
      completed: downloads.filter(d => d.status === 'completed' || d.status === 'complete').length,
      downloading: downloads.filter(d => d.status === 'downloading').length,
      totalMb: downloads.reduce((acc, d) => acc + (d.sizeBytes || 0), 0) / (1024 * 1024)
    };
  }, [downloads]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-10 sticky top-0 pb-2">
        <div className="flex items-center px-3 h-[48px]">
          <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[17px] font-semibold flex-1">Downloads</span>
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stats Pill */}
        <div className="px-4 mt-1 mb-3">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-[12px] font-medium text-muted-foreground gap-2">
            <span className="text-foreground">{stats.completed}</span> completed
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <span className="text-primary">{stats.downloading}</span> active
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <span>{stats.totalMb.toFixed(1)} MB total</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-1 gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                activeFilter === f 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-card border-border/50 text-foreground/70 hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-2 px-2">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl p-3 flex gap-3 h-[72px]">
                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                <div className="flex-1 py-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-[24px] bg-muted flex items-center justify-center shadow-inner">
              <Download className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">No downloads yet</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Files you download will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredDownloads.map(dl => {
              const fileType = getFileType(dl.filename);
              const { icon: Icon, color, bg } = getFileIcon(fileType);
              
              const isComplete = dl.status === 'completed' || dl.status === 'complete';
              const isDownloading = dl.status === 'downloading';
              const isFailed = dl.status === 'failed';
              
              const pct = dl.sizeBytes ? Math.round((dl.downloadedBytes / dl.sizeBytes) * 100) : (isComplete ? 100 : 0);
              
              return (
                <div key={dl.id} className="bg-card hover:bg-muted/30 border border-border/50 rounded-2xl p-3 flex items-center gap-3 transition-colors h-[72px]">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[14px] font-medium text-foreground/90 truncate pr-2">{dl.filename}</span>
                      {isComplete ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 shrink-0 uppercase tracking-wide">Done</span> :
                       isFailed ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0 uppercase tracking-wide">Failed</span> :
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 uppercase tracking-wide animate-pulse">Downloading</span>}
                    </div>
                    
                    {isDownloading ? (
                      <>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-1.5 overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${pct}%` }}>
                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_1s_infinite]" style={{ transform: 'skewX(-20deg)' }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium">
                          <span>{formatBytes(dl.downloadedBytes)} / {formatBytes(dl.sizeBytes)} ({pct}%)</span>
                          <span className="text-primary">2.4 MB/s</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                        <span>{formatBytes(dl.sizeBytes || dl.downloadedBytes)}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                        <span>{dl.createdAt ? new Date(dl.createdAt).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex items-center">
                    {isComplete ? (
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    ) : isDownloading ? (
                      <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/80 text-foreground hover:bg-muted transition-colors">
                        <Pause className="w-4 h-4" fill="currentColor" />
                      </button>
                    ) : (
                      <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/80 text-foreground hover:bg-muted transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Download Sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAddSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-card rounded-t-[32px] border-t border-border shadow-2xl z-50 p-6 pb-safe">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-bold text-foreground">New Download</h3>
                <button onClick={() => setShowAddSheet(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[13px] font-semibold text-foreground/80 ml-1 mb-1.5 block">File URL</label>
                  <input type="url" value={url} onChange={e => { setUrl(e.target.value); if(!filename && e.target.value.includes('/')) setFilename(e.target.value.split('/').pop() || ""); }} placeholder="https://example.com/file.zip" autoFocus className="w-full h-12 bg-muted/50 rounded-2xl px-4 text-[15px] outline-none border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground/80 ml-1 mb-1.5 block">Save as</label>
                  <input type="text" value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.zip" className="w-full h-12 bg-muted/50 rounded-2xl px-4 text-[15px] outline-none border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
                <div className="pt-2">
                  <button onClick={handleStart} disabled={!url || !filename || startDownload.isPending} className="w-full h-[52px] bg-primary text-primary-foreground rounded-2xl font-semibold text-[16px] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    {startDownload.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                    Start Download
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
