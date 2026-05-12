import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace,
  getListWorkspacesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Check, MoreVertical, X, Settings2, Trash2, LayoutGrid, Briefcase, GraduationCap, Home as HomeIcon, Ghost } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

const COLORS = ["#4A9EFF", "#34C759", "#FBBC04", "#FF3B30", "#AF52DE", "#FF2D55", "#FF9500", "#5856D6"];
const ICONS = [LayoutGrid, Briefcase, GraduationCap, HomeIcon, Ghost, Settings2];

export default function Workspaces() {
  const [, navigate] = useLocation();
  const queryClient  = useQueryClient();
  const { data: workspaces, isLoading } = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName]       = useState("");
  const [newColor, setNewColor]     = useState(COLORS[0]);
  const [newIcon, setNewIcon]       = useState("LayoutGrid");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });

  const activeWorkspace = workspaces?.find(w => w.isActive) || workspaces?.[0];

  const handleOpenCreate = () => {
    setEditingId(null);
    setNewName("");
    setNewColor(COLORS[0]);
    setNewIcon("LayoutGrid");
    setShowSheet(true);
  };

  const handleOpenEdit = (ws: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenu(null);
    setEditingId(ws.id);
    setNewName(ws.name);
    setNewColor(ws.color);
    setNewIcon(ws.icon || "LayoutGrid");
    setShowSheet(true);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    
    if (editingId) {
      updateWorkspace.mutate({ id: editingId, data: { name: newName.trim(), color: newColor, icon: newIcon } }, {
        onSuccess: () => { setShowSheet(false); invalidate(); }
      });
    } else {
      createWorkspace.mutate({ data: { name: newName.trim(), color: newColor, icon: newIcon } }, {
        onSuccess: () => { setShowSheet(false); invalidate(); },
      });
    }
  };

  const handleSetActive = (id: number) => {
    if (activeWorkspace?.id === id) return;
    updateWorkspace.mutate({ id, data: { isActive: true } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    deleteWorkspace.mutate({ id }, { onSuccess: () => { setShowSheet(false); invalidate(); } });
  };

  return (
    <div className="flex flex-col h-full bg-background relative" onClick={() => setActiveMenu(null)}>
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 flex items-center gap-2 px-3 h-[48px] sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[17px] font-semibold flex-1">Workspaces</span>
        <button
          onClick={handleOpenCreate}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
        {/* Active Workspace Banner */}
        {isLoading ? (
          <Skeleton className="h-[140px] w-full rounded-[24px]" />
        ) : activeWorkspace ? (
          <div className="bg-card border border-border/50 rounded-[24px] p-6 relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: activeWorkspace.color }} />
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeWorkspace.color }} />
                  Current Session
                </div>
                <h2 className="text-[28px] font-bold leading-tight mb-1 text-foreground">{activeWorkspace.name}</h2>
                <p className="text-[14px] text-muted-foreground">{activeWorkspace.tabCount || 0} tabs open</p>
              </div>
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${activeWorkspace.color}15` }}>
                <LayoutGrid className="w-7 h-7" style={{ color: activeWorkspace.color }} />
              </div>
            </div>
            <button onClick={() => handleOpenEdit(activeWorkspace)} className="mt-5 w-full bg-muted/50 hover:bg-muted border border-border/50 py-2.5 rounded-xl text-[14px] font-semibold transition-colors">
              Edit Workspace
            </button>
          </div>
        ) : null}

        {/* Grid */}
        <div>
          <h3 className="text-[15px] font-bold px-1 mb-3 text-foreground/90">All Workspaces</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-[20px]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {workspaces?.map(ws => {
                const isAct = ws.isActive;
                return (
                  <div 
                    key={ws.id} 
                    onClick={() => handleSetActive(ws.id)}
                    className={`relative bg-card border rounded-[20px] p-4 cursor-pointer transition-all active:scale-[0.98] ${
                      isAct ? "border-transparent ring-2 ring-primary/50 shadow-md bg-primary/5" : "border-border/50 hover:border-foreground/20"
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[20px]" style={{ backgroundColor: ws.color }} />
                    
                    <div className="flex justify-between items-start mt-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${ws.color}15`, color: ws.color }}>
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === ws.id ? null : ws.id); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors -mr-2 -mt-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold truncate text-foreground">{ws.name}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">{ws.tabCount || 0} tabs</div>
                    </div>

                    {isAct && (
                      <div className="absolute bottom-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Context Menu */}
                    {activeMenu === ws.id && (
                      <div className="absolute right-4 top-12 z-20 w-40 bg-card border border-border rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95">
                        <button onClick={(e) => handleOpenEdit(ws, e)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-[13px] text-foreground text-left">
                          <Settings2 className="w-4 h-4" /> Edit
                        </button>
                        {!isAct && (
                          <>
                            <div className="h-px bg-border/50 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 text-[13px] text-destructive text-left">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-card rounded-t-[32px] border-t border-border shadow-2xl z-50 p-6 pb-safe">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-bold">{editingId ? "Edit Workspace" : "New Workspace"}</h3>
                <button onClick={() => setShowSheet(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-semibold text-foreground/80 ml-1 mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="E.g., Work, Personal, Shopping"
                    autoFocus
                    className="w-full h-12 bg-muted/50 rounded-2xl px-4 text-[15px] outline-none border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-foreground/80 ml-1 mb-2 block">Color Theme</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${newColor === c ? "scale-110 shadow-lg" : "hover:scale-105 opacity-80"}`}
                        style={{ backgroundColor: c, boxShadow: newColor === c ? `0 4px 14px ${c}60` : 'none' }}
                      >
                        {newColor === c && <Check className="w-5 h-5 text-white/90" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-foreground/80 ml-1 mb-2 block">Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICONS.map((Icon, i) => (
                      <button
                        key={i}
                        onClick={() => setNewIcon(Icon.name)}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all ${newIcon === Icon.name ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button onClick={handleSave} disabled={!newName.trim() || createWorkspace.isPending || updateWorkspace.isPending} className="w-full h-[52px] bg-foreground text-background rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-transform disabled:opacity-50">
                    {editingId ? "Save Changes" : "Create Workspace"}
                  </button>
                  
                  {editingId && !activeWorkspace?.id === editingId && (
                    <button onClick={() => handleDelete(editingId)} className="w-full h-[52px] bg-destructive/10 text-destructive rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-transform">
                      Delete Workspace
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
