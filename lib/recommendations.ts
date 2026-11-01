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

function finishPreferenceReason(
  product: Product,
  preferences: ShoppingPreferences,
  requestedFinishAvailable: boolean,
): string {
  const finishMatches = product.finish === preferences.finish;
  const occasionMatches = product.occasion === preferences.occasion;

  if (!requestedFinishAvailable) {
    return `no ${finishLabel(preferences.finish)} product is available in this catalog, so this ${finishLabel(product.finish)} ${product.occasion} option is a close available match`;
  }
  if (finishMatches && occasionMatches) {
    return `this ${finishLabel(product.finish)} option matches your ${preferences.finish} finish and ${preferences.occasion} occasion`;
  }
  if (finishMatches) {
    return `this ${finishLabel(product.finish)} option matches your selected finish, while its ${product.occasion} occasion is a different option`;
  }
  if (occasionMatches) {
    return `this ${finishLabel(product.finish)} option matches your selected occasion, while its finish differs from your selected ${preferences.finish} finish`;
  }
  return `this ${finishLabel(product.finish)} ${product.occasion} option is a different finish and occasion from your selection`;
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
  const requestedFinishAvailable = catalog.some(
    (product) => product.finish === preferences.finish,
  );

  const scored = catalog
    .map((product) => ({
      product,
      matched: product.targetConcernIds.filter((id) => observed.has(id)),
      score:
        product.targetConcernIds.filter((id) => observed.has(id)).length * 3 +
        (product.finish === preferences.finish ? 4 : 0) +
        (product.occasion === preferences.occasion ? 2 : 0) +
        (product.finish === finishOrder[0]
          ? 2
          : product.finish === finishOrder[1]
            ? 1
            : 0) +
        (!requestedFinishAvailable && product.finish === "satin" ? 2 : 0),
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
    const scoreRationale = scoreSummary(snapshot);
    const scoreLead =
      scoreRationale === "the available Skin AI scores"
        ? "The available Skin AI scores"
        : `Your ${scoreRationale}`;
    const finishDecision =
      entry.product.finish === leadingFinish
        ? `we started with a ${finishLabel(leadingFinish)} finish, and ${finishPreferenceReason(entry.product, preferences, requestedFinishAvailable)}`
        : finishPreferenceReason(
            entry.product,
            preferences,
            requestedFinishAvailable,
          );

    return {
      product: entry.product,
      isPrimary: index === 0,
      matchedConcernIds: entry.matched,
      reason: `${scoreLead}, so ${finishDecision}.`,
      evidence: {
        noticed:
          labels.length > 0
            ? `We noticed ${joinNatural(labels)} in your beauty reference snapshot.`
            : "We used the available Skin AI scores as a neutral starting point.",
        offers: entry.product.benefit,
        startingPoint: `${entry.product.shadeName} brings a ${finishLabel(entry.product.finish)} finish to your ${entry.product.occasion} look; your selected preference is ${preferences.finish} for the ${preferences.occasion} occasion.`,
      },
    };
  });
}
