import { useRef } from "react";
import { Action } from "@/components/ui/Action";
import { Notice } from "@/components/ui/Notice";
import { ALLOWED_SELFIE_TYPES } from "@/lib/selfie-validation";
import { StepShell } from "./StepShell";

interface CaptureStepProps {
  selfieUrl: string | null;
  error: string | null;
  isAnalyzing: boolean;
  onFileAccepted: (file: File) => void;
  onBack: () => void;
  onStartOver: () => void;
}

const acceptAttribute = ALLOWED_SELFIE_TYPES.join(",");

export function CaptureStep({
  selfieUrl,
  error,
  isAnalyzing,
  onFileAccepted,
  onBack,
  onStartOver,
}: CaptureStepProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFileAccepted(file);
  }

  return (
    <StepShell
      title="Your starting point"
      lede="Face a window if you can, keep your whole face in frame, and skip beauty filters. We only need one clear photo."
      onBack={onBack}
      backLabel="Back to welcome"
      actions={
        <>
          <Action
            variant="botanic"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            Upload a selfie
          </Action>
          <Action
            variant="quiet"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            Use camera
          </Action>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={uploadInputRef}
          type="file"
          accept={acceptAttribute}
          className="sr-only"
          aria-label="Upload a selfie"
          onChange={handleInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={acceptAttribute}
          capture="user"
          className="sr-only"
          aria-label="Take a photo with the camera"
          onChange={handleInputChange}
        />

        <div
          className="flex min-h-64 items-center justify-center border border-line bg-paper-deep p-6"
          aria-busy={isAnalyzing}
        >
          {selfieUrl ? (
            <img
              src={selfieUrl}
              alt="Your uploaded selfie"
              className="max-h-80 w-full object-contain"
            />
          ) : (
            <p className="max-w-[28ch] text-center text-[0.92rem] text-stone-deep">
              Your photo appears here while we prepare the snapshot.
            </p>
          )}
        </div>

        {isAnalyzing ? (
          <div role="status" className="border border-line bg-paper px-4 py-4">
            <p className="text-[0.95rem] font-medium">Reading your photo</p>
            <p className="mt-1 text-[0.88rem] text-stone-deep">
              Preparing your demo skin snapshot…
            </p>
            <div className="mt-3 h-px w-full overflow-hidden bg-line">
              <div className="progress-sweep h-px w-1/3 bg-botanic" />
            </div>
          </div>
        ) : null}

        {error ? (
          <Notice tone="error" alert title="That photo did not work">
            {error} Choose another file, or use the camera option.
          </Notice>
        ) : null}

        <p className="text-[0.85rem] leading-relaxed text-stone-deep">
          Your photo stays in this browser session. It is not saved to an
          account. JPG, PNG, or WebP up to 8 MB.
        </p>

        {!isAnalyzing ? (
          <button
            type="button"
            onClick={onStartOver}
            className="text-[0.85rem] text-stone-deep underline underline-offset-4 hover:text-ink"
          >
            Start over
          </button>
        ) : null}
      </div>
    </StepShell>
  );
}
