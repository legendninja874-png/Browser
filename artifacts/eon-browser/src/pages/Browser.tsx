import { useState } from "react";
import { 
  useListTabs, useCreateTab, useUpdateTab, useCloseTab,
  getListTabsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X, 
  Moon, Pin, MoreVertical, Search, Globe, Shield
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Browser() {
  const queryClient = useQueryClient();
  const { data: tabs, isLoading } = useListTabs();
  const createTab = useCreateTab();
  const updateTab = useUpdateTab();
  const closeTab = useCloseTab();

  const [urlInput, setUrlInput] = useState("");

  const activeTab = tabs?.find(t => t.isActive);

  const handleNewTab = () => {
    createTab.mutate(
      { data: { url: "about:newtab", title: "New Tab" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        }
      }
    );
  };

  const handleCloseTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        }
      }
    );
  };

  const handleActivateTab = (id: number) => {
    if (activeTab?.id === id) return;
    updateTab.mutate(
      { id, data: { isActive: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        }
      }
    );
  };

  const handleToggleSleep = (id: number, isSleeping: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTab.mutate(
      { id, data: { isSleeping: !isSleeping } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="flex h-full w-full bg-background">
      {/* Vertical Tabs Sidebar */}
      <div className="w-64 flex flex-col border-r border-white/10 bg-card/40 backdrop-blur-xl shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tabs</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20" onClick={handleNewTab} data-testid="btn-new-tab">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-1">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md bg-white/5" />)
            ) : tabs?.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">No open tabs</div>
            ) : (
              tabs?.map((tab) => (
                <div 
                  key={tab.id}
                  onClick={() => handleActivateTab(tab.id)}
                  className={`
                    group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all
                    ${tab.isActive ? 'bg-primary/20 border border-primary/30 neon-box' : 'hover:bg-white/5 border border-transparent'}
                    ${tab.isSleeping ? 'opacity-50' : 'opacity-100'}
                  `}
                  data-testid={`tab-${tab.id}`}
                >
                  <div className="w-5 h-5 rounded bg-black/40 flex items-center justify-center shrink-0">
                    {tab.favicon ? (
                      <img src={tab.favicon} alt="" className="w-3 h-3" />
                    ) : (
                      <Globe className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className={`text-sm truncate ${tab.isActive ? 'text-primary font-medium' : 'text-gray-300'}`}>
                      {tab.title || tab.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-white"
                      onClick={(e) => handleToggleSleep(tab.id, tab.isSleeping, e)}
                      title={tab.isSleeping ? "Wake tab" : "Sleep tab"}
                    >
                      <Moon className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Browser View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation/URL Bar */}
        <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center gap-2 px-4 shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><ArrowLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" disabled><ArrowRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><RotateCw className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><Home className="w-4 h-4" /></Button>
          </div>

          <div className="flex-1 flex items-center max-w-3xl mx-auto">
            <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <Shield className="w-4 h-4 text-green-500 mr-2 shrink-0" />
              <div className="text-muted-foreground mr-1 text-sm">https://</div>
              <input 
                type="text" 
                value={activeTab?.url === 'about:newtab' ? '' : (urlInput || activeTab?.url?.replace('https://', '') || '')}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Search or enter address"
                className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-0 font-mono"
                data-testid="browser-url-input"
              />
              <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {activeTab ? (
            activeTab.url === 'about:newtab' ? (
              <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
                 <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-box mb-8">
                    <span className="text-4xl font-bold text-black">E</span>
                  </div>
                  <h2 className="text-3xl font-light text-white">EoN Browser</h2>
                  <p className="text-muted-foreground">Ready to explore the cyber-verse.</p>
                 </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center flex-col gap-4 text-gray-400">
                <Globe className="w-16 h-16 opacity-20" />
                <p>Simulated webview for {activeTab.url}</p>
                <p className="text-sm">(In a real app, this would be an iframe or WebContents)</p>
              </div>
            )
          ) : (
             <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
                 <p className="text-muted-foreground">Open a tab to get started</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
