import type { SkinSnapshot } from "../types";

export const demoSkinSnapshot: SkinSnapshot = {
  source: "recorded",
  disclaimer: "Beauty guidance, not a medical diagnosis.",
  observations: [
    {
      id: "acne",
      title: "Clear-looking skin",
      detail:
        "The recorded demo-face score was 92/100 for the acne signal. This is a beauty reference score, not a diagnosis.",
      uiScore: 92,
    },
    {
      id: "pore",
      title: "Some visible pore texture",
      detail:
        "The recorded demo-face score was 80/100 for pore visibility. Lighting and photo quality can affect this reference score.",
      uiScore: 80,
    },
    {
      id: "moisture",
      title: "Good hydration",
      detail:
        "The recorded demo-face score was 78/100 for moisture. A comfortable balm or cushion texture may be a good place to start.",
      uiScore: 78,
    },
  ],
};
