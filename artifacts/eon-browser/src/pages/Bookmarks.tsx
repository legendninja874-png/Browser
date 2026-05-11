import { useState } from "react";
import {
  useListBookmarks, useGetRecentBookmarks, useDeleteBookmark,
  getListBookmarksQueryKey, getGetRecentBookmarksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark as BookmarkIcon, Folder, Globe, Trash2, Search, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch { return null; }
}

export default function Bookmarks() {
  const queryClient = useQueryClient();
  const { data: allBookmarks, isLoading } = useListBookmarks();
  const { data: recentBookmarks } = useGetRecentBookmarks();
  const deleteBookmark = useDeleteBookmark();
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    deleteBookmark.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentBookmarksQueryKey() });
      },
    });
  };

  const filtered = allBookmarks?.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.url.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const folders = filtered.reduce((acc, b) => {
    const f = b.folder ?? "Unsorted";
    if (!acc[f]) acc[f] = [];
    acc[f].push(b);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const displayFolders = activeFolder ? { [activeFolder]: folders[activeFolder] ?? [] } : folders;

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left panel */}
      <div className="w-[180px] flex flex-col border-r border-white/8 bg-sidebar shrink-0">
        <div className="flex items-center gap-1.5 px-3 h-9 border-b border-white/8 shrink-0">
          <BookmarkIcon className="w-3.5 h-3.5 text-white/35" />
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Bookmarks</span>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-1.5 h-7 bg-white/6 border border-white/10 rounded px-2">
            <Search className="w-3 h-3 text-white/30 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-[11px] text-white/70 placeholder:text-white/25"
              data-testid="bookmarks-search"
            />
          </div>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto py-1 px-1.5">
          <button
            onClick={() => setActiveFolder(null)}
            className={`flex items-center gap-2 w-full h-7 px-2 rounded text-left transition-colors ${!activeFolder ? "bg-white/10 text-white/70" : "text-white/35 hover:bg-white/6 hover:text-white/55"}`}
          >
            <BookmarkIcon className="w-3 h-3 shrink-0" />
            <span className="text-[11px]">All bookmarks</span>
          </button>
          {Object.keys(folders).map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder === activeFolder ? null : folder)}
              className={`flex items-center gap-2 w-full h-7 px-2 rounded text-left transition-colors ${activeFolder === folder ? "bg-white/10 text-white/70" : "text-white/35 hover:bg-white/6 hover:text-white/55"}`}
            >
              <Folder className="w-3 h-3 shrink-0" />
              <span className="text-[11px] truncate flex-1">{folder}</span>
              <span className="text-[10px] text-white/25">{folders[folder].length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-6">
          {/* Recent */}
          {!search && !activeFolder && recentBookmarks && recentBookmarks.length > 0 && (
            <section>
              <div className="text-[11px] font-medium text-white/30 uppercase tracking-widest mb-2">Recently added</div>
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
                {recentBookmarks.slice(0, 5).map(b => (
                  <BookmarkRow key={b.id} bookmark={b} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {/* Grouped */}
          {isLoading
            ? <div className="space-y-1">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-full bg-white/5" />)}</div>
            : Object.keys(displayFolders).length === 0
              ? <div className="py-10 text-center text-sm text-white/25">No bookmarks found</div>
              : Object.entries(displayFolders).map(([folder, items]) => (
                <section key={folder}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Folder className="w-3 h-3 text-white/25" />
                    <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">{folder}</span>
                    <span className="text-[10px] text-white/20 ml-1">{items.length}</span>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
                    {items.map(b => (
                      <BookmarkRow key={b.id} bookmark={b} onDelete={handleDelete} />
                    ))}
                  </div>
                </section>
              ))
          }
        </div>
      </div>
    </div>
  );
}

function BookmarkRow({ bookmark, onDelete }: { bookmark: any; onDelete: (id: number, e: React.MouseEvent) => void }) {
  const favicon = getFavicon(bookmark.url);
  return (
    <div className="flex items-center gap-3 h-10 px-3 hover:bg-white/4 group transition-colors">
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {favicon
          ? <img src={favicon} alt="" className="w-3.5 h-3.5" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <Globe className="w-3 h-3 text-white/25" />
        }
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[12px] text-white/65 truncate">{bookmark.title || getDomain(bookmark.url)}</span>
        <span className="text-[11px] text-white/25 truncate hidden group-hover:block">{getDomain(bookmark.url)}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={e => onDelete(bookmark.id, e)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/15 text-white/25 hover:text-red-400 transition-colors"
          data-testid={`delete-bookmark-${bookmark.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
