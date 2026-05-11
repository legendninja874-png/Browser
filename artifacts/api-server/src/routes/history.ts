import { Router } from "express";
import { db } from "@workspace/db";
import { historyTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { AddHistoryEntryBody } from "@workspace/api-zod";

const router = Router();

router.get("/history", async (req, res) => {
  const entries = await db.select().from(historyTable).orderBy(desc(historyTable.visitedAt)).limit(100);
  res.json(entries);
});

router.post("/history", async (req, res) => {
  const body = AddHistoryEntryBody.parse(req.body);
  const [entry] = await db.insert(historyTable).values(body).returning();
  res.status(201).json(entry);
});

router.delete("/history", async (req, res) => {
  await db.delete(historyTable);
  res.status(204).end();
});

router.get("/history/recent", async (req, res) => {
  const entries = await db.select().from(historyTable).orderBy(desc(historyTable.visitedAt)).limit(20);
  res.json(entries);
});

router.get("/history/top-sites", async (req, res) => {
  const topSites = await db
    .select({
      url: historyTable.url,
      title: historyTable.title,
      favicon: historyTable.favicon,
      visitCount: sql<number>`sum(${historyTable.visitCount})::int`,
    })
    .from(historyTable)
    .groupBy(historyTable.url, historyTable.title, historyTable.favicon)
    .orderBy(desc(sql`sum(${historyTable.visitCount})`))
    .limit(12);
  res.json(topSites);
});

export default router;
