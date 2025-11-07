import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftOnRectangleIcon,
  ArrowUpTrayIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { ChatPanel } from "./components/ChatPanel";
import { LoginForm } from "./components/LoginForm";
import { UploadPanel } from "./components/UploadPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import type { UploadPayload } from "./types";

type ThemeVariant = "light" | "dark";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type NavigationItem = {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
};

const DEMO_USERNAME = "brenda";
const DEMO_PASSWORD = "admin123$";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const SAMPLE_STATEMENT_URL = "/demo-bank-statement.csv";

const NAV_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { id: "cashflow", label: "Cash Flow", icon: ArrowUpTrayIcon },
  { id: "balance-sheet", label: "Balance Sheet", icon: BanknotesIcon, badge: "Beta" },
  { id: "income-statement", label: "Income Statement", icon: PresentationChartLineIcon, badge: "Beta" },
  { id: "automation", label: "Automations", icon: SparklesIcon },
  { id: "exports", label: "Exports", icon: DocumentArrowDownIcon },
  { id: "variance", label: "Variance Reports", icon: DocumentChartBarIcon },
  { id: "settings", label: "Settings", icon: Cog6ToothIcon }
];

const MARKETING_POINTS = [
  "Automated cash flow statements from raw bank activity",
  "Income & balance sheet previews without touching a spreadsheet",
  "AI chat that explains anomalies and variances in plain language"
];

function App() {
  const [theme, setTheme] = useState<ThemeVariant>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("brenkeeper-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const [activeNav, setActiveNav] = useState<string>(NAV_ITEMS[0]?.id ?? "dashboard");
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadPayload | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("brenkeeper-theme", theme);
    }
  }, [theme]);

  const cashflowHighlights = useMemo(() => {
    if (!uploadResult) return null;
    const { cashflow } = uploadResult;
    return [
      { label: "Total Inflows", value: cashflow.totalInflows, tone: "text-emerald-500" },
      { label: "Total Outflows", value: cashflow.totalOutflows * -1, tone: "text-rose-500" },
      {
        label: "Net Cashflow",
        value: cashflow.netCashflow,
        tone: cashflow.netCashflow >= 0 ? "text-emerald-500" : "text-rose-500"
      }
    ];
  }, [uploadResult]);

  const handleLogin = (username: string, password: string) => {
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setAuthenticated(true);
      setError(null);
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Hi Brenda! Upload a bank statement to build cash flow, balance sheet, and income statement previews. Ask me anything along the way."
          }
        ]);
      }
    } else {
      setError("Incorrect credentials. Try brenda / admin123$.");
    }
  };

  const processFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("statement", file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.error || "Upload failed");
      }

      const payload = (await response.json()) as UploadPayload;
      setUploadResult(payload);

      if (payload.aiNarrative) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.aiNarrative
        };
        setChatMessages((current) => [...current, aiMessage]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (file: File) => {
    await processFileUpload(file);
  };

  const handleUseSample = async () => {
    try {
      const response = await fetch(SAMPLE_STATEMENT_URL);
      if (!response.ok) {
        throw new Error("Unable to load the sample statement");
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], "demo-bank-statement.csv", { type: blob.type || "text/csv" });
      await processFileUpload(sampleFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load the sample statement";
      setError(message);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim()
    };

    setChatMessages((current) => [...current, userMessage]);
    setSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: [...chatMessages, userMessage].map((msg) => `${msg.role}: ${msg.content}`) })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Assistant unavailable");
      }

      const data = (await response.json()) as { reply: string };
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply
      };
      setChatMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Assistant unavailable";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = (type: "csv" | "xlsx") => {
    if (!uploadResult) return;

    if (type === "csv") {
      const blob = new Blob([uploadResult.csvContent], { type: "text/csv" });
      triggerDownload(blob, "brenkeeper-transactions.csv");
    } else {
      const byteCharacters = atob(uploadResult.workbookBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      triggerDownload(blob, "brenkeeper-transactions.xlsx");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUploadResult(null);
    setChatMessages([]);
    setActiveNav(NAV_ITEMS[0]?.id ?? "dashboard");
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";
  const backgroundClass = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  const sidebarBackground = isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200";
  const sidebarText = isDark ? "text-slate-300" : "text-slate-500";
  const headerBorder = isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white/80";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  if (!isAuthenticated) {
    return (
      <div className={`${backgroundClass} relative min-h-screen`}> 
        <div className="absolute right-6 top-6">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div className="space-y-8">
            <LogoHeader theme={theme} />
            <div className={`rounded-3xl border px-8 py-10 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI bookkeeping workspace</p>
              <h2 className="mt-4 text-3xl font-semibold lg:text-4xl">
                Upload statements, reconcile cash, and review financials in minutes.
              </h2>
              <ul className={`mt-6 space-y-4 text-sm ${mutedText}`}>
                {MARKETING_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">★</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-5 text-sm ${isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-xs uppercase tracking-wide text-primary">Median prep time</p>
                  <p className="mt-2 text-2xl font-semibold">&lt; 60 sec</p>
                  <p className={`mt-1 text-xs ${mutedText}`}>from upload to cash flow output</p>
                </div>
                <div className={`rounded-2xl border px-4 py-5 text-sm ${isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-xs uppercase tracking-wide text-primary">Statements supported</p>
                  <p className="mt-2 text-2xl font-semibold">Cash • BS • P&amp;L</p>
                  <p className={`mt-1 text-xs ${mutedText}`}>Automated previews with AI validation</p>
                </div>
              </div>
            </div>
          </div>
          <LoginForm onSubmit={handleLogin} error={error} theme={theme} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${backgroundClass} min-h-screen`}> 
      <div className="flex min-h-screen">
        <aside className={`hidden w-72 flex-col justify-between border-r px-4 py-6 lg:flex ${sidebarBackground}`}>
          <div>
            <LogoHeader theme={theme} />
            <p className={`mt-4 text-sm ${sidebarText}`}>Your unified AI accounting desk.</p>
            <nav className="mt-6 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : isDark
                        ? "text-slate-300 hover:bg-slate-800/80"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className={`mt-8 rounded-2xl p-4 ${isDark ? "bg-slate-800/60" : "bg-slate-100"}`}>
            <p className="text-sm font-semibold">Need a walkthrough?</p>
            <p className={`mt-1 text-xs ${sidebarText}`}>
              Book time with an AI bookkeeping coach to tailor charts of accounts and automations.
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              Book a live demo
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/30 bg-transparent px-3 py-2 text-sm text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className={`border-b backdrop-blur ${headerBorder}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3 lg:hidden">
                <LogoHeader theme={theme} compact />
                <span className={`text-xs font-medium ${mutedText}`}>Active: {NAV_ITEMS.find((item) => item.id === activeNav)?.label}</span>
              </div>
              <div className="hidden items-center gap-2 text-sm lg:flex">
                {NAV_ITEMS.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : isDark
                          ? "text-slate-300 hover:bg-slate-800/80"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full border border-slate-700/30 bg-transparent px-3 py-2 text-sm text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-8">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <UploadPanel
                onUpload={handleUpload}
                isUploading={isUploading}
                result={uploadResult}
                highlights={cashflowHighlights}
                onDownload={handleDownload}
                error={error}
                onUseSample={handleUseSample}
                theme={theme}
              />
              <ChatPanel messages={chatMessages} onSend={handleSendMessage} isSending={isSending} theme={theme} />
            </div>
            <InsightsPanel result={uploadResult} theme={theme} />
            <section className={`rounded-2xl border px-6 py-5 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Roadmap</h3>
                  <p className={`text-sm ${mutedText}`}>
                    Coming soon: multi-entity consolidations, GL sync, automated approvals, and payroll matching.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/20"
                >
                  Follow updates
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function LogoHeader({ compact = false, theme }: { compact?: boolean; theme: ThemeVariant }) {
  const isDark = theme === "dark";
  const titleClass = isDark ? "text-slate-50" : "text-slate-900";
  const captionClass = isDark ? "text-slate-400" : "text-slate-500";
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <ArrowUpTrayIcon className="h-6 w-6" />
      </div>
      <div className="space-y-0.5">
        <h1 className={`font-semibold ${compact ? "text-xl" : "text-2xl"} ${titleClass}`}>BrenKeeper</h1>
        {!compact && <p className={`text-sm ${captionClass}`}>AI cash flow bookkeeping for modern finance teams</p>}
      </div>
    </div>
  );
}
