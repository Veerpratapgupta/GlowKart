import type {
  ConcernId,
  FinishPreference,
  Product,
  Recommendation,
  ShoppingPreferences,
  SkinSnapshot,
} from "./types";

const scoredConcernIds = ["acne", "pore", "moisture"] as const satisfies readonly ConcernId[];

function joinNatural(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function scoreFor(snapshot: SkinSnapshot, id: ConcernId): number {
  const score = snapshot.observations.find((observation) => observation.id === id)
    ?.uiScore;
  return typeof score === "number" && Number.isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : 50;
}

function displayScore(snapshot: SkinSnapshot, id: ConcernId): string {
  const score = snapshot.observations.find((observation) => observation.id === id)
    ?.uiScore;
  return typeof score === "number" && Number.isFinite(score)
    ? `${Math.max(0, Math.min(100, Math.round(score)))}/100`
    : "not available";
}

export function preferredFinishes(snapshot: SkinSnapshot): FinishPreference[] {
  const acne = scoreFor(snapshot, "acne");
  const pore = scoreFor(snapshot, "pore");
  const moisture = scoreFor(snapshot, "moisture");

  if (acne >= 85 || pore >= 70) return ["sheer", "satin", "matte"];
  if (moisture < 65) return ["satin", "sheer", "matte"];
  if (pore < 70) return ["satin", "matte", "sheer"];
  return ["satin", "sheer", "matte"];
}

function finishLabel(finish: FinishPreference): string {
  return finish === "sheer"
    ? "sheer"
    : finish === "satin"
      ? "satin"
      : "matte";
}

function scoreSummary(snapshot: SkinSnapshot): string {
  const available = [...scoredConcernIds].filter((id) =>
    snapshot.observations.some(
      (observation) =>
        observation.id === id &&
        typeof observation.uiScore === "number" &&
        Number.isFinite(observation.uiScore),
    ),
  );
  if (available.length === 0) return "the available Skin AI scores";
  return available
    .sort((a, b) => scoreFor(snapshot, b) - scoreFor(snapshot, a))
    .slice(0, 2)
    .map(
      (id) =>
        `${id === "pore" ? "pore texture" : `${id} signal`} is ${displayScore(snapshot, id)}`,
    )
    .join(" and ");
}

export function finishBridge(
  snapshot: SkinSnapshot,
  leadingFinish: FinishPreference,
): string {
  return `Skin AI → finish: acne ${displayScore(snapshot, "acne")} · pore ${displayScore(snapshot, "pore")} · moisture ${displayScore(snapshot, "moisture")}. We led with ${finishLabel(leadingFinish)}.`;
}

export function recommendLipsticks(
  snapshot: SkinSnapshot,
  catalog: Product[],
  preferences: ShoppingPreferences = { finish: "sheer", occasion: "everyday" },
): Recommendation[] {
  const observed = new Set(snapshot.observations.map((observation) => observation.id));
  const finishOrder = preferredFinishes(snapshot);

  const scored = catalog
    .map((product) => ({
      product,
      matched: product.targetConcernIds.filter((id) => observed.has(id)),
      score:
        product.targetConcernIds.filter((id) => observed.has(id)).length * 3 +
        (product.finish === finishOrder[0]
          ? 2
          : product.finish === finishOrder[1]
            ? 1
            : 0) +
        Number(product.finish === preferences.finish),
    }))

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      catalog.indexOf(a.product) - catalog.indexOf(b.product),
  );

  return scored.slice(0, 3).map((entry, index) => {
    const labels = entry.matched.map((id) => {
      const observation = snapshot.observations.find((item) => item.id === id);
      return observation ? observation.title.toLowerCase() : id;
    });
    const leadingFinish = finishOrder[0];
    const occasionArticle = preferences.occasion === "everyday" ? "an" : "a";
    const scoreRationale = scoreSummary(snapshot);
    const scoreLead =
      scoreRationale === "the available Skin AI scores"
        ? "The available Skin AI scores"
        : `Your ${scoreRationale}`;
    const finishDecision =
      entry.product.finish === leadingFinish
        ? `we started with a ${finishLabel(leadingFinish)} finish`
        : `we favored a ${finishLabel(leadingFinish)} finish, while this ${finishLabel(entry.product.finish)} option reflects your ${preferences.finish} preference`;

    return {
      product: entry.product,
      isPrimary: index === 0,
      matchedConcernIds: entry.matched,
      reason: `${scoreLead}, so ${finishDecision} for ${occasionArticle} ${preferences.occasion} look.`,
      evidence: {
        noticed:
          labels.length > 0
            ? `We noticed ${joinNatural(labels)} in your beauty reference snapshot.`
            : "We used the available Skin AI scores as a neutral starting point.",
        offers: entry.product.benefit,
        startingPoint: `${entry.product.shadeName} brings a ${finishLabel(entry.product.finish)} finish to your ${preferences.occasion} look; your selected preference is ${preferences.finish}.`,
      },
    };
  });
}
