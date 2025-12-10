export interface Transaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  category?: string;
}

export interface CashflowSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashflow: number;
  byCategory: Record<string, number>;
}

export interface UploadPayload {
  transactions: Transaction[];
  csvContent: string;
  workbookBase64: string;
  cashflow: CashflowSummary;
  aiNarrative?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  filename: string;
  data: UploadPayload;
}
