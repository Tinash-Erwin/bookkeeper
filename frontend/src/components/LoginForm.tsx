import { useState, type ChangeEvent, type FormEvent } from "react";

type LoginFormProps = {
  onSubmit: (username: string, password: string) => void;
  error?: string | null;
  theme: "light" | "dark";
};

const BENEFITS = [
  "Automated cash flow modeling",
  "AI reconciliations for every upload",
  "Balance sheet + income statement previews"
];

export function LoginForm({ onSubmit, error, theme }: LoginFormProps) {
  const [username, setUsername] = useState("brenda");
  const [password, setPassword] = useState("admin123$");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(username.trim(), password);
  };

  const isDark = theme === "dark";
  const cardClasses = isDark
    ? "relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/40"
    : "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl";
  const labelClasses = isDark ? "text-slate-200" : "text-slate-700";
  const hintClasses = isDark ? "text-slate-400" : "text-slate-500";
  const inputClasses = isDark
    ? "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
    : "w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className={cardClasses}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span>Demo Access</span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase text-white">AI Enabled</span>
        </div>
        <h2 className="text-2xl font-semibold">Sign in to BrenKeeper</h2>
        <p className={`text-sm ${hintClasses}`}>
          Use the curated demo credentials to experience an AI-assisted bookkeeping workflow from upload to insight.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${labelClasses}`} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-medium ${labelClasses}`} htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className={inputClasses}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-sm font-medium text-primary hover:text-primary-dark"
              onClick={() => setShowPassword((state) => !state)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className={`flex items-center gap-2 ${hintClasses}`}>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary" />
            Remember me for this session
          </label>
          <button type="button" className="font-medium text-primary underline-offset-4 hover:underline">
            Request full access
          </button>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:bg-primary-dark"
        >
          Enter BrenKeeper
        </button>
      </form>

      <div className="mt-8 grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary">Why teams pick BrenKeeper</p>
        <ul className={`space-y-2 ${hintClasses}`}>
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="absolute bottom-8 left-0 right-0 px-6">
        <p className={`mx-auto max-w-6xl text-center text-xs ${hintClasses}`}>
          © 2025 GeoVal X. All rights reserved. BrenKeeper™ is a trademark of GeoVal X.
        </p>
      </footer>
    </div>
  );
}
