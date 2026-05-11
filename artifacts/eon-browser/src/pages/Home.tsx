import { useGetTopSites, useGetRecentHistory, useGetSmartSuggestions } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Search, Sparkles, Clock, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: topSites, isLoading: loadingTopSites } = useGetTopSites();
  const { data: recentHistory, isLoading: loadingHistory } = useGetRecentHistory();
  const { data: suggestions, isLoading: loadingSuggestions } = useGetSmartSuggestions();

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full w-full p-8 relative overflow-hidden flex flex-col items-center pt-24 pb-12">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] z-0 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] z-0 pointer-events-none" />

      <div className="w-full max-w-5xl z-10 flex flex-col gap-12">
        {/* Time and Search */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-5xl font-light tracking-tight text-white mb-2">{timeString}</h2>
            <p className="text-muted-foreground tracking-widest uppercase text-sm">{dateString}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-2xl relative group"
          >
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex items-center glass-panel rounded-full p-2 pr-4 border border-primary/30 neon-box">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 ml-1">
                <Search className="w-5 h-5" />
              </div>
              <Input 
                placeholder="Search the web or ask EoN AI..." 
                className="border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/70 h-12 flex-1"
                data-testid="home-search-input"
              />
              <Sparkles className="w-5 h-5 text-secondary animate-pulse ml-2 flex-shrink-0" />
            </div>
          </motion.div>
        </div>

        {/* Top Sites */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">Top Sites</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingTopSites ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />)
            ) : topSites?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No top sites yet</div>
            ) : (
              topSites?.slice(0, 5).map((site, i) => (
                <a 
                  key={i} 
                  href={site.url}
                  className="glass-panel p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all hover:-translate-y-1 hover:border-primary/50 group"
                  data-testid={`top-site-${i}`}
                >
                  <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-primary/50 overflow-hidden">
                    {site.favicon ? (
                      <img src={site.favicon} alt="" className="w-6 h-6" />
                    ) : (
                      <Globe className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate w-full text-center group-hover:text-primary transition-colors">{site.title || site.url}</span>
                </a>
              ))
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Smart Suggestions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">Smart Suggestions</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {loadingSuggestions ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-white/5" />)
              ) : suggestions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground glass-panel rounded-lg">No suggestions right now</div>
              ) : (
                suggestions?.slice(0, 3).map((suggestion, i) => (
                  <Card key={i} className="glass-panel border-white/10 hover:border-secondary/50 transition-colors bg-transparent group cursor-pointer">
                    <CardContent className="p-3 flex gap-4 items-center">
                      <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center text-secondary">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-white group-hover:text-secondary">{suggestion.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{suggestion.reason}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">Recent History</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {loadingHistory ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />)
              ) : recentHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground glass-panel rounded-lg">No recent history</div>
              ) : (
                recentHistory?.slice(0, 4).map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                       {entry.favicon ? (
                        <img src={entry.favicon} alt="" className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <span className="text-sm font-medium truncate text-gray-300 group-hover:text-white">{entry.title || entry.url}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                        {new Date(entry.visitedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
