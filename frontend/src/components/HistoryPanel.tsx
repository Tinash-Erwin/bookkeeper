import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { HistoryItem, UploadPayload } from "../types";

type HistoryPanelProps = {
  history: HistoryItem[];

  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  theme: "light" | "dark";
};

export function HistoryPanel({ history, onSelect, onDelete, theme }: HistoryPanelProps) {
  const isDark = theme === "dark";
  const panelClasses = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl"
    : "rounded-2xl border border-slate-200 bg-white shadow-xl";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const hoverBg = isDark ? "hover:bg-slate-800" : "hover:bg-slate-50";

  if (history.length === 0) {
    return (
      <div className={`${panelClasses} p-8 text-center`}>
        <p className={mutedText}>No history available yet.</p>
      </div>
    );
  }

  return (
    <div className={panelClasses}>
      <div className={`border-b px-6 py-4 ${borderColor}`}>
        <h2 className="text-lg font-semibold">Transaction History</h2>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {history.map((item) => (
          <div key={item.id} className={`flex items-center justify-between px-6 py-4 transition ${hoverBg}`}>
            <div className="cursor-pointer" onClick={() => onSelect(item)}>
              <p className="font-medium">{item.filename}</p>
              <p className={`text-xs ${mutedText}`}>{new Date(item.timestamp).toLocaleString()}</p>
              <p className={`text-xs ${mutedText}`}>
                {item.data.transactions.length} transactions • {formatCurrency(item.data.cashflow.netCashflow)} Net
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect(item)}
                className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
                title="Load"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
  }).format(value);
}
