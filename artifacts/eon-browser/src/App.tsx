import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";

// Page imports placeholder
import Home from "@/pages/Home";
import Browser from "@/pages/Browser";
import Workspaces from "@/pages/Workspaces";
import Bookmarks from "@/pages/Bookmarks";
import History from "@/pages/History";
import Downloads from "@/pages/Downloads";
import Intelligence from "@/pages/Intelligence";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function StartupScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0f] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary neon-text">
          EoN
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-2 text-xl font-mono tracking-[0.2em] text-muted-foreground uppercase"
        >
          BROWSER
        </motion.p>
        
        <motion.div 
          className="w-48 h-1 mt-8 overflow-hidden rounded-full bg-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="h-full bg-primary neon-box"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/browser" component={Browser} />
        <Route path="/workspaces" component={Workspaces} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/history" component={History} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/intelligence" component={Intelligence} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  const [started, setStarted] = useState(false);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {!started && <StartupScreen key="startup" onComplete={() => setStarted(true)} />}
        </AnimatePresence>
        
        {started && (
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
