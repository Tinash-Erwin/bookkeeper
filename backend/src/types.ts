export interface RawTransaction {
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

export interface UploadResponse {
  transactions: RawTransaction[];
  csvContent: string;
  workbookBase64: string;
  cashflow: CashflowSummary;
  aiNarrative?: string;
}
