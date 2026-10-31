import type { SkinSnapshot } from "../types";

export const demoSkinSnapshot: SkinSnapshot = {
  source: "demo",
  disclaimer: "Beauty guidance, not a medical diagnosis.",
  observations: [
    {
      id: "undertone-warm",
      title: "Warm undertone",
      detail:
        "We noticed peach and gold tones in your skin, which often flatter coral and warm-red shades.",
    },
    {
      id: "dryness-mild",
      title: "Mild surface dryness",
      detail:
        "We noticed slight dryness around the cheeks. Softer balm formulas usually sit more comfortably than flat mattes.",
    },
    {
      id: "contrast-soft",
      title: "Soft natural contrast",
      detail:
        "We noticed gentle contrast between your lips and skin, so a medium-coverage color tends to read naturally.",
    },
  ],
};
