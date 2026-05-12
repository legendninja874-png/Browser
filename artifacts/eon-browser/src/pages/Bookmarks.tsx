import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListBookmarks, useGetRecentBookmarks, useDeleteBookmark,
  getListBookmarksQueryKey, getGetRecentBookmarksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search, Globe, Trash2, ExternalLink, ChevronRight, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return null; }
}

export default function Bookmarks() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: allBookmarks, isLoading } = useListBookmarks();
  const { data: recentBookmarks } = useGetRecentBookmarks();
  const deleteBookmark = useDeleteBookmark();
  const [search, setSearch] = useState("");

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    deleteBookmark.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentBookmarksQueryKey() });
      },
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold">Bookmarks</span>
        </div>
        <div className="flex items-center gap-2 h-9 mx-4 mb-3 px-3 bg-muted rounded-xl">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bookmarks"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="bookmarks-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {/* Recently added */}
        {!search && recentBookmarks && recentBookmarks.length > 0 && (
          <section>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Recently added</div>
            <div className="browser-card divide-y divide-border overflow-hidden">
              {recentBookmarks.slice(0, 5).map(b => (
                <BookmarkRow key={b.id} bookmark={b} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )}

        {/* All bookmarks by folder */}
        {isLoading ? (
          <div className="browser-card divide-y divide-border overflow-hidden">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(folders).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Bookmark className="w-10 h-10 text-muted-foreground/30" />
            <div className="text-sm text-muted-foreground">No bookmarks found</div>
          </div>
        ) : (
          Object.entries(folders).map(([folder, items]) => (
            <section key={folder}>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {folder} <span className="normal-case text-muted-foreground/60">({items.length})</span>
              </div>
              <div className="browser-card divide-y divide-border overflow-hidden">
                {items.map(b => <BookmarkRow key={b.id} bookmark={b} onDelete={handleDelete} />)}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function BookmarkRow({ bookmark, onDelete }: { bookmark: any; onDelete: (id: number, e: React.MouseEvent) => void }) {
  const fav = bookmark.favicon ?? getFavicon(bookmark.url);
  return (
    <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {fav
          ? <img src={fav} alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <Globe className="w-4.5 h-4.5 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground/85 truncate">{bookmark.title || getDomain(bookmark.url)}</div>
        <div className="text-xs text-muted-foreground truncate">{getDomain(bookmark.url)}</div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a href={bookmark.url} target="_blank" rel="noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={e => onDelete(bookmark.id, e)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/15 transition-colors text-muted-foreground hover:text-destructive"
          data-testid={`delete-bookmark-${bookmark.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 group-hover:opacity-0 transition-opacity" />
    </div>
  );
}
