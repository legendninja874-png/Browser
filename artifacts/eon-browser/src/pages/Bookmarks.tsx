import { useListBookmarks, useGetRecentBookmarks, useDeleteBookmark, getListBookmarksQueryKey, getGetRecentBookmarksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark as BookmarkIcon, Folder, Globe, Trash2, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Bookmarks() {
  const queryClient = useQueryClient();
  const { data: allBookmarks, isLoading } = useListBookmarks();
  const { data: recentBookmarks } = useGetRecentBookmarks();
  const deleteBookmark = useDeleteBookmark();

  const [search, setSearch] = useState("");

  const handleDelete = (id: number) => {
    deleteBookmark.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentBookmarksQueryKey() });
        }
      }
    );
  };

  const filteredBookmarks = allBookmarks?.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.url.toLowerCase().includes(search.toLowerCase()));

  // Group by folder
  const folders = filteredBookmarks?.reduce((acc, curr) => {
    const folder = curr.folder || "Unsorted";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(curr);
    return acc;
  }, {} as Record<string, typeof allBookmarks>) || {};

  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 bg-card/40 backdrop-blur-xl p-4 flex flex-col gap-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <BookmarkIcon className="text-primary w-5 h-5" />
            Bookmarks
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-black/50 border-white/10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</div>
          {Object.keys(folders).map(folder => (
            <div key={folder} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer text-gray-300 hover:text-white transition-colors">
              <Folder className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">{folder}</span>
              <span className="ml-auto text-xs text-muted-foreground bg-black/50 px-2 py-0.5 rounded-full">{folders[folder].length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {!search && recentBookmarks && recentBookmarks.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" /> Recently Added
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentBookmarks.map(bookmark => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-white mb-4">All Bookmarks</h3>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)}
             </div>
          ) : Object.keys(folders).length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
              No bookmarks found.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(folders).map(([folder, items]) => (
                <div key={folder}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-white/10 pb-2">{folder}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(bookmark => (
                      <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark, onDelete }: { bookmark: any, onDelete: (id: number) => void }) {
  return (
    <Card className="glass-panel border-white/10 hover:border-primary/30 transition-all group overflow-hidden">
      <CardContent className="p-4 flex gap-3 items-start relative">
        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center flex-shrink-0 border border-white/5 mt-1">
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-5 h-5" />
          ) : (
            <Globe className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-white truncate group-hover:text-primary transition-colors">{bookmark.title || bookmark.url}</h5>
          <p className="text-xs text-muted-foreground truncate mt-1">{bookmark.url}</p>
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded-md border border-white/10 p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" asChild>
            <a href={bookmark.url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20" onClick={() => onDelete(bookmark.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Clock } from "lucide-react";