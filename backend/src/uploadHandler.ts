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
import fs from "fs";
import path from "path";
import { Buffer } from "buffer";
import process from "process";

export async function handleUpload(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded. Please attach a bank statement." });
  }

  try {
    // Create audit directory
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const uploadDir = path.join(process.cwd(), "uploads", dateStr);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save original file
    const originalExt = path.extname(file.originalname);
    const originalFilename = `${timestamp}_original${originalExt}`;
    const originalPath = path.join(uploadDir, originalFilename);
    fs.writeFileSync(originalPath, file.buffer);

    const transactions = await parseStatement(file.buffer, file.mimetype, file.originalname);
    const cashflow = computeCashflow(transactions);
    const csvContent = toCsv(transactions);
    const workbookBase64 = await toWorkbookBase64(transactions);

    // Save generated Excel for auditing
    const excelFilename = `${timestamp}_converted.xlsx`;
    const excelPath = path.join(uploadDir, excelFilename);
    const excelBuffer = Buffer.from(workbookBase64, 'base64');
    fs.writeFileSync(excelPath, excelBuffer);

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
