import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppInner />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
