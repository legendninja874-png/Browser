import { Settings as SettingsIcon, Monitor, Shield, Zap, RefreshCw, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="text-muted-foreground w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure your EoN Browser experience.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          <SettingsNavBtn icon={Palette} label="Appearance" active />
          <SettingsNavBtn icon={Shield} label="Privacy & Security" />
          <SettingsNavBtn icon={Zap} label="Performance" />
          <SettingsNavBtn icon={RefreshCw} label="Sync" />
          <SettingsNavBtn icon={Monitor} label="System" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Theme & Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <ThemeOption name="Cyberpunk Neon" color="#00ffff" active />
                  <ThemeOption name="Synthwave" color="#ff00ff" />
                  <ThemeOption name="Void Dark" color="#444444" />
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cinematic Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable particle effects and heavy glows</p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Glassmorphism Intensity</Label>
                  <p className="text-sm text-muted-foreground">Amount of background blur on panels</p>
                </div>
                <Select defaultValue="high">
                  <SelectTrigger className="w-[180px] bg-black/50 border-white/10">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Faster)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Prettier)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Manage memory and CPU usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tab Sleeping</Label>
                  <p className="text-sm text-muted-foreground">Automatically sleep inactive tabs to save memory</p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sleep Timer</Label>
                  <p className="text-sm text-muted-foreground">Time before an inactive tab goes to sleep</p>
                </div>
                <Select defaultValue="30m">
                  <SelectTrigger className="w-[180px] bg-black/50 border-white/10">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
             <Button variant="outline" className="border-white/10 hover:bg-white/5">Reset Defaults</Button>
             <Button className="bg-primary text-black hover:bg-primary/80">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNavBtn({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors
      ${active ? 'bg-primary/20 text-primary border border-primary/30 neon-box' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
    `}>
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

function ThemeOption({ name, color, active = false }: { name: string, color: string, active?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all
      ${active ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/40 hover:border-white/30'}
    `}>
      <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: color, boxShadow: active ? `0 0 15px ${color}` : 'none' }} />
      <span className="text-sm font-medium text-center">{name}</span>
    </div>
  );
}
