import type {
  Product,
  Recommendation,
  ShoppingPreferences,
  SkinSnapshot,
} from "./types";

function joinNatural(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function recommendLipsticks(
  snapshot: SkinSnapshot,
  catalog: Product[],
  preferences: ShoppingPreferences = { finish: "sheer", occasion: "everyday" },
): Recommendation[] {
  const observed = new Set(snapshot.observations.map((observation) => observation.id));

  const scored = catalog
    .map((product) => ({
      product,
      matched: product.targetConcernIds.filter((id) => observed.has(id)),
      preferenceMatches:
        Number(product.finish === preferences.finish) +
        Number(product.occasion === preferences.occasion),
    }))
    .filter((entry) => entry.matched.length > 0);

  scored.sort(
    (a, b) =>
      b.matched.length - a.matched.length ||
      b.preferenceMatches - a.preferenceMatches ||
      catalog.indexOf(a.product) - catalog.indexOf(b.product),
  );

  return scored.slice(0, 3).map((entry, index) => {
    const labels = entry.matched.map((id) => {
      const observation = snapshot.observations.find((item) => item.id === id);
      return observation ? observation.title.toLowerCase() : id;
    });

    return {
      product: entry.product,
      isPrimary: index === 0,
      matchedConcernIds: entry.matched,
      reason: `Chosen for ${joinNatural(labels)} and your ${preferences.finish} ${preferences.occasion} look.`,
      evidence: {
        noticed: `We noticed ${joinNatural(labels)} in your beauty reference snapshot.`,
        offers: entry.product.benefit,
        startingPoint: `${entry.product.shadeName} matches your ${preferences.finish} finish preference for a ${preferences.occasion} look.`,
      },
    };
  });
}
