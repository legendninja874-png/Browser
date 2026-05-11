import { Router } from "express";
import { db } from "@workspace/db";
import { downloadsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { StartDownloadBody } from "@workspace/api-zod";

const router = Router();

router.get("/downloads", async (req, res) => {
  const downloads = await db.select().from(downloadsTable).orderBy(desc(downloadsTable.createdAt));
  res.json(downloads);
});

router.post("/downloads", async (req, res) => {
  const body = StartDownloadBody.parse(req.body);
  const [download] = await db.insert(downloadsTable).values({
    url: body.url,
    filename: body.filename,
    status: "downloading",
    downloadedBytes: 0,
  }).returning();
  res.status(201).json(download);
});

export default router;
