import { DemoJourney } from "@/components/flow/DemoJourney";

export default function Home() {
  const analysisMode =
    process.env.GLOWCART_ANALYSIS_MODE === "live" ? "live" : "recorded";

  return <DemoJourney analysisMode={analysisMode} />;
}
