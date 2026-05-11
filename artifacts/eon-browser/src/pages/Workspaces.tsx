import { useState } from "react";
import {
  useListWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace,
  getListWorkspacesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutGrid, Trash2, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PRESET_COLORS = ["#00d4ff", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

export default function Workspaces() {
  const queryClient = useQueryClient();
  const { data: workspaces, isLoading } = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newColor, setNewColor]     = useState(PRESET_COLORS[0]);

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
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white/75">Workspaces</div>
            <div className="text-[11px] text-white/30 mt-0.5">Organize tabs by context</div>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/8 transition-colors"
            data-testid="btn-new-workspace"
          >
            <Plus className="w-3.5 h-3.5" />
            New workspace
          </button>
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="rounded-lg border border-white/10 bg-white/4 p-4 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Workspace name"
              autoFocus
              className="h-8 bg-white/6 border border-white/10 rounded px-2.5 text-sm text-white/75 placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
              data-testid="input-workspace-name"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/35">Color</span>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-white/40 ring-offset-1 ring-offset-background" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="h-7 px-3 rounded text-[12px] text-white/35 hover:text-white/55 hover:bg-white/6 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createWorkspace.isPending}
                className="h-7 px-3 rounded text-[12px] bg-primary/80 hover:bg-primary text-black font-medium transition-colors disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Workspace list */}
        {isLoading
          ? <div className="space-y-1">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full bg-white/5" />)}</div>
          : workspaces?.length === 0
            ? <div className="py-10 text-center text-sm text-white/25">No workspaces yet</div>
            : (
              <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
                {workspaces?.map(ws => (
                  <div
                    key={ws.id}
                    onClick={() => handleSetActive(ws.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer group transition-colors hover:bg-white/4
                      ${ws.isActive ? "bg-white/5" : ""}
                    `}
                    data-testid={`workspace-${ws.id}`}
                  >
                    {/* Color bar */}
                    <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: ws.color }} />

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 shrink-0" style={{ borderColor: `${ws.color}30` }}>
                      <LayoutGrid className="w-3.5 h-3.5" style={{ color: ws.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${ws.isActive ? "text-white/85" : "text-white/55"}`}>{ws.name}</span>
                        {ws.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-[10px]" style={{ color: ws.color, borderColor: `${ws.color}40`, backgroundColor: `${ws.color}12` }}>
                            active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/25 mt-0.5">{ws.tabCount} tabs</div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {ws.isActive && <Check className="w-3.5 h-3.5" style={{ color: ws.color }} />}
                      <button
                        onClick={e => handleDelete(ws.id, e)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-colors"
                        data-testid={`delete-workspace-${ws.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </div>
  );
}
