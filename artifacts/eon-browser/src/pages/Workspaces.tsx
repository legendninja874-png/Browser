import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace,
  getListWorkspacesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Check, Trash2, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b"];

export default function Workspaces() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: workspaces, isLoading } = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newColor, setNewColor]     = useState(COLORS[0]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWorkspace.mutate({ data: { name: newName.trim(), color: newColor, icon: "LayoutGrid" } }, {
      onSuccess: () => { setIsCreating(false); setNewName(""); invalidate(); },
    });
  };

  const handleSetActive = (id: number) =>
    updateWorkspace.mutate({ id, data: { isActive: true } }, { onSuccess: invalidate });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkspace.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 bg-card border-b border-border flex items-center gap-3 px-4 h-12">
        <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold flex-1">Workspaces</span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          data-testid="btn-new-workspace"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {isCreating && (
          <div className="browser-card p-4 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Workspace name"
              autoFocus
              className="h-10 bg-muted rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              data-testid="input-workspace-name"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Color</span>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-offset-2 ring-offset-background ring-white/40" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCreating(false)} className="flex-1 h-10 rounded-xl bg-muted text-sm text-foreground/70 hover:bg-muted/80 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">Create</button>
            </div>
          </div>
        )}

        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : workspaces?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <LayoutGrid className="w-10 h-10 text-muted-foreground/30" />
            <div className="text-sm text-muted-foreground">No workspaces yet</div>
          </div>
        ) : (
          <div className="browser-card divide-y divide-border overflow-hidden">
            {workspaces?.map(ws => (
              <div
                key={ws.id}
                onClick={() => handleSetActive(ws.id)}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors group"
                data-testid={`workspace-${ws.id}`}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ws.color}22` }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ws.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/85">{ws.name}</span>
                    {ws.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ws.tabCount} tabs</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {ws.isActive && <Check className="w-4 h-4 text-primary" />}
                  <button
                    onClick={e => handleDelete(ws.id, e)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                    data-testid={`delete-workspace-${ws.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
