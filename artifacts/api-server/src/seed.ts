import { db } from "@workspace/db";
import {
  tabsTable, workspacesTable, bookmarksTable, historyTable,
  conversationsTable, aiMessagesTable, smartSuggestionsTable,
  downloadsTable, activityTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Workspaces
  const [ws1, ws2, ws3] = await db.insert(workspacesTable).values([
    { name: "Personal", color: "#4285f4", icon: "Home", isActive: true },
    { name: "Work", color: "#34a853", icon: "Briefcase", isActive: false },
    { name: "Study", color: "#a855f7", icon: "BookOpen", isActive: false },
  ]).returning();

  // Tabs
  await db.insert(tabsTable).values([
    { title: "GitHub — Where the world builds software", url: "https://github.com", workspaceId: ws1.id, isActive: true, memoryMb: 52.4 },
    { title: "Hacker News", url: "https://news.ycombinator.com", workspaceId: ws1.id, isActive: false, memoryMb: 28.1 },
    { title: "YouTube", url: "https://youtube.com", workspaceId: ws1.id, isActive: false, isSleeping: true, memoryMb: 89.6 },
    { title: "Stack Overflow - Where Developers Learn", url: "https://stackoverflow.com", workspaceId: ws2.id, isActive: false, memoryMb: 41.2 },
    { title: "Reddit - The front page of the internet", url: "https://reddit.com", workspaceId: ws1.id, isActive: false, isSleeping: true, memoryMb: 67.3 },
    { title: "Linear – Plan and build products", url: "https://linear.app", workspaceId: ws2.id, isActive: false, isPinned: true, memoryMb: 38.9 },
    { title: "Figma - Design Tool", url: "https://figma.com", workspaceId: ws2.id, isActive: false, memoryMb: 95.1 },
  ]);

  // History
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  await db.insert(historyTable).values([
    { title: "GitHub — Where the world builds software", url: "https://github.com", visitCount: 48, visitedAt: hoursAgo(0.5) },
    { title: "Hacker News", url: "https://news.ycombinator.com", visitCount: 32, visitedAt: hoursAgo(1) },
    { title: "React – A JavaScript library for building user interfaces", url: "https://react.dev", visitCount: 15, visitedAt: hoursAgo(2) },
    { title: "YouTube - Video Streaming", url: "https://youtube.com", visitCount: 22, visitedAt: hoursAgo(3) },
    { title: "Stack Overflow - Developer Community", url: "https://stackoverflow.com", visitCount: 19, visitedAt: hoursAgo(5) },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org", visitCount: 11, visitedAt: hoursAgo(8) },
    { title: "Tailwind CSS Documentation", url: "https://tailwindcss.com/docs", visitCount: 27, visitedAt: hoursAgo(10) },
    { title: "OpenAI Platform", url: "https://platform.openai.com", visitCount: 9, visitedAt: hoursAgo(14) },
    { title: "Vercel - Deploy Web Projects", url: "https://vercel.com", visitCount: 7, visitedAt: hoursAgo(20) },
    { title: "Figma - Collaborative Design Tool", url: "https://figma.com", visitCount: 14, visitedAt: daysAgo(1) },
    { title: "Linear – Project Management", url: "https://linear.app", visitCount: 12, visitedAt: daysAgo(1) },
    { title: "Reddit - The front page of the internet", url: "https://reddit.com", visitCount: 31, visitedAt: daysAgo(1) },
    { title: "Netflix - Watch TV Shows & Movies", url: "https://netflix.com", visitCount: 5, visitedAt: daysAgo(2) },
    { title: "Wikipedia - The Free Encyclopedia", url: "https://wikipedia.org", visitCount: 8, visitedAt: daysAgo(2) },
    { title: "Medium - Where good ideas find you", url: "https://medium.com", visitCount: 6, visitedAt: daysAgo(3) },
    { title: "Twitter / X", url: "https://x.com", visitCount: 18, visitedAt: daysAgo(4) },
    { title: "Google Search", url: "https://google.com", visitCount: 95, visitedAt: daysAgo(5) },
  ]);

  // Bookmarks
  await db.insert(bookmarksTable).values([
    { title: "GitHub", url: "https://github.com", folder: "Dev Tools", workspaceId: ws2.id },
    { title: "Stack Overflow", url: "https://stackoverflow.com", folder: "Dev Tools", workspaceId: ws2.id },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org", folder: "Dev Tools", workspaceId: ws2.id },
    { title: "Can I Use", url: "https://caniuse.com", folder: "Dev Tools", workspaceId: ws2.id },
    { title: "React Docs", url: "https://react.dev", folder: "Dev Tools", workspaceId: ws2.id },
    { title: "Hacker News", url: "https://news.ycombinator.com", folder: "News", workspaceId: ws1.id },
    { title: "The Verge", url: "https://theverge.com", folder: "News", workspaceId: ws1.id },
    { title: "Ars Technica", url: "https://arstechnica.com", folder: "News", workspaceId: ws1.id },
    { title: "YouTube", url: "https://youtube.com", folder: "Entertainment", workspaceId: ws1.id },
    { title: "Spotify Web Player", url: "https://open.spotify.com", folder: "Entertainment", workspaceId: ws1.id },
    { title: "Linear", url: "https://linear.app", folder: "Work", workspaceId: ws2.id },
    { title: "Figma", url: "https://figma.com", folder: "Work", workspaceId: ws2.id },
    { title: "Notion", url: "https://notion.so", folder: "Work", workspaceId: ws2.id },
  ]);

  // Downloads
  await db.insert(downloadsTable).values([
    { filename: "react-docs-v18.pdf", url: "https://example.com/react-docs-v18.pdf", status: "completed", sizeBytes: 4200000, downloadedBytes: 4200000 },
    { filename: "design-system-v2.fig", url: "https://example.com/design-system.fig", status: "completed", sizeBytes: 12500000, downloadedBytes: 12500000 },
    { filename: "node-v20-linux.tar.gz", url: "https://nodejs.org/dist/v20.0.0/node-v20.tar.gz", status: "completed", sizeBytes: 45000000, downloadedBytes: 45000000 },
    { filename: "screenshot-2024.png", url: "https://example.com/screenshot.png", status: "completed", sizeBytes: 892000, downloadedBytes: 892000 },
    { filename: "typescript-handbook.pdf", url: "https://example.com/ts-handbook.pdf", status: "downloading", sizeBytes: 8500000, downloadedBytes: 3200000 },
  ]);

  // Conversations and AI Messages
  const [conv1] = await db.insert(conversationsTable).values([
    { title: "Summarize this article" },
  ]).returning();

  await db.insert(aiMessagesTable).values([
    { conversationId: conv1.id, role: "user", content: "Can you summarize the main points of this article?" },
    { conversationId: conv1.id, role: "assistant", content: "Here are the key points from the article:\n\n1. The new feature reduces loading time by 40%\n2. It introduces a novel caching mechanism for offline support\n3. Browser compatibility improved across all major platforms\n\nOverall, a strong case for adopting this approach in production." },
  ]);

  // Smart suggestions
  await db.insert(smartSuggestionsTable).values([
    { type: "trending", title: "React 19 new features", url: "https://react.dev/blog", reason: "Trending in Tech" },
    { type: "trending", title: "TypeScript 5.0 release notes", url: "https://typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html", reason: "Popular this week" },
    { type: "ai", title: "AI browser extensions 2024", url: "https://google.com/search?q=AI+browser+extensions+2024", reason: "Based on your interests" },
    { type: "visit", title: "Best dark mode websites", url: "https://google.com/search?q=best+dark+mode+websites", reason: "Based on your history" },
    { type: "ai", title: "Vite vs Webpack performance", url: "https://google.com/search?q=vite+vs+webpack+performance", reason: "Related to recent activity" },
  ]);

  // Activity feed
  await db.insert(activityTable).values([
    { type: "tab_opened", title: "New tab opened", description: "Opened GitHub in a new tab", url: "https://github.com" },
    { type: "bookmark_added", title: "Bookmark saved", description: "Saved React Docs to Dev Tools", url: "https://react.dev" },
    { type: "download_complete", title: "Download complete", description: "react-docs-v18.pdf downloaded successfully" },
    { type: "ai_used", title: "EoN AI used", description: "Page summarization requested" },
    { type: "tab_sleeping", title: "Tabs sleeping", description: "2 inactive tabs moved to sleep mode" },
    { type: "tracker_blocked", title: "Trackers blocked", description: "34 trackers blocked in this session" },
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
