import type { Product, Recommendation, SkinSnapshot } from "./types";

function joinNatural(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function recommendLipsticks(
  snapshot: SkinSnapshot,
  catalog: Product[],
): Recommendation[] {
  const observed = new Set(snapshot.observations.map((observation) => observation.id));

  const scored = catalog
    .map((product) => ({
      product,
      matched: product.targetConcernIds.filter((id) => observed.has(id)),
    }))
    .filter((entry) => entry.matched.length > 0);

  scored.sort((a, b) => b.matched.length - a.matched.length);

  return scored.slice(0, 3).map((entry, index) => {
    const labels = entry.matched.map((id) => {
      const observation = snapshot.observations.find((item) => item.id === id);
      return observation ? observation.title.toLowerCase() : id;
    });

    return {
      product: entry.product,
      isPrimary: index === 0,
      matchedConcernIds: entry.matched,
      reason: `Chosen for ${joinNatural(labels)}.`,
    };
  });
}
