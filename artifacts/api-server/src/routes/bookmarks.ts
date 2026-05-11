import { Router } from "express";
import { db } from "@workspace/db";
import { bookmarksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateBookmarkBody,
  DeleteBookmarkParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/bookmarks", async (req, res) => {
  const bookmarks = await db.select().from(bookmarksTable).orderBy(desc(bookmarksTable.createdAt));
  res.json(bookmarks);
});

router.post("/bookmarks", async (req, res) => {
  const body = CreateBookmarkBody.parse(req.body);
  const [bookmark] = await db.insert(bookmarksTable).values(body).returning();
  res.status(201).json(bookmark);
});

router.delete("/bookmarks/:id", async (req, res) => {
  const { id } = DeleteBookmarkParams.parse({ id: Number(req.params.id) });
  await db.delete(bookmarksTable).where(eq(bookmarksTable.id, id));
  res.status(204).end();
});

router.get("/bookmarks/recent", async (req, res) => {
  const bookmarks = await db.select().from(bookmarksTable).orderBy(desc(bookmarksTable.createdAt)).limit(10);
  res.json(bookmarks);
});

export default router;
