import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import type { SkinSnapshot } from "@/lib/types";
import { StepShell } from "./StepShell";

interface SnapshotStepProps {
  selfieUrl: string | null;
  snapshot: SkinSnapshot;
  onContinue: () => void;
  onBack: () => void;
}

export function SnapshotStep({
  selfieUrl,
  snapshot,
  onContinue,
  onBack,
}: SnapshotStepProps) {
  return (
    <StepShell
      title="Here’s what we noticed"
      lede="A few visible observations from your photo, in plain language."
      meta={<DemoBadge label="Demo data · sample analysis" />}
      onBack={onBack}
      backLabel="Use a different photo"
      actions={
        <Action variant="botanic" onClick={onContinue}>
          See my lipstick matches
        </Action>
      }
    >
      <div className="space-y-6">
        {selfieUrl ? (
          <figure className="inline-block border border-line bg-paper-deep p-2">
            <img
              src={selfieUrl}
              alt="Your uploaded selfie"
              className="h-36 w-28 object-cover"
            />
            <figcaption className="mt-2 px-1 pb-1 text-[0.75rem] text-stone-deep">
              Your photo, this session
            </figcaption>
          </figure>
        ) : null}

        <div className="border border-line bg-paper">
          <ol className="divide-y divide-line">
            {snapshot.observations.map((observation, index) => (
              <li key={observation.id} className="px-5 py-5">
                <div className="flex items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="font-display text-[0.9rem] text-botanic"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-medium">
                      {observation.title}
                    </h3>
                    <p className="mt-1.5 max-w-[42ch] text-[0.92rem] leading-relaxed text-stone-deep">
                      {observation.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-[0.85rem] font-medium text-botanic">
          {snapshot.disclaimer}
        </p>
        <p className="text-[0.85rem] leading-relaxed text-stone-deep">
          Demo mode: these are sample observations that stand in for live skin
          analysis until Phase 2.
        </p>
      </div>
    </StepShell>
  );
}
