import assert from "node:assert/strict";
import test from "node:test";
import { recommendLipsticks } from "../lib/recommendations";
import { sampleLipstickCatalog } from "../lib/mock/catalog";
import type { Product, SkinSnapshot } from "../lib/types";

const moistureSnapshot: SkinSnapshot = {
  source: "recorded",
  disclaimer: "Reference only.",
  observations: [
    {
      id: "moisture",
      title: "Good hydration",
      detail: "A verified fixture observation.",
      uiScore: 72,
    },
  ],
};

test("returns deterministic moisture matches with one primary", () => {
  const recommendations = recommendLipsticks(
    moistureSnapshot,
    sampleLipstickCatalog,
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["sun-coral-balm", "peach-nude-cream", "soft-berry-tint"],
  );
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.ok(recommendations.slice(1).every((item) => !item.isPrimary));
  assert.ok(recommendations.every((item) => item.matchedConcernIds.length > 0));
  assert.match(recommendations[0]?.reason ?? "", /good hydration/);
  assert.equal(
    recommendations[0]?.evidence.noticed,
    "We noticed good hydration in your beauty reference snapshot.",
  );
  assert.equal(
    recommendations[0]?.evidence.offers,
    sampleLipstickCatalog[0]?.benefit,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /Sun Coral/,
  );
});

test("preferences change the deterministic ranking and explanation", () => {
  const recommendations = recommendLipsticks(
    moistureSnapshot,
    sampleLipstickCatalog,
    { finish: "satin", occasion: "bold" },
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["soft-berry-tint", "peach-nude-cream", "sun-coral-balm"],
  );
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.match(
    recommendations[0]?.reason ?? "",
    /your satin bold look/,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /satin finish preference for a bold look/,
  );
});

test("ranks products with more matching concerns first", () => {
  const catalog: Product[] = [
    {
      ...sampleLipstickCatalog[0],
      targetConcernIds: ["moisture", "pore"],
    },
    {
      ...sampleLipstickCatalog[1],
      targetConcernIds: ["moisture"],
    },
  ];
  const recommendations = recommendLipsticks(
    {
      ...moistureSnapshot,
      observations: [
        ...moistureSnapshot.observations,
        {
          id: "pore",
          title: "Some visible pore texture",
          detail: "A verified fixture observation.",
          uiScore: 61,
        },
      ],
    },
    catalog,
  );

  assert.equal(recommendations[0]?.product.id, "sun-coral-balm");
  assert.deepEqual(recommendations[0]?.matchedConcernIds, ["moisture", "pore"]);
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.equal(recommendations[1]?.isPrimary, false);
});

test("returns no products for an empty observation set", () => {
  assert.deepEqual(
    recommendLipsticks(
      { ...moistureSnapshot, observations: [] },
      sampleLipstickCatalog,
    ),
    [],
  );
});

test("duplicate observations do not inflate a product match", () => {
  const recommendations = recommendLipsticks(
    {
      ...moistureSnapshot,
      observations: [
        ...moistureSnapshot.observations,
        ...moistureSnapshot.observations,
      ],
    },
    sampleLipstickCatalog,
  );

  assert.deepEqual(
    recommendations.map((item) => item.matchedConcernIds),
    [["moisture"], ["moisture"], ["moisture"]],
  );
});
