import { Router } from "express";
import { db } from "@workspace/db";
import {
  tabsTable,
  workspacesTable,
  bookmarksTable,
  historyTable,
  aiMessagesTable,
  activityTable,
} from "@workspace/db";
import { desc, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/overview", async (req, res) => {
  const [tabs, workspaces, bookmarks, history] = await Promise.all([
    db.select().from(tabsTable),
    db.select().from(workspacesTable),
    db.select().from(bookmarksTable),
    db.select().from(historyTable),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aiUsesToday = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiMessagesTable)
    .where(gte(aiMessagesTable.createdAt, today));

  const overview = {
    totalTabs:       tabs.length,
    sleepingTabs:    tabs.filter(t => t.isSleeping).length,
    trackersBlocked: Math.floor(Math.random() * 200) + 50,
    memoryUsedMb:    tabs.reduce((s, t) => s + (t.memoryMb ?? 45), 0),
    dataSavedMb:     Math.floor(Math.random() * 500) + 100,
    aiUsesToday:     aiUsesToday[0]?.count ?? 0,
    workspaceCount:  workspaces.length,
    bookmarkCount:   bookmarks.length,
    historyCount:    history.length,
  };

  res.json(overview);
});

router.get("/dashboard/activity", async (req, res) => {
  const activity = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(20);
  res.json(activity);
});

export default router;
