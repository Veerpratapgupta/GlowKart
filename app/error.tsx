"use client";

import { useEffect } from "react";
import { Action } from "@/components/ui/Action";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlowKart runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md border border-ink bg-paper p-8 text-center">
        <p className="text-[0.9rem] font-medium text-botanic">GlowKart</p>
        <h1 className="mt-3 font-display text-2xl font-medium">
          Something went wrong
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-stone-deep">
          The page hit an unexpected error. Your photo stays on this device —
          try the step again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Action variant="botanic" onClick={reset}>
            Try again
          </Action>
          <Action variant="quiet" onClick={() => window.location.assign("/")}>
            Back to start
          </Action>
        </div>
      </div>
    </div>
  );
}
