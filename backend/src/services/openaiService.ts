import OpenAI from "openai";
import { config } from "../config.js";
import { CashflowSummary, RawTransaction } from "../types.js";
import { logger } from "../utils/logger.js";

const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function summarizeCashflow(
  transactions: RawTransaction[],
  cashflow: CashflowSummary
): Promise<string> {
  const input = buildCashflowPrompt(transactions, cashflow);

  try {
    const response = await client.responses.create({
      model: config.OPENAI_MODEL,
      input,
      temperature: 0.3
    });

    const text = response.output_text || "";
    return text.trim() || "No AI summary available.";
  } catch (error) {
    logger.error({ error }, "Failed to request cashflow summary");
    return "AI summary unavailable. Please review the cash flow metrics manually.";
  }
}

export async function chatWithAssistant(history: string[]): Promise<string> {
  const input = [
    {
      role: "system" as const,
      content:
        "You are BrenKeeper, an AI bookkeeper that explains cash flow statements and bookkeeping concepts in clear, actionable language."
    },
    {
      role: "user" as const,
      content: history.join("\n\n")
    }
  ];

  try {
    const response = await client.responses.create({
      model: config.OPENAI_MODEL,
      input,
      temperature: 0.4
    });

    return response.output_text?.trim() || "No response available.";
  } catch (error) {
    logger.error({ error }, "Failed to chat with assistant");
    return "Sorry, the AI assistant is unavailable right now.";
  }
}

function buildCashflowPrompt(transactions: RawTransaction[], cashflow: CashflowSummary) {
  const transactionPreview = transactions
    .slice(0, 20)
    .map(
      (txn) =>
        `${txn.date} | ${txn.description} | ${txn.amount.toFixed(2)}${txn.category ? ` | ${txn.category}` : ""}`
    )
    .join("\n");

  return `Generate a concise bookkeeping summary using the cashflow metrics and sample transactions below.
Return clear, non-technical language, highlight trends, and flag potential follow-ups.

Cashflow Metrics:
- Total inflows: ${cashflow.totalInflows.toFixed(2)}
- Total outflows: ${cashflow.totalOutflows.toFixed(2)}
- Net cashflow: ${cashflow.netCashflow.toFixed(2)}
- Category breakdown: ${JSON.stringify(cashflow.byCategory)}

Sample transactions (first 20):
${transactionPreview}`;
}
