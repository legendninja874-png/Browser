import { pgTable, serial, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const tabsTable = pgTable("tabs", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull().default("New Tab"),
  url:         text("url").notNull().default(""),
  favicon:     text("favicon"),
  workspaceId: integer("workspace_id").references(() => workspacesTable.id, { onDelete: "set null" }),
  groupId:     integer("group_id"),
  groupName:   text("group_name"),
  groupColor:  text("group_color"),
  isActive:    boolean("is_active").notNull().default(false),
  isSleeping:  boolean("is_sleeping").notNull().default(false),
  isPinned:    boolean("is_pinned").notNull().default(false),
  isIncognito: boolean("is_incognito").notNull().default(false),
  memoryMb:    real("memory_mb"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const insertTabSchema = createInsertSchema(tabsTable).omit({ id: true, createdAt: true });
export type InsertTab = z.infer<typeof insertTabSchema>;
export type Tab = typeof tabsTable.$inferSelect;
