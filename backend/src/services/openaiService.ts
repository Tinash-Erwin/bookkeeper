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
    const response = await client.chat.completions.create({
      model: config.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: input }],
      temperature: 0.3
    });

    const text = response.choices[0]?.message?.content || "";
    return text.trim() || "No AI summary available.";
  } catch (error) {
    logger.error({ error }, "Failed to request cashflow summary");
    return "AI summary unavailable. Please review the cash flow metrics manually.";
  }
}

export async function chatWithAssistant(history: string[]): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content:
        "You are BrenKeeper, an AI bookkeeper that explains cash flow statements and bookkeeping concepts in clear, actionable language."
    },
    ...history.map(msg => {
      // Simple heuristic to split "role: content" strings if that's how they are stored
      // But looking at App.tsx, it sends "role: content" strings.
      // Ideally we should parse them or change the API contract.
      // For now, let's assume the frontend sends "role: content" strings.
      const match = msg.match(/^(user|assistant): (.*)$/s);
      if (match) {
        return { role: match[1] as "user" | "assistant", content: match[2] };
      }
      return { role: "user" as const, content: msg };
    })
  ];

  try {
    const response = await client.chat.completions.create({
      model: config.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.4
    });

    return response.choices[0]?.message?.content?.trim() || "No response available.";
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
