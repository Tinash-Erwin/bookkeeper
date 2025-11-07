import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
        isDark
          ? "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-primary/40"
          : "border-slate-300 bg-white text-slate-700 hover:border-primary/50"
      }`}
      aria-pressed={isDark}
    >
      {isDark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
      <span>{isDark ? "Dark" : "Light"} mode</span>
    </button>
  );
}
