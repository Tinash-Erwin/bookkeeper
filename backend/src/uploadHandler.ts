import type { Request, Response } from "express";
import { summarizeCashflow } from "./services/openaiService.js";
import {
  computeCashflow,
  parseStatement,
  toCsv,
  toWorkbookBase64
} from "./services/statementService.js";
import type { UploadResponse } from "./types.js";
import { logger } from "./utils/logger.js";

export async function handleUpload(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded. Please attach a bank statement." });
  }

  try {
    const transactions = await parseStatement(file.buffer, file.mimetype, file.originalname);
    const cashflow = computeCashflow(transactions);
    const csvContent = toCsv(transactions);
    const workbookBase64 = await toWorkbookBase64(transactions);

    const aiNarrative = await summarizeCashflow(transactions, cashflow);

    const payload: UploadResponse = {
      transactions,
      cashflow,
      csvContent,
      workbookBase64,
      aiNarrative
    };

    return res.json(payload);
  } catch (error) {
    logger.error({ err: error }, "Failed to process uploaded statement");

    return res.status(422).json({
      error: error instanceof Error ? error.message : "Failed to process statement"
    });
  }
}
