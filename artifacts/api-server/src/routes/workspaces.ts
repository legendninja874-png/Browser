import { Router } from "express";
import { db } from "@workspace/db";
import { workspacesTable, tabsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
  GetWorkspaceParams,
  UpdateWorkspaceParams,
  DeleteWorkspaceParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/workspaces", async (req, res) => {
  const workspaces = await db.select().from(workspacesTable).orderBy(workspacesTable.createdAt);
  const tabs = await db.select().from(tabsTable);
  const result = workspaces.map(ws => ({
    ...ws,
    tabCount: tabs.filter(t => t.workspaceId === ws.id).length,
  }));
  res.json(result);
});

router.post("/workspaces", async (req, res) => {
  const body = CreateWorkspaceBody.parse(req.body);
  const [workspace] = await db.insert(workspacesTable).values(body).returning();
  res.status(201).json({ ...workspace, tabCount: 0 });
});

router.get("/workspaces/:id", async (req, res) => {
  const { id } = GetWorkspaceParams.parse({ id: Number(req.params.id) });
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id));
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  const tabs = await db.select().from(tabsTable);
  res.json({ ...workspace, tabCount: tabs.filter(t => t.workspaceId === id).length });
});

router.patch("/workspaces/:id", async (req, res) => {
  const { id } = UpdateWorkspaceParams.parse({ id: Number(req.params.id) });
  const body = UpdateWorkspaceBody.parse(req.body);
  const [workspace] = await db.update(workspacesTable).set(body).where(eq(workspacesTable.id, id)).returning();
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  const tabs = await db.select().from(tabsTable);
  res.json({ ...workspace, tabCount: tabs.filter(t => t.workspaceId === id).length });
});

router.delete("/workspaces/:id", async (req, res) => {
  const { id } = DeleteWorkspaceParams.parse({ id: Number(req.params.id) });
  await db.delete(workspacesTable).where(eq(workspacesTable.id, id));
  res.status(204).end();
});

export default router;
