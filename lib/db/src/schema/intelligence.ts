import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversationsTable = pgTable("conversations", {
  id:        serial("id").primaryKey(),
  title:     text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiMessagesTable = pgTable("ai_messages", {
  id:             serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  role:           text("role").notNull(),
  content:        text("content").notNull(),
  model:          text("model"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const smartSuggestionsTable = pgTable("smart_suggestions", {
  id:      serial("id").primaryKey(),
  type:    text("type").notNull().default("visit"),
  title:   text("title").notNull(),
  url:     text("url").notNull(),
  reason:  text("reason").notNull(),
  favicon: text("favicon"),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiMessageSchema   = createInsertSchema(aiMessagesTable).omit({ id: true, createdAt: true });
export const insertSuggestionSchema  = createInsertSchema(smartSuggestionsTable).omit({ id: true });

export type InsertConversation   = z.infer<typeof insertConversationSchema>;
export type InsertAiMessage      = z.infer<typeof insertAiMessageSchema>;
export type Conversation         = typeof conversationsTable.$inferSelect;
export type AiMessage            = typeof aiMessagesTable.$inferSelect;
export type SmartSuggestion      = typeof smartSuggestionsTable.$inferSelect;
