import { useState, type ChangeEvent, type FormEvent } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isSending: boolean;
  theme: "light" | "dark";
};

export function ChatPanel({ messages, onSend, isSending, theme }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend(draft);
    setDraft("");
  };

  const isDark = theme === "dark";
  const containerClasses = isDark
    ? "flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60"
    : "flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl";
  const headerBorder = isDark ? "border-slate-800" : "border-slate-200";
  const subtitleClasses = isDark ? "text-slate-400" : "text-slate-500";
  const footerBorder = isDark ? "border-slate-800" : "border-slate-200";
  const textareaClasses = isDark
    ? "min-h-[48px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
    : "min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <section className={containerClasses}>
      <header className={`border-b px-6 py-4 ${headerBorder}`}>
        <h2 className="text-lg font-semibold">AI Bookkeeper</h2>
        <p className={`text-sm ${subtitleClasses}`}>
          Ask financial questions, generate quick narratives, or validate ledger balances.
        </p>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
              message.role === "assistant"
                ? isDark
                  ? "bg-primary/15 text-slate-100"
                  : "bg-primary/10 text-slate-900"
                : isDark
                ? "ml-auto bg-slate-800 text-slate-100"
                : "ml-auto bg-slate-100 text-slate-900"
            }`}
          >
            <p className="whitespace-pre-line">{message.content}</p>
          </article>
        ))}
      </div>
      <footer className={`border-t p-4 ${footerBorder}`}>
        <form className="flex gap-3" onSubmit={handleSubmit}>
          <textarea
            className={textareaClasses}
            placeholder="E.g. Build a weekly direct-indirect cash flow summary..."
            value={draft}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSending ? "Sending" : "Send"}
          </button>
        </form>
      </footer>
    </section>
  );
}
