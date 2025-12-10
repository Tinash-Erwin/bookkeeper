import { useRef, type ChangeEvent } from "react";
import type { UploadPayload } from "../types";

type Highlight = {
  label: string;
  value: number;
  tone: string;
};

type UploadPanelProps = {
  onUpload: (file: File) => Promise<void> | void;
  isUploading: boolean;
  uploadProgress?: number;
  statusMessage?: string;
  result: UploadPayload | null;
  highlights: Highlight[] | null;
  onDownload: (type: "csv" | "xlsx") => void;
  error: string | null;
  onUseSample?: () => void;
  theme: "light" | "dark";
};

export function UploadPanel({
  onUpload,
  isUploading,
  uploadProgress = 0,
  statusMessage = "",
  result,
  highlights,
  onDownload,
  error,
  onUseSample,
  theme
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUpload(file);
      event.target.value = "";
    }
  };

  const isDark = theme === "dark";
  const panelClasses = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40"
    : "rounded-2xl border border-slate-200 bg-white shadow-xl";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const subtleBg = isDark ? "bg-slate-900/80" : "bg-slate-100";
  const highlightCard = isDark
    ? "rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    : "rounded-xl border border-slate-200 bg-slate-50 p-4";
  const tableHeader = isDark ? "bg-slate-900/80" : "bg-slate-100";
  const tableDivider = isDark ? "divide-slate-800" : "divide-slate-200";
  const csvButton = isDark
    ? "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary hover:text-primary"
    : "rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary";
  const aiCard = isDark
    ? "rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-slate-100"
    : "rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm text-slate-900";

  return (
    <section className={panelClasses}>
      <div className={`border-b px-6 py-4 ${borderColor}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">PDF to Excel Converter</h2>
            <p className={`text-sm ${mutedText}`}>
              Upload a PDF bank statement to convert it to Excel.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className={`rounded-xl border border-dashed p-6 text-center ${isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-300 bg-slate-50"}`}>
          <p className={`text-sm ${mutedText}`}>Drag & drop your bank statement or browse files</p>
          <button
            type="button"
            onClick={handleSelectFile}
            className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
            disabled={isUploading}
          >
            {isUploading ? "Processing..." : "Choose File"}
          </button>

          {isUploading && (
            <div className="mt-6 w-full max-w-xs mx-auto">
              <div className="mb-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{statusMessage || "Uploading..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className={`mt-4 flex flex-wrap items-center justify-center gap-3 text-xs ${mutedText}`}>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onUseSample?.()}
              disabled={!onUseSample}
            >
              Use sample statement
            </button>
            <span>or</span>
            <span>Upload monthly exports to reconcile cash</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        {highlights && (
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className={highlightCard}>
                <p className={`text-xs uppercase tracking-wide ${mutedText}`}>{item.label}</p>
                <p className={`mt-2 text-xl font-semibold ${item.tone}`}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onDownload("xlsx")}
                className="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-emerald-500/30"
              >
                Download Excel Report
              </button>
            </div>
            
            <div className={`overflow-hidden rounded-xl border ${borderColor}`}>
              <table className={`min-w-full divide-y ${tableDivider} text-sm`}> 
                <thead className={tableHeader}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-300">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-300">Category</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableDivider} ${isDark ? "bg-slate-950/40" : "bg-white"}`}>
                  {result.transactions.slice(0, 12).map((transaction) => (
                    <tr key={`${transaction.date}-${transaction.description}-${transaction.amount}`}>
                      <td className={`px-4 py-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{transaction.date}</td>
                      <td className={`px-4 py-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{transaction.description}</td>
                      <td
                        className={`px-4 py-3 text-right ${
                          transaction.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className={`px-4 py-3 text-right ${mutedText}`}>{transaction.category ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.transactions.length > 12 && (
                <div className={`border-t px-4 py-3 text-xs ${mutedText} ${borderColor} ${subtleBg}`}>
                  Showing first 12 of {result.transactions.length} transactions.
                </div>
              )}
            </div>

            {result.aiNarrative && (
              <div className={aiCard}>
                <p className="font-semibold text-primary">AI Insights</p>
                <p className={`mt-2 whitespace-pre-line ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {result.aiNarrative}
                </p>
              </div>
            )}
          </div>
        )}
        {!result && (
          <div className={`grid gap-3 rounded-xl border ${borderColor} ${subtleBg} p-4 text-sm ${mutedText}`}>
            <p className="font-semibold text-slate-500 dark:text-slate-200">No statements uploaded yet</p>
            <p>Start with your latest bank export or upload the provided demo file to unlock balance sheet previews.</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Multi-entity support</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500">Auto-categorisation</span>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-500">Variance alerts</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}
