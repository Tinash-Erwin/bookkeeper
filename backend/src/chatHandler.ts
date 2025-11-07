import type { Request, Response } from "express";
import { chatWithAssistant } from "./services/openaiService.js";
import { logger } from "./utils/logger.js";

export async function handleChat(req: Request, res: Response) {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const normalizedHistory = messages.map((message: unknown) => String(message));

  try {
    const reply = await chatWithAssistant(normalizedHistory);
    return res.json({ reply });
  } catch (error) {
    logger.error({ err: error }, "Chat handler failed");
    return res.status(500).json({ error: "Failed to reach the AI assistant" });
  }
}
