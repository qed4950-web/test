import clsx from "clsx";

type NoticeTone = "info" | "success" | "warning" | "error";

type InlineNoticeProps = {
  tone?: NoticeTone;
  message: string;
  onClose?: () => void;
};

const toneStyles: Record<NoticeTone, { wrapper: string; badge: string; text: string; close: string }> = {
  info: {
    wrapper: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-800",
    close: "text-blue-400 hover:text-blue-600"
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "text-emerald-800",
    close: "text-emerald-400 hover:text-emerald-600"
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-800",
    close: "text-amber-400 hover:text-amber-600"
  },
  error: {
    wrapper: "border-rose-200 bg-rose-50",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    text: "text-rose-800",
    close: "text-rose-400 hover:text-rose-600"
  },
};

export default function InlineNotice({ tone = "info", message, onClose }: InlineNoticeProps) {
  if (!message) return null;
  const styles = toneStyles[tone];

  return (
    <div className={clsx("mb-4 border rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-3 shadow-sm", styles.wrapper)}>
      <div className="flex items-center gap-3">
        <span className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", styles.badge)}>
          {tone}
        </span>
        <span className={clsx("font-medium", styles.text)}>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className={clsx("text-xs font-bold transition-colors", styles.close)}>
          ✕ 닫기
        </button>
      )}
    </div>
  );
}
