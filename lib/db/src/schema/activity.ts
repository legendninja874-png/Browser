import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTable = pgTable("activity", {
  id:          serial("id").primaryKey(),
  type:        text("type").notNull(),
  title:       text("title").notNull(),
  description: text("description").notNull(),
  url:         text("url"),
  timestamp:   timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, timestamp: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ActivityItem = typeof activityTable.$inferSelect;
