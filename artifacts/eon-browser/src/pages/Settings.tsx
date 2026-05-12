import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Search, Check,
  Palette, Shield, Zap, RefreshCw, Monitor,
  Globe, Bell, Download, Type, Moon, UserCircle, AlertTriangle,
  Smartphone, Package
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme, Theme } from "@/contexts/theme";
import { useBrowserStore } from "@/store/browser";
import { AnimatePresence, motion } from "framer-motion";

const THEMES: { id: Theme; label: string; description: string; preview: string }[] = [
  { id: "dark",   label: "Dark",         description: "Classic dark interface",        preview: "bg-[#111111]" },
  { id: "amoled", label: "AMOLED Black", description: "Pure black for OLED displays",  preview: "bg-[#000000]" },
  { id: "gray",   label: "Gray",         description: "Softer dark gray surface",      preview: "bg-[#1f1f1f]" },
  { id: "light",  label: "Light",        description: "Clean white interface",         preview: "bg-[#f5f5f5]" },
  { id: "blue",   label: "Blue",         description: "Deep blue accent theme",        preview: "bg-[#0a0f1a]" },
];

type Section = "main" | "appearance" | "privacy" | "performance" | "sync" | "search" | "downloads";

export default function Settings() {
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const store = useBrowserStore();
  
  const [section, setSection] = useState<Section>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const onInstallable = () => setInstallPrompt((window as any).__eonInstallPrompt ?? null);
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener('eon-pwa-installable', onInstallable);
    window.addEventListener('eon-pwa-installed', onInstalled);
    if ((window as any).__eonInstallPrompt) setInstallPrompt((window as any).__eonInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => {
      window.removeEventListener('eon-pwa-installable', onInstallable);
      window.removeEventListener('eon-pwa-installed', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    const result = await (installPrompt as any).userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
  };

  // Local state for UI only (not in store)
  const [httpsOnly, setHttpsOnly]     = useState(true);
  const [autoSync, setAutoSync]       = useState(true);
  const [animations, setAnimations]   = useState(true);

  if (section !== "main") {
    return (
      <SectionView
        title={sectionLabel(section)}
        onBack={() => setSection("main")}
        theme={theme}
        setTheme={(t: Theme) => { setTheme(t); store.setTheme(t); }}
        section={section}
        store={store}
        httpsOnly={httpsOnly} setHttpsOnly={setHttpsOnly}
        autoSync={autoSync} setAutoSync={setAutoSync}
        animations={animations} setAnimations={setAnimations}
      />
    );
  }

  const SETTINGS_GROUPS = [
    {
      label: "Basics",
      items: [
        { icon: Search,  label: "Search engine",   sub: store.searchEngine, onTap: () => setSection("search"), color: "text-blue-500" },
        { icon: Globe,   label: "Address bar",      sub: store.addressBarPosition, onTap: () => {}, color: "text-indigo-500" },
        { icon: Shield,  label: "Privacy & security", sub: store.adBlockEnabled ? "Ad blocking on" : "Ad blocking off", onTap: () => setSection("privacy"), color: "text-green-500" },
      ],
    },
    {
      label: "Appearance",
      items: [
        { icon: Palette, label: "Theme",           sub: THEMES.find(t => t.id === theme)?.label ?? "Dark", onTap: () => setSection("appearance"), color: "text-purple-500" },
        { icon: Type,    label: "Font size",        sub: "Medium", onTap: () => {}, color: "text-pink-500" },
        { icon: Moon,    label: "Animations",       sub: animations ? "Smooth" : "Off", onTap: () => setSection("appearance"), color: "text-yellow-500" },
      ],
    },
    {
      label: "Features",
      items: [
        { icon: Download,   label: "Downloads",      sub: "Auto organize", onTap: () => setSection("downloads"), color: "text-cyan-500" },
        { icon: Zap,        label: "Performance mode", sub: store.tabSleep ? "On" : "Off", onTap: () => setSection("performance"), color: "text-orange-500" },
        { icon: RefreshCw,  label: "Sync",            sub: autoSync ? "Active" : "Paused", onTap: () => setSection("sync"), color: "text-teal-500" },
      ],
    },
    {
      label: "Advanced",
      items: [
        { icon: Monitor, label: "About EoN Browser", sub: "Version 1.0.0", onTap: () => {}, color: "text-muted-foreground" },
      ],
    },
  ];

  const filtered = searchQuery
    ? SETTINGS_GROUPS.map(g => ({
        ...g,
        items: g.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())),
      })).filter(g => g.items.length > 0)
    : SETTINGS_GROUPS;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="shrink-0 bg-background/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10 pb-2">
        <div className="flex items-center gap-2 px-3 h-[48px]">
          <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[17px] font-bold text-foreground flex-1">Settings</span>
        </div>
        
        {/* Search */}
        <div className="px-4 mt-1">
          <div className="flex items-center gap-2 h-[40px] px-3.5 bg-card border border-border/80 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="flex-1 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground placeholder:font-normal"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-10 flex flex-col gap-6">
        {/* Profile Card */}
        {!searchQuery && (
          <div className="bg-card border border-border/60 rounded-[24px] p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-[24px] font-bold shadow-md shadow-primary/20">
              E
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold text-foreground">EoN User</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[13px] text-muted-foreground font-medium">Sync is active</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Install App Card */}
        {!searchQuery && (installPrompt || isInstalled) && (
          <div className={`rounded-[20px] p-4 flex items-center gap-4 border shadow-sm ${isInstalled ? 'bg-green-950/30 border-green-500/30' : 'bg-primary/10 border-primary/30'}`}>
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${isInstalled ? 'bg-green-500/20' : 'bg-primary/20'}`}>
              {isInstalled ? <Check className="w-6 h-6 text-green-400" /> : <Smartphone className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-foreground">{isInstalled ? 'App Installed' : 'Install EoN Browser'}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {isInstalled ? 'EoN is on your home screen' : 'Add to home screen for the full app experience'}
              </div>
            </div>
            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="px-4 py-2 rounded-full bg-primary text-white text-[13px] font-bold shrink-0 active:scale-95 transition-transform"
              >
                Install
              </button>
            )}
          </div>
        )}

        {/* Groups */}
        {filtered.map(group => (
          <section key={group.label}>
            <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">{group.label}</div>
            <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
              {group.items.map((item, idx) => (
                <div key={item.label}>
                  <button
                    onClick={item.onTap}
                    className="flex items-center gap-4 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left active:bg-muted"
                  >
                    <div className="w-9 h-9 rounded-[10px] bg-muted/80 flex items-center justify-center shrink-0">
                      <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-foreground/90">{item.label}</div>
                      {item.sub && <div className="text-[13px] text-muted-foreground mt-0.5 capitalize">{item.sub}</div>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                  </button>
                  {idx < group.items.length - 1 && <div className="h-px bg-border/50 ml-[68px]" />}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function sectionLabel(s: Section): string {
  const map: Record<Section, string> = {
    main: "Settings", appearance: "Appearance", privacy: "Privacy & Security",
    performance: "Performance", sync: "Sync", search: "Search Engine", downloads: "Downloads",
  };
  return map[s];
}

function SectionView({
  title, onBack, section, theme, setTheme, store,
  httpsOnly, setHttpsOnly, autoSync, setAutoSync, animations, setAnimations,
}: any) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="shrink-0 flex items-center gap-2 px-3 h-[56px] bg-background/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:bg-muted/60 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-[18px] font-bold text-foreground">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
        {section === "appearance" && (
          <>
            <section>
              <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Choose Theme</div>
              <div className="flex flex-col gap-3">
                {THEMES.map(t => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-[20px] transition-all active:scale-[0.98] ${
                        isActive ? "bg-card border-2 border-primary shadow-md" : "bg-card border border-border/50 hover:border-foreground/20 shadow-sm"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full ${t.preview} border-2 border-border/60 shrink-0 shadow-inner flex items-center justify-center`}>
                        {isActive && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-[16px] font-bold ${isActive ? "text-primary" : "text-foreground"}`}>{t.label}</div>
                        <div className="text-[13px] text-muted-foreground mt-0.5">{t.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Interface</div>
              <div className="bg-card border border-border/50 rounded-[20px] overflow-hidden shadow-sm">
                <ToggleRow label="Subtle animations" sub="Micro-interactions and smooth transitions" value={animations} onChange={setAnimations} />
                <div className="h-px bg-border/50 ml-4" />
                <div className="px-4 py-4">
                  <div className="text-[15px] font-semibold text-foreground/90 mb-1">Font size</div>
                  <div className="text-[13px] text-muted-foreground mb-3">Adjust the size of text on web pages</div>
                  <Select defaultValue="medium">
                    <SelectTrigger className="w-full bg-muted/50 border-0 h-12 rounded-xl text-[15px] font-medium px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-lg">
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium (Recommended)</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xlarge">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </>
        )}

        {section === "privacy" && (
          <>
            <section>
              <div className="bg-card border border-border/50 rounded-[20px] overflow-hidden shadow-sm">
                <ToggleRow label="Ad & tracker blocker" sub="Block intrusive ads and scripts" value={store.adBlockEnabled} onChange={store.setAdBlockEnabled} />
                <div className="h-px bg-border/50 ml-4" />
                <ToggleRow label="HTTPS-only mode" sub="Always use secure connections" value={httpsOnly} onChange={setHttpsOnly} />
                <div className="h-px bg-border/50 ml-4" />
                <ToggleRow label="Safe browsing" sub="Protect against malicious sites" value={true} onChange={() => {}} />
              </div>
            </section>
            
            <section>
              <div className="bg-card border border-border/50 rounded-[20px] overflow-hidden shadow-sm">
                <button onClick={() => setShowClearDialog(true)} className="flex flex-col items-start w-full px-4 py-4 hover:bg-destructive/5 transition-colors text-left active:bg-destructive/10 group">
                  <div className="text-[15px] font-semibold text-destructive">Clear browsing data</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5 group-hover:text-destructive/70 transition-colors">History, cookies, cache, and more</div>
                </button>
              </div>
            </section>

            <AnimatePresence>
              {showClearDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearDialog(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-card w-full max-w-sm rounded-[24px] border border-border shadow-2xl p-6">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5 text-destructive">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h3 className="text-[20px] font-bold mb-2">Clear data?</h3>
                    <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
                      This will permanently delete all browsing history, cookies, and cached files from your device.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowClearDialog(false)} className="flex-1 h-12 rounded-xl bg-muted font-bold text-[15px] hover:bg-muted/80 transition-colors">Cancel</button>
                      <button onClick={() => setShowClearDialog(false)} className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground font-bold text-[15px] hover:bg-destructive/90 transition-colors">Clear Data</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}

        {section === "performance" && (
          <section>
            <div className="bg-card border border-border/50 rounded-[20px] overflow-hidden shadow-sm">
              <ToggleRow label="Tab sleeping" sub="Automatically pause inactive tabs to save memory" value={store.tabSleep || true} onChange={(v) => { /* need to add to store if missing */ }} />
              <div className="h-px bg-border/50 ml-4" />
              <div className="px-4 py-4">
                <div className="text-[15px] font-semibold text-foreground/90 mb-3">Sleep timer</div>
                <Select defaultValue="30m">
                  <SelectTrigger className="w-full bg-muted/50 border-0 h-12 rounded-xl text-[15px] font-medium px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-lg">
                    <SelectItem value="5m">After 5 minutes</SelectItem>
                    <SelectItem value="15m">After 15 minutes</SelectItem>
                    <SelectItem value="30m">After 30 minutes (Default)</SelectItem>
                    <SelectItem value="1h">After 1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        {section === "search" && (
          <section>
            <div className="bg-card border border-border/50 rounded-[20px] overflow-hidden shadow-sm">
              {["Google", "Bing", "DuckDuckGo", "Brave", "Ecosia"].map((engine, idx, arr) => (
                <div key={engine}>
                  <button 
                    onClick={() => store.setSearchEngine(engine.toLowerCase() as any)}
                    className="flex items-center justify-between w-full px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-[15px] font-semibold text-foreground/90">{engine}</span>
                    {store.searchEngine === engine.toLowerCase() && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                  {idx < arr.length - 1 && <div className="h-px bg-border/50 ml-4" />}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => onChange(!value)}>
      <div className="flex-1 mr-4">
        <div className="text-[15px] font-semibold text-foreground/90">{label}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{sub}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} className="shrink-0 data-[state=checked]:bg-primary" />
    </div>
  );
}
