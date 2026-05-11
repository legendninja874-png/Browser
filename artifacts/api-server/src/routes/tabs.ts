import { Router } from "express";
import { db } from "@workspace/db";
import { tabsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateTabBody,
  UpdateTabBody,
  GetTabParams,
  UpdateTabParams,
  CloseTabParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/tabs", async (req, res) => {
  const tabs = await db.select().from(tabsTable).orderBy(tabsTable.createdAt);
  res.json(tabs);
});

router.post("/tabs", async (req, res) => {
  const body = CreateTabBody.parse(req.body);
  const [tab] = await db.insert(tabsTable).values({
    url: body.url,
    title: body.title ?? "New Tab",
    workspaceId: body.workspaceId ?? null,
    isIncognito: body.isIncognito ?? false,
    isPinned: body.isPinned ?? false,
  }).returning();
  res.status(201).json(tab);
});

router.get("/tabs/stats", async (req, res) => {
  const tabs = await db.select().from(tabsTable);
  const stats = {
    total: tabs.length,
    sleeping: tabs.filter(t => t.isSleeping).length,
    pinned: tabs.filter(t => t.isPinned).length,
    incognito: tabs.filter(t => t.isIncognito).length,
    grouped: tabs.filter(t => t.groupId != null).length,
    totalMemoryMb: tabs.reduce((sum, t) => sum + (t.memoryMb ?? 0), 0),
  };
  res.json(stats);
});

router.get("/tabs/:id", async (req, res) => {
  const { id } = GetTabParams.parse({ id: Number(req.params.id) });
  const [tab] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));
  if (!tab) return res.status(404).json({ error: "Tab not found" });
  res.json(tab);
});

router.patch("/tabs/:id", async (req, res) => {
  const { id } = UpdateTabParams.parse({ id: Number(req.params.id) });
  const body = UpdateTabBody.parse(req.body);
  const [tab] = await db.update(tabsTable).set(body).where(eq(tabsTable.id, id)).returning();
  if (!tab) return res.status(404).json({ error: "Tab not found" });
  res.json(tab);
});

router.delete("/tabs/:id", async (req, res) => {
  const { id } = CloseTabParams.parse({ id: Number(req.params.id) });
  await db.delete(tabsTable).where(eq(tabsTable.id, id));
  res.status(204).end();
});

export default router;
