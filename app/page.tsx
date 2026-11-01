import { DemoJourney } from "@/components/flow/DemoJourney";

// Read the analysis mode at request time so the demo/live badge always
// matches the deployment's environment instead of being baked in at build.
export const dynamic = "force-dynamic";

export default function Home() {
  const analysisMode =
    process.env.GLOWCART_ANALYSIS_MODE === "live" ? "live" : "recorded";

  return <DemoJourney analysisMode={analysisMode} />;
}
