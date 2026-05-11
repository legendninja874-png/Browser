import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, aiMessagesTable, smartSuggestionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  SendAiMessageBody,
  GetConversationMessagesParams,
} from "@workspace/api-zod";

const router = Router();

router.post("/intelligence/chat", async (req, res) => {
  const body = SendAiMessageBody.parse(req.body);

  let conversationId = body.conversationId ?? null;

  if (!conversationId) {
    const title = body.content.slice(0, 60) + (body.content.length > 60 ? "..." : "");
    const [conv] = await db.insert(conversationsTable).values({ title }).returning();
    conversationId = conv.id;
  }

  await db.insert(aiMessagesTable).values({
    conversationId,
    role: "user",
    content: body.content,
  });

  const aiResponses = [
    "I've analyzed the current page content. Here's what I found: This appears to be a comprehensive resource with multiple sections covering the topic in depth.",
    "Based on your browsing history, I can see you're interested in this domain. Let me provide some context and related resources that might be helpful.",
    "I can help you with that. Here's a concise summary of the key points, along with my recommendations for next steps.",
    "Great question. From my analysis of the available information, there are three key considerations you should be aware of.",
    "I've processed your request using EoN Intelligence. The information you're looking for appears in multiple credible sources. Let me break it down for you.",
  ];
  const aiReply = aiResponses[Math.floor(Math.random() * aiResponses.length)];

  const [message] = await db.insert(aiMessagesTable).values({
    conversationId,
    role: "assistant",
    content: aiReply,
    model: "eon-intelligence-1",
  }).returning();

  await db.update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, conversationId));

  res.json(message);
});

router.get("/intelligence/conversations", async (req, res) => {
  const conversations = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt));
  const messages = await db.select().from(aiMessagesTable);
  const result = conversations.map(c => ({
    ...c,
    messageCount: messages.filter(m => m.conversationId === c.id).length,
  }));
  res.json(result);
});

router.get("/intelligence/conversations/:id/messages", async (req, res) => {
  const { id } = GetConversationMessagesParams.parse({ id: Number(req.params.id) });
  const messages = await db.select().from(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, id))
    .orderBy(aiMessagesTable.createdAt);
  res.json(messages);
});

router.get("/intelligence/suggestions", async (req, res) => {
  const suggestions = await db.select().from(smartSuggestionsTable).limit(8);
  res.json(suggestions);
});

export default router;
