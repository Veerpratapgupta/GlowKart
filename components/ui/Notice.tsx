import type { ReactNode } from "react";

interface NoticeProps {
  tone: "error" | "info";
  title?: string;
  alert?: boolean;
  children: ReactNode;
}

const toneClasses: Record<NoticeProps["tone"], string> = {
  error: "border-lip-deep bg-lip-tint text-ink",
  info: "border-botanic bg-botanic-tint text-ink",
};

export function Notice({ tone, title, alert = false, children }: NoticeProps) {
  return (
    <div
      role={alert ? "alert" : undefined}
      className={`border-l-4 px-4 py-3 text-[0.92rem] leading-relaxed ${toneClasses[tone]}`}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
