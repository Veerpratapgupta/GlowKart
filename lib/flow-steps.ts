import type { FlowStepId } from "./types";

export const NAV_STEPS = [
  { index: 1, label: "Discover", entryStep: "discover" as FlowStepId },
  { index: 2, label: "Understand", entryStep: "capture" as FlowStepId },
  { index: 3, label: "Choose", entryStep: "matches" as FlowStepId },
  { index: 4, label: "See it", entryStep: "tryOn" as FlowStepId },
  { index: 5, label: "Keep it", entryStep: "result" as FlowStepId },
];

export function navIndexForStep(step: FlowStepId): number {
  switch (step) {
    case "discover":
      return 1;
    case "capture":
    case "snapshot":
      return 2;
    case "matches":
      return 3;
    case "tryOn":
      return 4;
    case "result":
      return 5;
  }
}

export function navLabelForIndex(index: number): string {
  const match = NAV_STEPS.find((item) => item.index === index);
  return match ? match.label : "";
}
