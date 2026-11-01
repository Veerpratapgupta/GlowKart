import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/ui/Action";
import { Notice } from "@/components/ui/Notice";
import { ALLOWED_SELFIE_TYPES } from "@/lib/selfie-validation";
import { StepShell } from "./StepShell";

interface CaptureStepProps {
  selfieUrl: string | null;
  error: string | null;
  isAnalyzing: boolean;
  analysisMode: "recorded" | "live";
  onFileAccepted: (file: File) => void;
  onBack: () => void;
  onStartOver: () => void;
}

const acceptAttribute = ALLOWED_SELFIE_TYPES.join(",");

export function CaptureStep({
  selfieUrl,
  error,
  isAnalyzing,
  analysisMode,
  onFileAccepted,
  onBack,
  onStartOver,
}: CaptureStepProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoPhotoLoading, setDemoPhotoLoading] = useState(false);
  const [demoPhotoError, setDemoPhotoError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFileAccepted(file);
  }

  async function useDemoPhoto() {
    setDemoPhotoError(null);
    setDemoPhotoLoading(true);
    try {
      const response = await fetch("/demo/demo-selfie.jpg", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("demo-photo-unavailable");
      }
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("demo-photo-invalid");
      }
      onFileAccepted(
        new File([blob], "glowcart-demo-selfie.jpg", {
          type: blob.type || "image/jpeg",
        }),
      );
    } catch {
      setDemoPhotoError(
        "The stock demo photo is unavailable right now. Upload a selfie or use the camera instead.",
      );
    } finally {
      setDemoPhotoLoading(false);
    }
  }

  async function openCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Camera access was unavailable. Check your browser permission, or choose a photo instead.",
      );
      cameraInputRef.current?.click();
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function captureCameraPhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera is still starting. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("We couldn’t capture that photo. Choose a file instead.");
        return;
      }
      closeCamera();
      onFileAccepted(new File([blob], "glowcart-camera.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  return (
    <StepShell
      title="Your starting point"
      lede="Face the camera directly, keep your head upright, and fill most of the frame. Use even light and skip beauty filters."
      onBack={onBack}
      backLabel="Back to welcome"
      actions={
        <>
          <Action
            variant="botanic"
            onClick={() => void useDemoPhoto()}
            disabled={isAnalyzing || demoPhotoLoading}
          >
            {demoPhotoLoading ? "Loading demo photo…" : "Use demo photo"}
          </Action>
          <Action
            variant="quiet"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            Upload a selfie
          </Action>
          <Action
            variant="quiet"
            onClick={() => void openCamera()}
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

        {cameraOpen ? (
          <div className="space-y-3 border border-ink bg-paper-deep p-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Camera preview"
              className="aspect-[4/5] w-full -scale-x-100 object-cover"
            />
            <div className="flex flex-wrap gap-3">
              <Action variant="botanic" onClick={captureCameraPhoto}>
                Capture photo
              </Action>
              <Action variant="quiet" onClick={closeCamera}>
                Cancel camera
              </Action>
            </div>
          </div>
        ) : null}

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
              Your face should fill most of the frame so the analysis can read it clearly.
            </p>
          )}
        </div>

        {isAnalyzing ? (
          <div role="status" className="border border-line bg-paper px-4 py-4">
            <p className="text-[0.95rem] font-medium">Reading your photo</p>
            <p className="mt-1 text-[0.88rem] text-stone-deep">
              Preparing your skin snapshot. This may take a few minutes in live mode…
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

        {cameraError ? (
          <Notice tone="info" title="Camera unavailable">
            {cameraError}
          </Notice>
        ) : null}

        <p className="text-[0.8rem] text-stone-deep">
          Demo face · stock photo · not a customer or endorser.
        </p>

        {demoPhotoError ? (
          <Notice tone="error" title="Demo photo unavailable" alert>
            {demoPhotoError}
          </Notice>
        ) : null}

        {selfieUrl || isAnalyzing ? (
          <Notice tone="info" title={analysisMode === "recorded" ? "Recorded demo" : "Live analysis"}>
            {analysisMode === "recorded"
              ? "This public demo replays a recorded YouCam result from our demo face. Your uploaded photo is not analyzed in recorded mode."
              : "Live YouCam call · your photo is sent for analysis and not stored by this prototype."}
          </Notice>
        ) : null}

        <p className="text-[0.85rem] leading-relaxed text-stone-deep">
          Your photo is sent to this app’s server for validation and is not
          saved to an account. Recorded mode does not forward it to YouCam;
          live mode sends it to YouCam for analysis. Use a front-facing JPG or
          PNG up to 8 MB.
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
