import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListBookmarks, useGetRecentBookmarks, useDeleteBookmark, useCreateBookmark,
  getListBookmarksQueryKey, getGetRecentBookmarksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search, Globe, Trash2, ExternalLink, MoreVertical, Bookmark, Plus, X, Folder, Navigation, Edit2, Share2, CornerUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; }
  catch { return null; }
}

export default function Bookmarks() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: allBookmarks, isLoading } = useListBookmarks();
  const { data: recentBookmarks } = useGetRecentBookmarks();
  const deleteBookmark = useDeleteBookmark();
  const createBookmark = useCreateBookmark();
  
  const [search, setSearch] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addFolder, setAddFolder] = useState("");
  const [activeContextMenu, setActiveContextMenu] = useState<number | null>(null);

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    deleteBookmark.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentBookmarksQueryKey() });
        setActiveContextMenu(null);
      },
    });
  };

  const handleAdd = () => {
    if (!addUrl) return;
    createBookmark.mutate({ data: { url: addUrl, title: addTitle || getDomain(addUrl), folder: addFolder || "Unsorted" } }, {
      onSuccess: () => {
        setShowAddSheet(false);
        setAddUrl(""); setAddTitle(""); setAddFolder("");
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentBookmarksQueryKey() });
      }
    });
  };

  const filtered = (allBookmarks ?? []).filter(b =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.url.toLowerCase().includes(search.toLowerCase())
  );

  const folders = filtered.reduce((acc, b) => {
    const f = b.folder ?? "Unsorted";
    if (!acc[f]) acc[f] = [];
    acc[f].push(b);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden" onClick={() => setActiveContextMenu(null)}>
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-10 sticky top-0">
        <div className="flex items-center gap-2 px-3 h-[48px]">
          <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[17px] font-semibold flex-1">Bookmarks</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 h-[36px] px-3.5 bg-muted/60 rounded-full border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
              data-testid="bookmarks-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="w-5 h-5 flex items-center justify-center rounded-full bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/30">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Recently added */}
        {!search && recentBookmarks && recentBookmarks.length > 0 && (
          <div className="py-4">
            <div className="px-4 text-[13px] font-medium text-foreground/70 mb-3">Recently saved</div>
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
              {recentBookmarks.slice(0, 6).map(b => {
                const fav = b.favicon ?? getFavicon(b.url);
                return (
                  <a key={b.id} href={b.url} className="snap-start shrink-0 w-[88px] flex flex-col items-center gap-2 group">
                    <div className="w-[60px] h-[60px] rounded-[18px] bg-card border border-border/40 shadow-sm flex items-center justify-center group-hover:bg-muted/50 transition-all">
                      {fav ? (
                        <img src={fav} alt="" className="w-7 h-7 rounded shadow-sm" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Globe className="w-7 h-7 text-muted-foreground/50" />
                      )}
                    </div>
                    <span className="text-[11px] text-foreground/70 text-center w-full truncate px-1">{getDomain(b.url)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Folders */}
        {!search && Object.keys(folders).length > 0 && (
          <div className="px-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(folders).slice(0, 4).map(([folder, items]) => (
                <div key={folder} className="bg-card border border-border/50 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5 text-primary" fill="currentColor" fillOpacity={0.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-foreground truncate">{folder}</div>
                    <div className="text-[12px] text-muted-foreground">{items.length} items</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Bookmarks */}
        <div className="px-2 py-2">
          {isLoading ? (
            <div className="px-2 flex flex-col gap-1">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Bookmark className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="text-[14px] text-muted-foreground">No bookmarks found</div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filtered.map(b => (
                <div key={b.id} className="relative group rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 p-2 h-[48px]">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {b.favicon || getFavicon(b.url) ? (
                        <img src={b.favicon || getFavicon(b.url)!} alt="" className="w-4 h-4" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-[14px] text-foreground/90 truncate leading-tight">{b.title || getDomain(b.url)}</div>
                      <div className="text-[12px] text-primary/80 truncate leading-tight">{getDomain(b.url)}</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveContextMenu(activeContextMenu === b.id ? null : b.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Context Menu Dropdown */}
                  {activeContextMenu === b.id && (
                    <div className="absolute right-4 top-10 z-50 w-56 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <a href={b.url} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[14px] text-foreground">
                        <CornerUpRight className="w-4 h-4 text-muted-foreground" /> Open
                      </a>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[14px] text-foreground text-left">
                        <Navigation className="w-4 h-4 text-muted-foreground" /> Open in new tab
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[14px] text-foreground text-left">
                        <Share2 className="w-4 h-4 text-muted-foreground" /> Share
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-[14px] text-foreground text-left">
                        <Edit2 className="w-4 h-4 text-muted-foreground" /> Edit
                      </button>
                      <div className="h-px bg-border/50 my-1" />
                      <button onClick={(e) => handleDelete(b.id, e)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 text-[14px] text-destructive text-left">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button 
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-[72px] right-4 w-[52px] h-[52px] bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAddSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border shadow-2xl z-50 p-5 pb-safe">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[18px] font-semibold">New Bookmark</h3>
                <button onClick={() => setShowAddSheet(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground ml-1 mb-1 block">URL</label>
                  <input type="url" value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://example.com" autoFocus className="w-full h-12 bg-muted/50 rounded-xl px-4 text-[15px] outline-none focus:ring-1 focus:ring-primary/30 transition-all border border-border/50 focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground ml-1 mb-1 block">Title (optional)</label>
                  <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Website Name" className="w-full h-12 bg-muted/50 rounded-xl px-4 text-[15px] outline-none focus:ring-1 focus:ring-primary/30 transition-all border border-border/50 focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground ml-1 mb-1 block">Folder</label>
                  <input type="text" value={addFolder} onChange={e => setAddFolder(e.target.value)} placeholder="Unsorted" className="w-full h-12 bg-muted/50 rounded-xl px-4 text-[15px] outline-none focus:ring-1 focus:ring-primary/30 transition-all border border-border/50 focus:border-primary/50" />
                </div>
                <button onClick={handleAdd} disabled={!addUrl || createBookmark.isPending} className="w-full h-[52px] bg-primary text-primary-foreground rounded-xl font-medium text-[15px] mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  <Bookmark className="w-4 h-4" /> Save Bookmark
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
