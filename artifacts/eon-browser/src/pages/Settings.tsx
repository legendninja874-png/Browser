import { useState } from "react";
import { Monitor, Shield, Zap, RefreshCw, Palette, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type SectionId = "appearance" | "privacy" | "performance" | "sync" | "system";

const NAV_ITEMS: { id: SectionId; icon: React.ElementType; label: string }[] = [
  { id: "appearance",  icon: Palette,    label: "Appearance" },
  { id: "privacy",     icon: Shield,     label: "Privacy & Security" },
  { id: "performance", icon: Zap,        label: "Performance" },
  { id: "sync",        icon: RefreshCw,  label: "Sync" },
  { id: "system",      icon: Monitor,    label: "System" },
];

const THEME_OPTIONS = [
  { name: "Neon Void",    color: "#00d4ff" },
  { name: "Synthwave",    color: "#a855f7" },
  { name: "Deep Ocean",   color: "#3b82f6" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("appearance");
  const [tabSleep, setTabSleep]           = useState(true);
  const [animations, setAnimations]       = useState(true);
  const [adBlock, setAdBlock]             = useState(true);
  const [fingerprint, setFingerprint]     = useState(true);
  const [httpsOnly, setHttpsOnly]         = useState(true);
  const [autoSync, setAutoSync]           = useState(true);
  const [activeTheme, setActiveTheme]     = useState("Neon Void");

  return (
    <div className="flex h-full bg-background overflow-hidden">

      {/* Settings nav */}
      <div className="w-[180px] flex flex-col border-r border-white/8 bg-sidebar shrink-0">
        <div className="flex items-center gap-1.5 px-3 h-9 border-b border-white/8 shrink-0">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Settings</span>
        </div>
        <div className="py-1.5 px-1.5 flex flex-col gap-px">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2.5 h-8 px-2 rounded w-full text-left transition-colors
                ${activeSection === id ? "bg-white/10 text-white/80" : "text-white/35 hover:bg-white/6 hover:text-white/55"}`}
              data-testid={`settings-nav-${id}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[12px] flex-1">{label}</span>
              {activeSection === id && <ChevronRight className="w-3 h-3 text-white/30" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-5 flex flex-col gap-5">

          {activeSection === "appearance" && (
            <>
              <SectionHeader title="Appearance" subtitle="Customize the browser's look and feel" />

              <SettingsCard>
                <SettingsRow label="Color theme" description="Choose your accent color palette">
                  <div className="flex gap-2 mt-2">
                    {THEME_OPTIONS.map(t => (
                      <button
                        key={t.name}
                        onClick={() => setActiveTheme(t.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[12px] transition-colors
                          ${activeTheme === t.name ? "border-white/25 bg-white/8 text-white/75" : "border-white/8 text-white/35 hover:border-white/15"}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </SettingsRow>
                <Separator className="bg-white/6" />
                <SettingsToggle label="Subtle animations" description="Micro-interactions and transitions" value={animations} onChange={setAnimations} />
              </SettingsCard>
            </>
          )}

          {activeSection === "privacy" && (
            <>
              <SectionHeader title="Privacy & Security" subtitle="Control your data and tracking protection" />
              <SettingsCard>
                <SettingsToggle label="Ad & tracker blocker" description="Block ads and trackers across all sites" value={adBlock} onChange={setAdBlock} />
                <Separator className="bg-white/6" />
                <SettingsToggle label="Fingerprint protection" description="Prevent sites from identifying your browser" value={fingerprint} onChange={setFingerprint} />
                <Separator className="bg-white/6" />
                <SettingsToggle label="HTTPS-only mode" description="Warn when visiting non-secure sites" value={httpsOnly} onChange={setHttpsOnly} />
              </SettingsCard>
            </>
          )}

          {activeSection === "performance" && (
            <>
              <SectionHeader title="Performance" subtitle="Memory and CPU management" />
              <SettingsCard>
                <SettingsToggle label="Tab sleeping" description="Automatically sleep inactive tabs to save memory" value={tabSleep} onChange={setTabSleep} />
                <Separator className="bg-white/6" />
                <SettingsRow label="Sleep threshold" description="Time before an inactive tab sleeps">
                  <Select defaultValue="30m">
                    <SelectTrigger className="w-[140px] h-7 text-[12px] bg-white/6 border-white/10 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="30m">30 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
              </SettingsCard>
            </>
          )}

          {activeSection === "sync" && (
            <>
              <SectionHeader title="Sync" subtitle="Keep your data across devices" />
              <SettingsCard>
                <SettingsToggle label="Automatic sync" description="Sync changes automatically in the background" value={autoSync} onChange={setAutoSync} />
                <Separator className="bg-white/6" />
                <SettingsRow label="Sync interval" description="How often to sync with the cloud">
                  <Select defaultValue="5m">
                    <SelectTrigger className="w-[140px] h-7 text-[12px] bg-white/6 border-white/10 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">Every minute</SelectItem>
                      <SelectItem value="5m">Every 5 minutes</SelectItem>
                      <SelectItem value="15m">Every 15 minutes</SelectItem>
                      <SelectItem value="30m">Every 30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
              </SettingsCard>
            </>
          )}

          {activeSection === "system" && (
            <>
              <SectionHeader title="System" subtitle="About EoN Browser" />
              <SettingsCard>
                <SettingsRow label="Version" description="Current release">
                  <span className="text-[12px] text-white/40 font-mono mt-1">1.0.0-alpha</span>
                </SettingsRow>
                <Separator className="bg-white/6" />
                <SettingsRow label="Engine" description="Rendering stack">
                  <span className="text-[12px] text-white/40 font-mono mt-1">EoN Engine · Chromium 124</span>
                </SettingsRow>
              </SettingsCard>
            </>
          )}

          {/* Save */}
          <div className="flex justify-end gap-2 pt-1">
            <button className="h-7 px-4 rounded text-[12px] text-white/35 hover:text-white/55 hover:bg-white/6 border border-white/8 transition-colors">
              Reset
            </button>
            <button className="h-7 px-4 rounded text-[12px] bg-primary/80 hover:bg-primary text-black font-medium transition-colors">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white/75">{title}</div>
      <div className="text-[11px] text-white/30 mt-0.5">{subtitle}</div>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
      {children}
    </div>
  );
}

function SettingsToggle({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1 mr-4">
        <div className="text-[12px] text-white/65">{label}</div>
        <div className="text-[11px] text-white/30 mt-0.5">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function SettingsRow({ label, description, children }: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col px-4 py-3">
      <div className="text-[12px] text-white/65">{label}</div>
      <div className="text-[11px] text-white/30 mt-0.5">{description}</div>
      {children}
    </div>
  );
}
