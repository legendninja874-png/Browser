import { useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Search, Check,
  Palette, Shield, Zap, RefreshCw, Monitor,
  Globe, Bell, Download, Type, Moon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme, Theme } from "@/contexts/theme";

const THEMES: { id: Theme; label: string; description: string; preview: string }[] = [
  { id: "dark",   label: "Dark",         description: "Classic dark interface",        preview: "bg-[#111111]" },
  { id: "amoled", label: "AMOLED Black", description: "Pure black for OLED displays",  preview: "bg-[#000000]" },
  { id: "gray",   label: "Gray",         description: "Softer dark gray surface",      preview: "bg-[#1f1f1f]" },
  { id: "light",  label: "Light",        description: "Clean white interface",         preview: "bg-[#f5f5f5]" },
  { id: "blue",   label: "Blue",         description: "Deep blue accent theme",        preview: "bg-[#0d1219]" },
];

type Section = "main" | "appearance" | "privacy" | "performance" | "sync" | "search" | "downloads";

export default function Settings() {
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const [section, setSection]       = useState<Section>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabSleep, setTabSleep]       = useState(true);
  const [adBlock, setAdBlock]         = useState(true);
  const [httpsOnly, setHttpsOnly]     = useState(true);
  const [fingerprint, setFingerprint] = useState(false);
  const [autoSync, setAutoSync]       = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [animations, setAnimations]   = useState(true);

  if (section !== "main") {
    return (
      <SectionView
        title={sectionLabel(section)}
        onBack={() => setSection("main")}
        theme={theme}
        setTheme={setTheme}
        section={section}
        tabSleep={tabSleep} setTabSleep={setTabSleep}
        adBlock={adBlock} setAdBlock={setAdBlock}
        httpsOnly={httpsOnly} setHttpsOnly={setHttpsOnly}
        fingerprint={fingerprint} setFingerprint={setFingerprint}
        autoSync={autoSync} setAutoSync={setAutoSync}
        notifications={notifications} setNotifications={setNotifications}
        animations={animations} setAnimations={setAnimations}
      />
    );
  }

  const SETTINGS_GROUPS = [
    {
      label: "Basics",
      items: [
        { icon: Search,  label: "Search engine",   sub: "Google", onTap: () => setSection("search") },
        { icon: Globe,   label: "Address bar",      sub: "Bottom", onTap: () => {} },
        { icon: Shield,  label: "Privacy & security", sub: adBlock ? "Ad blocking on" : "Ad blocking off", onTap: () => setSection("privacy") },
        { icon: Zap,     label: "Safety check",      sub: "No issues found", onTap: () => {} },
      ],
    },
    {
      label: "Appearance",
      items: [
        { icon: Palette, label: "Theme",           sub: THEMES.find(t => t.id === theme)?.label ?? "Dark", onTap: () => setSection("appearance") },
        { icon: Type,    label: "Font size",        sub: "Medium", onTap: () => {} },
        { icon: Moon,    label: "Animations",       sub: animations ? "Enabled" : "Disabled", onTap: () => setSection("appearance") },
      ],
    },
    {
      label: "Features",
      items: [
        { icon: Download,   label: "Downloads",      sub: "Default location", onTap: () => setSection("downloads") },
        { icon: Zap,        label: "Performance",     sub: tabSleep ? "Tab sleeping on" : "Tab sleeping off", onTap: () => setSection("performance") },
        { icon: RefreshCw,  label: "Sync",            sub: autoSync ? "Auto sync on" : "Manual", onTap: () => setSection("sync") },
        { icon: Bell,       label: "Notifications",   sub: notifications ? "On" : "Off", onTap: () => setSection("sync") },
      ],
    },
    {
      label: "About",
      items: [
        { icon: Monitor, label: "About EoN Browser", sub: "Version 1.0.0", onTap: () => {} },
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-foreground">Settings</span>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 h-9 mx-4 mb-3 px-3 bg-muted rounded-xl">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="settings-search"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {filtered.map(group => (
          <section key={group.label}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.label}</div>
            <div className="browser-card divide-y divide-border overflow-hidden">
              {group.items.map(item => (
                <button
                  key={item.label}
                  onClick={item.onTap}
                  className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/85">{item.label}</div>
                    {item.sub && <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </button>
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
  title, onBack, section, theme, setTheme,
  tabSleep, setTabSleep, adBlock, setAdBlock, httpsOnly, setHttpsOnly,
  fingerprint, setFingerprint, autoSync, setAutoSync,
  notifications, setNotifications, animations, setAnimations,
}: any) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 flex items-center gap-3 px-4 h-12 bg-card border-b border-border">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {section === "appearance" && (
          <>
            <section>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Theme</div>
              <div className="flex flex-col gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-4 px-4 py-3.5 browser-card hover:bg-muted/30 transition-colors text-left"
                    data-testid={`theme-${t.id}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${t.preview} border border-border/60 shrink-0`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground/85">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                    </div>
                    {theme === t.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Interface</div>
              <div className="browser-card divide-y divide-border overflow-hidden">
                <ToggleRow label="Subtle animations" sub="Micro-interactions and transitions" value={animations} onChange={setAnimations} />
              </div>
            </section>

            <section>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Font size</div>
              <div className="browser-card px-4 py-3">
                <Select defaultValue="medium">
                  <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-sm text-foreground/80 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xlarge">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          </>
        )}

        {section === "privacy" && (
          <section>
            <div className="browser-card divide-y divide-border overflow-hidden">
              <ToggleRow label="Ad & tracker blocker"        sub="Block ads across all sites"            value={adBlock}      onChange={setAdBlock} />
              <ToggleRow label="HTTPS-only mode"             sub="Warn on non-secure connections"        value={httpsOnly}    onChange={setHttpsOnly} />
              <ToggleRow label="Fingerprint protection"      sub="Prevent cross-site tracking"           value={fingerprint}  onChange={setFingerprint} />
            </div>
            <div className="browser-card mt-3 divide-y divide-border overflow-hidden">
              <button className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="text-sm text-foreground/85 text-left">Clear browsing data</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Cookies, cache, history</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>
          </section>
        )}

        {section === "performance" && (
          <section>
            <div className="browser-card divide-y divide-border overflow-hidden">
              <ToggleRow label="Tab sleeping" sub="Automatically sleep inactive tabs" value={tabSleep} onChange={setTabSleep} />
            </div>
            <div className="browser-card mt-3 px-4 py-3.5">
              <div className="text-sm text-foreground/85 mb-2">Sleep timer</div>
              <Select defaultValue="30m">
                <SelectTrigger className="w-full bg-muted border-0 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5 minutes</SelectItem>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {section === "sync" && (
          <section>
            <div className="browser-card divide-y divide-border overflow-hidden">
              <ToggleRow label="Auto sync"       sub="Sync in the background"           value={autoSync}      onChange={setAutoSync} />
              <ToggleRow label="Notifications"   sub="Get alerts from EoN"              value={notifications} onChange={setNotifications} />
            </div>
          </section>
        )}

        {section === "search" && (
          <section>
            <div className="browser-card divide-y divide-border overflow-hidden">
              {["Google", "Bing", "DuckDuckGo", "Brave Search", "Ecosia"].map(engine => (
                <button key={engine} className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-foreground/85">{engine}</span>
                  {engine === "Google" && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {section === "downloads" && (
          <section>
            <div className="browser-card divide-y divide-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <div className="text-sm text-foreground/85">Save location</div>
                  <div className="text-xs text-muted-foreground mt-0.5">/Downloads</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <ToggleRow label="Ask before downloading" sub="Confirm each download" value={false} onChange={() => {}} />
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
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 mr-4">
        <div className="text-sm text-foreground/85">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}
