import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const downloadsTable = pgTable("downloads", {
  id:              serial("id").primaryKey(),
  filename:        text("filename").notNull(),
  url:             text("url").notNull(),
  status:          text("status").notNull().default("pending"),
  sizeBytes:       real("size_bytes"),
  downloadedBytes: real("downloaded_bytes").notNull().default(0),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
});

export const insertDownloadSchema = createInsertSchema(downloadsTable).omit({ id: true, createdAt: true, downloadedBytes: true, status: true });
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloadsTable.$inferSelect;
