import type { ReactNode } from "react";

interface StepShellProps {
  title: string;
  lede?: string;
  meta?: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

export function StepShell({
  title,
  lede,
  meta,
  children,
  actions,
  onBack,
  backLabel = "Back",
}: StepShellProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 mb-8 inline-flex items-center gap-2 text-[0.9rem] text-stone-deep underline underline-offset-4 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </button>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-14">
        <div>
          {meta ? <div className="mb-4">{meta}</div> : null}
          <h2 className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.08] font-medium">
            {title}
          </h2>
          {lede ? (
            <p className="mt-4 max-w-[46ch] text-[1.02rem] leading-relaxed text-stone-deep">
              {lede}
            </p>
          ) : null}
        </div>
        <div>{children}</div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">{actions}</div>
    </div>
  );
}
