import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { setBaseUrl } from "@workspace/api-client-react";

// When running as a native Capacitor APK, relative API URLs resolve to
// https://localhost/api/... where no server exists. We bake in the deployed
// backend URL at build time via VITE_API_URL; fall back to the Replit
// production URL so debug builds also work without extra config.
const NATIVE_FALLBACK_API = "https://workspace.beastfuher.replit.app";

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
    __eonInstallPrompt?: BeforeInstallPromptEvent;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
  }
}

function isNativePlatform(): boolean {
  return !!(
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform()
  );
}

const apiUrl: string | undefined =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (isNativePlatform() ? NATIVE_FALLBACK_API : undefined);

if (apiUrl) setBaseUrl(apiUrl);

import { ThemeProvider } from "@/contexts/theme";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Browser from "@/pages/Browser";
import Tabs from "@/pages/Tabs";
import Workspaces from "@/pages/Workspaces";
import Bookmarks from "@/pages/Bookmarks";
import History from "@/pages/History";
import Downloads from "@/pages/Downloads";
import Intelligence from "@/pages/Intelligence";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";

// Retry strategy: in native builds the device may be offline; don't hang
// queries in perpetual loading state — fail fast so pages show empty content.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: isNativePlatform() ? 0 : 2,
    },
  },
});

// Root error boundary — catches any render crash and shows a recoverable
// error screen instead of a black void.
interface ErrorBoundaryState { error: Error | null }
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "#121212",
            color: "#e0e0e0",
            padding: "32px 24px",
            minHeight: "100dvh",
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>EoN Browser</div>
          <div style={{ fontSize: 15, color: "#aaa" }}>
            Something went wrong during startup. Please close and reopen the app.
          </div>
          <pre
            style={{
              fontSize: 11,
              color: "#666",
              background: "#1e1e1e",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack?.slice(0, 500)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background: "#4285f4",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/"             component={Home} />
        <Route path="/browser"      component={Browser} />
        <Route path="/tabs"         component={Tabs} />
        <Route path="/workspaces"   component={Workspaces} />
        <Route path="/bookmarks"    component={Bookmarks} />
        <Route path="/history"      component={History} />
        <Route path="/downloads"    component={Downloads} />
        <Route path="/intelligence" component={Intelligence} />
        <Route path="/dashboard"    component={Dashboard} />
        <Route path="/settings"     component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function AppInner() {
  useEffect(() => {
    const saved = localStorage.getItem("eon-theme") ?? "dark";
    if (saved !== "light") document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AppInner />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
