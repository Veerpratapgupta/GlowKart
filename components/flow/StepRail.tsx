import { NAV_STEPS, navIndexForStep, navLabelForIndex } from "@/lib/flow-steps";
import type { FlowStepId } from "@/lib/types";
import type { JourneyState } from "./journey";
import { canNavigate } from "./journey";

interface StepRailProps {
  state: JourneyState;
  onNavigate: (step: FlowStepId) => void;
  onStartOver: () => void;
}

export function StepRail({ state, onNavigate, onStartOver }: StepRailProps) {
  const activeIndex = navIndexForStep(state.step);

  return (
    <>
      <header className="border-b border-line bg-paper/95 px-5 py-4 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-xl font-medium tracking-[-0.02em]">
            GlowCart
          </span>
          {state.step !== "discover" ? (
            <button
              type="button"
              onClick={onStartOver}
              className="text-[0.85rem] text-stone-deep underline underline-offset-4 hover:text-ink"
            >
              Start over
            </button>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between text-[0.78rem] font-medium text-stone-deep">
          <p>Step {activeIndex} of {NAV_STEPS.length}</p>
          <p className="text-botanic">{navLabelForIndex(activeIndex)}</p>
        </div>
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={NAV_STEPS.length}
          aria-valuenow={activeIndex}
          aria-label={`Step ${activeIndex} of ${NAV_STEPS.length}: ${navLabelForIndex(activeIndex)}`}
        >
          <div
            className="h-full rounded-full bg-botanic transition-[width] duration-300"
            style={{ width: `${(activeIndex / NAV_STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-line bg-paper-deep/40 px-6 py-8 md:flex md:flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-display text-2xl font-medium tracking-[-0.03em]">
              GlowCart
            </span>
            <p className="mt-1 text-[0.8rem] text-stone-deep">
              Your beauty starting point
            </p>
          </div>
          <span
            aria-label="Recorded demo mode"
            className="mt-1 size-2 rounded-full bg-lip"
            title="Recorded demo mode"
          />
        </div>

        <div className="mt-8 border-y border-line py-3 text-[0.78rem] text-stone-deep">
          <div className="flex items-center justify-between gap-3">
            <span>Journey progress</span>
            <span className="font-medium text-ink">
              {activeIndex}/{NAV_STEPS.length}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-botanic transition-[width] duration-300"
              style={{ width: `${(activeIndex / NAV_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <nav aria-label="Journey steps" className="mt-8">
          <ol className="space-y-5">
            {NAV_STEPS.map((item) => {
              const isActive = item.index === activeIndex;
              const isAvailable = canNavigate(state, item.entryStep);

              return (
                <li key={item.index}>
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(item.entryStep)}
                      aria-current={isActive ? "step" : undefined}
                      className={`flex w-full items-baseline gap-3 text-left transition-colors duration-150 ${
                        isActive ? "text-ink" : "text-stone-deep hover:text-ink"
                      }`}
                    >
                      <StepMarker active={isActive} />
                      <span className="font-display text-lg leading-none font-medium">
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex w-full items-baseline gap-3 text-left text-stone"
                    >
                      <StepMarker active={false} locked />
                      <span className="font-display text-lg leading-none font-medium">
                        {item.label}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={onStartOver}
            className="text-[0.85rem] text-stone-deep underline underline-offset-4 hover:text-ink"
          >
            Start over
          </button>
        </div>
      </aside>
    </>
  );
}

function StepMarker({
  active,
  locked = false,
}: {
  active: boolean;
  locked?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 translate-y-[-1px] rounded-full border ${
        active
          ? "border-botanic bg-botanic"
          : locked
            ? "border-stone bg-transparent"
            : "border-botanic bg-transparent"
      }`}
    />
  );
}
