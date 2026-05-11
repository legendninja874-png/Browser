import { Router } from "express";
import { PushSyncBody } from "@workspace/api-zod";

const router = Router();

let lastSyncAt: string | null = null;

router.get("/sync/status", async (req, res) => {
  res.json({
    lastSyncAt,
    deviceCount: 3,
    tabsSynced:      true,
    bookmarksSynced: true,
    historySynced:   true,
    settingsSynced:  true,
  });
});

router.post("/sync/push", async (req, res) => {
  PushSyncBody.parse(req.body);
  lastSyncAt = new Date().toISOString();
  res.json({
    lastSyncAt,
    deviceCount: 3,
    tabsSynced:      true,
    bookmarksSynced: true,
    historySynced:   true,
    settingsSynced:  true,
  });
});

export default router;
