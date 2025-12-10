import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { Buffer } from "buffer";
import { config } from "../config.js";
import { CashflowSummary, RawTransaction } from "../types.js";

const CSV_MIME = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain"
]);

const EXCEL_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);

const PDF_MIME = new Set(["application/pdf"]);

export async function parseStatement(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<RawTransaction[]> {
  if (CSV_MIME.has(mimetype) || originalname.toLowerCase().endsWith(".csv")) {
    return parseCsvBuffer(buffer);
  }

  if (EXCEL_MIME.has(mimetype) || originalname.toLowerCase().endsWith(".xlsx")) {
    return parseXlsxBuffer(buffer);
  }

  if (PDF_MIME.has(mimetype) || originalname.toLowerCase().endsWith(".pdf")) {
    return parsePdfBuffer(buffer);
  }

  throw new Error("Unsupported file type. Please upload a CSV or XLSX bank statement.");
}

async function parsePdfBuffer(buffer: Buffer): Promise<RawTransaction[]> {
  const blob = new Blob([buffer], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", blob, "upload.pdf");

  const response = await fetch(`${config.PARSER_API_URL}/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Parser service failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { transactions: any[] };
  
  return (data.transactions || []).map((t: any) => ({
    date: t.date,
    description: t.description,
    amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
    category: t.category || "Uncategorized",
  }));
}

function parseCsvBuffer(buffer: Buffer): RawTransaction[] {
  const text = buffer.toString("utf-8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map(normalizeTransactionRecord).filter(Boolean) as RawTransaction[];
}

async function parseXlsxBuffer(buffer: Buffer): Promise<RawTransaction[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
    headers[colNumber - 1] = String(cell.value || "").toLowerCase();
  });

  const rows: RawTransaction[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber === 1) return;

    const record: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
      const header = headers[colNumber - 1] || `col_${colNumber}`;
      record[header] = cell.value;
    });

    const normalized = normalizeTransactionRecord(record);
    if (normalized) {
      rows.push(normalized);
    }
  });

  return rows;
}

function normalizeTransactionRecord(record: Record<string, unknown>): RawTransaction | null {
  const lowerCased = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value])
  );

  const dateCandidate = (lowerCased.date || lowerCased.posted_date || lowerCased.transaction_date) as
    | string
    | Date
    | undefined;
  const descriptionCandidate = (lowerCased.description || lowerCased.details || lowerCased.memo) as
    | string
    | undefined;

  const amountCandidate = inferAmount(lowerCased);

  if (!dateCandidate || !descriptionCandidate || amountCandidate === null) {
    return null;
  }

  const date = typeof dateCandidate === "string" ? dateCandidate : dateCandidate.toISOString();
  const description = String(descriptionCandidate).trim();

  return {
    date: date.split("T")[0],
    description,
    amount: amountCandidate,
    balance: typeof lowerCased.balance === "number" ? lowerCased.balance : undefined,
    category: inferCategory(description, amountCandidate)
  };
}

function inferAmount(record: Record<string, unknown>): number | null {
  const amountKeys = ["amount", "balance impact", "value", "transaction amount"];
  for (const key of amountKeys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(normalized)) return normalized;
    }
  }

  const debit = record.debit ?? record.withdrawal;
  const credit = record.credit ?? record.deposit;

  if (typeof debit === "number" && debit !== 0) return -Math.abs(debit);
  if (typeof credit === "number" && credit !== 0) return Math.abs(credit);

  if (typeof debit === "string" && debit.trim()) {
    const normalized = Number(debit.replace(/[^0-9.-]+/g, ""));
    if (!Number.isNaN(normalized)) return -Math.abs(normalized);
  }

  if (typeof credit === "string" && credit.trim()) {
    const normalized = Number(credit.replace(/[^0-9.-]+/g, ""));
    if (!Number.isNaN(normalized)) return Math.abs(normalized);
  }

  return null;
}

export function toCsv(transactions: RawTransaction[]): string {
  const header = "date,description,amount,balance,category";
  const rows = transactions.map((txn) =>
    [txn.date, escapeCsv(txn.description), txn.amount, txn.balance ?? "", txn.category ?? ""].join(",")
  );

  return [header, ...rows].join("\n");
}

export async function toWorkbookBase64(transactions: RawTransaction[]): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Transactions");

  worksheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Description", key: "description", width: 50 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Balance", key: "balance", width: 15 },
    { header: "Category", key: "category", width: 20 }
  ];

  worksheet.addRows(transactions);

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const nodeBuffer = Buffer.isBuffer(excelBuffer)
    ? excelBuffer
    : Buffer.from(excelBuffer as ArrayBufferLike);
  return nodeBuffer.toString("base64");
}

export function computeCashflow(transactions: RawTransaction[]): CashflowSummary {
  let inflows = 0;
  let outflows = 0;
  const byCategory: Record<string, number> = {};

  for (const txn of transactions) {
    if (txn.amount >= 0) {
      inflows += txn.amount;
    } else {
      outflows += Math.abs(txn.amount);
    }

    const category = txn.category ?? "Uncategorized";
    byCategory[category] = (byCategory[category] ?? 0) + txn.amount;
  }

  return {
    totalInflows: Number(inflows.toFixed(2)),
    totalOutflows: Number(outflows.toFixed(2)),
    netCashflow: Number((inflows - outflows).toFixed(2)),
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([key, value]) => [key, Number(value.toFixed(2))])
    )
  };
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function inferCategory(description: string, amount: number): string {
  const normalized = description.toLowerCase();

  if (normalized.includes("payroll") || normalized.includes("salary")) return "Payroll";
  if (normalized.includes("rent") || normalized.includes("lease")) return "Occupancy";
  if (normalized.includes("subscription") || normalized.includes("software")) return "Software";
  if (normalized.includes("utility") || normalized.includes("electric")) return "Utilities";
  if (normalized.includes("transfer")) return "Transfers";
  if (amount >= 0) return "Income";
  return "Expense";
}
