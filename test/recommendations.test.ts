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
    ["soft-berry-tint", "sun-coral-balm", "peach-nude-cream"],
  );
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.ok(recommendations.slice(1).every((item) => !item.isPrimary));
  assert.equal(recommendations.length, 3);
  assert.ok(recommendations.some((item) => item.matchedConcernIds.length > 0));
  assert.match(recommendations[0]?.reason ?? "", /moisture signal is 72\/100/);
  assert.equal(
    recommendations[0]?.evidence.noticed,
    "We noticed good hydration in your beauty reference snapshot.",
  );
  assert.equal(
    recommendations[0]?.evidence.offers,
    sampleLipstickCatalog[1]?.benefit,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /Soft Berry/,
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
    ["soft-berry-tint", "sun-coral-balm", "peach-nude-cream"],
  );
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.match(
    recommendations[0]?.reason ?? "",
    /satin finish for a bold look/,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /satin finish to your bold look; your selected preference is satin/,
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

test("returns all products for an empty observation set", () => {
  const recommendations = recommendLipsticks(
    { ...moistureSnapshot, observations: [] },
    sampleLipstickCatalog,
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["sun-coral-balm", "soft-berry-tint", "peach-nude-cream"],
  );
  assert.ok(recommendations.every((item) => item.matchedConcernIds.length === 0));
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
    [["moisture"], ["moisture"], []],
  );
});

test("high acne scores lead with the sheer acne-aware product", () => {
  const recommendations = recommendLipsticks(
    {
      ...moistureSnapshot,
      observations: [
        {
          id: "acne",
          title: "Clear-looking skin",
          detail: "A verified fixture observation.",
          uiScore: 99,
        },
      ],
    },
    sampleLipstickCatalog,
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["sun-coral-balm", "peach-nude-cream", "soft-berry-tint"],
  );
  assert.match(recommendations[0]?.reason ?? "", /acne signal is 99\/100/);
});

test("high pore scores lead with the satin pore-aware product", () => {
  const recommendations = recommendLipsticks(
    {
      ...moistureSnapshot,
      observations: [
        {
          id: "pore",
          title: "Some visible pore texture",
          detail: "A verified fixture observation.",
          uiScore: 80,
        },
      ],
    },
    sampleLipstickCatalog,
    { finish: "satin", occasion: "everyday" },
  );

  assert.equal(recommendations.length, 3);
  assert.equal(recommendations[0]?.product.id, "soft-berry-tint");
  assert.equal(recommendations[0]?.product.finish, "satin");
  assert.match(recommendations[0]?.reason ?? "", /pore texture is 80\/100/);
});
