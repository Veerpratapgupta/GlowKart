import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import type {
  FinishPreference,
  OccasionPreference,
  SkinSnapshot,
  ShoppingPreferences,
} from "@/lib/types";
import { StepShell } from "./StepShell";

interface SnapshotStepProps {
  selfieUrl: string | null;
  snapshot: SkinSnapshot;
  onContinue: () => void;
  onBack: () => void;
  preferences: ShoppingPreferences;
  onPreferencesChange: (preferences: ShoppingPreferences) => void;
}

export function SnapshotStep({
  selfieUrl,
  snapshot,
  onContinue,
  onBack,
  preferences,
  onPreferencesChange,
}: SnapshotStepProps) {
  return (
    <StepShell
      title="Here’s what we noticed"
      lede="A few visible observations from your photo, in plain language."
      meta={
        <DemoBadge
          label={
            snapshot.source === "recorded"
              ? "Recorded YouCam response"
              : snapshot.source === "live"
                ? "Live YouCam response"
                : "Demo data · sample analysis"
          }
        />
      }
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
              alt={
                snapshot.source === "recorded"
                  ? "Uploaded photo, not analyzed in recorded mode"
                  : "Your uploaded selfie"
              }
              className="h-36 w-28 object-cover"
            />
            <figcaption className="mt-2 px-1 pb-1 text-[0.75rem] text-stone-deep">
              {snapshot.source === "recorded"
                ? "Uploaded photo · not analyzed in recorded mode"
                : "Your photo, this session"}
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
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-display text-lg font-medium">
                        {observation.title}
                      </h3>
                      {observation.uiScore !== undefined ? (
                        <span className="text-[0.8rem] font-medium text-botanic">
                          {observation.uiScore}/100
                        </span>
                      ) : null}
                    </div>
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
        <div className="border border-ink bg-paper px-5 py-5">
          <h3 className="font-display text-lg font-medium">
            Tune your starting point
          </h3>
          <p className="mt-1 text-[0.9rem] leading-relaxed text-stone-deep">
            These choices change the order of your matches. Nothing is saved.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <PreferenceGroup
              label="Finish"
              value={preferences.finish}
              options={[
                ["sheer", "Sheer"],
                ["satin", "Satin"],
                ["matte", "Matte"],
              ] satisfies readonly [FinishPreference, string][]}
              onChange={(finish) =>
                onPreferencesChange({ ...preferences, finish })
              }
            />
            <PreferenceGroup
              label="Occasion"
              value={preferences.occasion}
              options={[
                ["everyday", "Everyday"],
                ["bold", "Bold"],
              ] satisfies readonly [OccasionPreference, string][]}
              onChange={(occasion) =>
                onPreferencesChange({ ...preferences, occasion })
              }
            />
          </div>
        </div>
        <Notice tone="info" title={snapshot.source === "recorded" ? "Recorded demo" : "Live analysis"}>
          {snapshot.source === "recorded"
            ? "This public demo replays a recorded YouCam result from our demo face. Your uploaded photo is not analyzed in recorded mode."
            : "Live YouCam call · your photo is sent for analysis and not stored by this prototype."}
        </Notice>
      </div>
    </StepShell>
  );
}

function PreferenceGroup<T extends FinishPreference | OccasionPreference>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[0.82rem] font-medium text-stone-deep">
        {label}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([option, optionLabel]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`border px-3 py-2 text-[0.86rem] transition-colors ${
              value === option
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper hover:border-ink"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
