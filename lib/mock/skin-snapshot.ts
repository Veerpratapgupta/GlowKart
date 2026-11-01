import type { SkinSnapshot } from "../types";

export const demoSkinSnapshot: SkinSnapshot = {
  source: "recorded",
  disclaimer: "Beauty guidance, not a medical diagnosis.",
  observations: [
    {
      id: "acne",
      title: "Clear-looking skin",
      detail:
        "The recorded demo-face score was 99/100 for the acne signal. This is a beauty reference score, not a diagnosis.",
      uiScore: 99,
    },
    {
      id: "moisture",
      title: "Good hydration",
      detail:
        "The recorded demo-face score was 72/100 for moisture. A comfortable balm or cushion texture may be a good place to start.",
      uiScore: 72,
    },
    {
      id: "pore",
      title: "Some visible pore texture",
      detail:
        "The recorded demo-face score was 61/100 for pores. Lighting and photo quality can affect this reference score.",
      uiScore: 61,
    },
  ],
};
