import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import type { UploadPayload } from "../types";

type InsightsPanelProps = {
  result: UploadPayload | null;
  theme: "light" | "dark";
};

const ROADMAP = [
  "Direct + indirect cash flow reconciliation",
  "Automated variance alerts by vendor and category",
  "ERP sync for approved journal entries"
];

const QUICK_ACTIONS = [
  { label: "Export Balance Sheet (beta)", disabled: true },
  { label: "Run variance analysis", disabled: true },
  { label: "Schedule weekly digest", disabled: true }
];

export function InsightsPanel({ result, theme }: InsightsPanelProps) {
  const isDark = theme === "dark";
  const cardBase = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900/60"
    : "rounded-2xl border border-slate-200 bg-white";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const quickActionClass = isDark
    ? "flex w-full items-center justify-between rounded-lg border border-slate-700/40 bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-800/60 disabled:text-slate-600"
    : "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300";

  if (!result) {
    return (
      <section className={`${cardBase} px-6 py-6`}>
        <h2 className="text-lg font-semibold">Financial views</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Upload a statement to auto-build cash flow, balance sheet, and income statement previews with narrative support.
        </p>
        <ul className={`mt-4 space-y-2 text-sm ${mutedText}`}>
          <li>• Balance sheet snapshot with cash on hand & working capital</li>
          <li>• Income statement with revenue, expenses, and operating margin</li>
          <li>• Category insights ranked by impact to cash flow</li>
        </ul>
      </section>
    );
  }

  const inflows = result.transactions
    .filter((txn) => txn.amount >= 0)
    .reduce((total, txn) => total + txn.amount, 0);
  const outflows = result.transactions
    .filter((txn) => txn.amount < 0)
    .reduce((total, txn) => total + Math.abs(txn.amount), 0);
  const closingBalance = (() => {
    const withBalance = [...result.transactions].reverse().find((txn) => typeof txn.balance === "number");
    if (withBalance && typeof withBalance.balance === "number") {
      return withBalance.balance;
    }
    return Number((inflows - outflows).toFixed(2));
  })();

  const uniqueDays = new Set(result.transactions.map((txn) => txn.date)).size || 1;
  const avgDailyBurn = outflows / uniqueDays;
  const runwayMonths = avgDailyBurn > 0 ? (closingBalance / avgDailyBurn) / 30 : Infinity;

  const topCategories = Object.entries(result.cashflow.byCategory)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5);
  const categoryTotal = topCategories.reduce((total, [, amount]) => total + Math.abs(amount), 0) || 1;

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className={`${cardBase} lg:col-span-2 px-6 py-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Statement previews</h2>
            <p className={`text-sm ${mutedText}`}>
              Automated metrics derived from the uploaded bank activity.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            AI generated
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Closing cash"
            value={formatCurrency(closingBalance)}
            tone="text-emerald-500"
            subtitle={`Runway ≈ ${runwayMonths === Infinity ? "∞" : runwayMonths.toFixed(1)} months`}
            isDark={isDark}
          />
          <MetricCard
            label="Total inflows"
            value={formatCurrency(inflows)}
            tone="text-emerald-500"
            subtitle={`${uniqueDays} day range`}
            isDark={isDark}
          />
          <MetricCard
            label="Total outflows"
            value={formatCurrency(outflows * -1)}
            tone="text-rose-500"
            subtitle={`Avg burn ${formatCurrency(avgDailyBurn * -1)}/day`}
            isDark={isDark}
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Category impact</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {topCategories.map(([category, amount]) => {
                const share = Math.min(Math.abs(amount) / categoryTotal, 1);
                return (
                  <li key={category}>
                    <div className="flex items-center justify-between">
                      <span>{category}</span>
                      <span className={amount >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                      <div
                        className={`${amount >= 0 ? "bg-emerald-500/60" : "bg-rose-500/60"} h-full`}
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Cash Flow Statement</h3>
            <div className={`mt-3 rounded-xl border ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
              <div className="p-4">
                <h4 className={`text-xs font-semibold uppercase ${mutedText}`}>Operating Activities</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex justify-between font-medium">
                    <span>Cash Inflows</span>
                    <span className="text-emerald-500">{formatCurrency(inflows)}</span>
                  </li>
                  {Object.entries(result.cashflow.byCategory)
                    .filter(([, amount]) => amount > 0)
                    .map(([category, amount]) => (
                      <li key={category} className={`flex justify-between pl-4 text-xs ${mutedText}`}>
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </li>
                    ))}
                  
                  <li className="flex justify-between font-medium mt-4">
                    <span>Cash Outflows</span>
                    <span className="text-rose-500">{formatCurrency(outflows * -1)}</span>
                  </li>
                  {Object.entries(result.cashflow.byCategory)
                    .filter(([, amount]) => amount < 0)
                    .map(([category, amount]) => (
                      <li key={category} className={`flex justify-between pl-4 text-xs ${mutedText}`}>
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </li>
                    ))}
                </ul>
              </div>
              <div className={`border-t p-4 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-100"}`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Net Cash Flow</span>
                  <span className={result.cashflow.netCashflow >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {formatCurrency(result.cashflow.netCashflow)}
                  </span>
                </div>
              </div>
            </div>

            {result.aiNarrative && (
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${isDark ? "border-primary/30 bg-primary/10" : "border-primary/20 bg-primary/5"}`}>
                <p className="text-xs uppercase tracking-wide text-primary font-bold">AI Analysis</p>
                <p className={`mt-2 whitespace-pre-line ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {result.aiNarrative}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardBase} px-6 py-6`}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Next steps</h3>
        <ul className={`mt-3 space-y-3 text-sm ${mutedText}`}>
          {ROADMAP.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className={`mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-primary ${isDark ? "bg-primary/20" : "bg-primary/15"}`}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              className={quickActionClass}
            >
              {action.label}
              <AdjustmentsHorizontalIcon className={isDark ? "h-4 w-4 text-slate-400" : "h-4 w-4 text-slate-500"} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
  }).format(value);
}

function MetricCard({
  label,
  value,
  tone,
  subtitle,
  isDark
}: {
  label: string;
  value: string;
  tone: string;
  subtitle?: string;
  isDark: boolean;
}) {
  const cardClass = isDark
    ? "rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-5 text-sm text-slate-100"
    : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-700";
  const labelClass = isDark ? "text-slate-400" : "text-slate-500";
  const subtitleClass = isDark ? "text-slate-400" : "text-slate-500";
  return (
    <div className={cardClass}>
      <p className={`text-xs uppercase tracking-wide ${labelClass}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
      {subtitle && <p className={`mt-2 text-xs ${subtitleClass}`}>{subtitle}</p>}
    </div>
  );
}
