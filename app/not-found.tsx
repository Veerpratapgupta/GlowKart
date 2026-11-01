import Link from "next/link";
import { Action } from "@/components/ui/Action";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md border border-ink bg-paper p-8 text-center">
        <p className="text-[0.9rem] font-medium text-botanic">GlowKart</p>
        <h1 className="mt-3 font-display text-2xl font-medium">
          This page isn’t part of the demo
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-stone-deep">
          The journey starts on the home page — grab a selfie and see your
          matches.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Action variant="botanic">Back to GlowKart</Action>
          </Link>
        </div>
      </div>
    </div>
  );
}
