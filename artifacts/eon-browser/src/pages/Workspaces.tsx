import { useListWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace, getListWorkspacesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutGrid, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workspaces() {
  const queryClient = useQueryClient();
  const { data: workspaces, isLoading } = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#00ffcc"); // default cyan

  const handleCreate = () => {
    if (!newName) return;
    createWorkspace.mutate(
      { data: { name: newName, color: newColor, icon: "LayoutGrid" } },
      {
        onSuccess: () => {
          setIsCreating(false);
          setNewName("");
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        }
      }
    );
  };

  const handleSetActive = (id: number) => {
    updateWorkspace.mutate(
      { id, data: { isActive: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteWorkspace.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <LayoutGrid className="text-primary w-8 h-8" />
            Workspaces
          </h1>
          <p className="text-muted-foreground">Manage your contexts and tab groups.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-primary/20 text-primary hover:bg-primary hover:text-black border border-primary/50 neon-box">
          <Plus className="w-4 h-4 mr-2" /> New Workspace
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8 border-primary/50 bg-card/60 backdrop-blur-md">
          <CardContent className="pt-6 flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Workspace Name</label>
              <Input 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                placeholder="e.g. Work, Personal, Research"
                className="bg-black/50 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2">
                {["#00ffcc", "#ff00ff", "#0088ff", "#ff0055", "#00ff00", "#ffaa00"].map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c, boxShadow: newColor === c ? `0 0 10px ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-primary text-black hover:bg-primary/80">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />)
        ) : workspaces?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
            No workspaces found. Create one to get started.
          </div>
        ) : (
          workspaces?.map((workspace) => (
            <Card 
              key={workspace.id} 
              className={`relative overflow-hidden transition-all duration-300 glass-panel cursor-pointer group
                ${workspace.isActive ? 'border-primary/50' : 'border-white/10 hover:border-white/30'}
              `}
              onClick={() => handleSetActive(workspace.id)}
              style={workspace.isActive ? { boxShadow: `0 0 20px ${workspace.color}20, inset 0 0 10px ${workspace.color}10` } : {}}
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: workspace.color }} />
              
              <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/10" style={{ color: workspace.color }}>
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{workspace.name}</h3>
                      <p className="text-sm text-muted-foreground">{workspace.tabCount} tabs</p>
                    </div>
                  </div>
                  {workspace.isActive && (
                    <CheckCircle2 className="w-5 h-5" style={{ color: workspace.color }} />
                  )}
                </div>

                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={(e) => { e.stopPropagation(); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20" onClick={(e) => { e.stopPropagation(); handleDelete(workspace.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
