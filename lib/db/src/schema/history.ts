import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const historyTable = pgTable("history", {
  id:         serial("id").primaryKey(),
  title:      text("title").notNull(),
  url:        text("url").notNull(),
  favicon:    text("favicon"),
  visitCount: integer("visit_count").notNull().default(1),
  visitedAt:  timestamp("visited_at").notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true, visitedAt: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type HistoryEntry = typeof historyTable.$inferSelect;
