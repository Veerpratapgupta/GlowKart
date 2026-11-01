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

test("returns deterministic sheer/everyday matches with one primary", () => {
  const recommendations = recommendLipsticks(
    moistureSnapshot,
    sampleLipstickCatalog,
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["sun-coral-balm", "coral-fizz-balm", "bare-fig-matte"],
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
    sampleLipstickCatalog[0]?.benefit,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /Sun Coral/,
  );
});

const demoSnapshot: SkinSnapshot = {
  source: "recorded",
  disclaimer: "Reference only.",
  observations: [
    {
      id: "acne",
      title: "Clear-looking skin",
      detail: "A verified fixture observation.",
      uiScore: 92,
    },
    {
      id: "pore",
      title: "Visible pore texture",
      detail: "A verified fixture observation.",
      uiScore: 80,
    },
    {
      id: "moisture",
      title: "Good hydration",
      detail: "A verified fixture observation.",
      uiScore: 78,
    },
  ],
};

test("satin/bold leads with Soft Berry", () => {
  const recommendations = recommendLipsticks(
    demoSnapshot,
    sampleLipstickCatalog,
    { finish: "satin", occasion: "bold" },
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["soft-berry-tint", "peach-nude-cream", "coral-fizz-balm"],
  );
  assert.equal(recommendations[0]?.isPrimary, true);
  assert.equal(recommendations[0]?.product.finish, "satin");
  assert.match(
    recommendations[0]?.reason ?? "",
    /matches your satin finish and bold occasion/,
  );
  assert.match(
    recommendations[0]?.evidence.startingPoint ?? "",
    /satin finish to your bold look; your selected preference is satin for the bold occasion/,
  );
});

test("satin/everyday leads with an available satin product", () => {
  const recommendations = recommendLipsticks(
    demoSnapshot,
    sampleLipstickCatalog,
    { finish: "satin", occasion: "everyday" },
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["peach-nude-cream", "soft-berry-tint", "sun-coral-balm"],
  );
  assert.equal(recommendations[0]?.product.finish, "satin");
  assert.equal(recommendations[0]?.product.occasion, "everyday");
  assert.notDeepEqual(
    recommendations.map((item) => item.product.id),
    ["sun-coral-balm", "coral-fizz-balm", "peach-nude-cream"],
  );
});

test("alternative reasons do not claim mismatched preferences", () => {
  const recommendations = recommendLipsticks(
    demoSnapshot,
    sampleLipstickCatalog,
    { finish: "sheer", occasion: "everyday" },
  );

  const coralFizz = recommendations.find(
    (item) => item.product.id === "coral-fizz-balm",
  );
  assert.ok(coralFizz);
  assert.match(coralFizz.reason, /bold occasion is a different option/);
  assert.doesNotMatch(coralFizz.reason, /different finish and occasion/);
});

test("unavailable matte preference names the closest available finish", () => {
  const recommendations = recommendLipsticks(
    demoSnapshot,
    sampleLipstickCatalog.filter((product) => product.finish !== "matte"),
    { finish: "matte", occasion: "everyday" },
  );

  assert.deepEqual(
    recommendations.map((item) => item.product.id),
    ["peach-nude-cream", "sun-coral-balm", "soft-berry-tint"],
  );
  assert.equal(recommendations[0]?.product.finish, "satin");
  assert.match(
    recommendations[0]?.reason ?? "",
    /no matte product is available in this catalog/,
  );
  assert.doesNotMatch(
    recommendations[0]?.reason ?? "",
    /matches your matte finish/,
  );
  assert.ok(
    recommendations.every((item) =>
      item.reason.includes("no matte product is available in this catalog"),
    ),
  );
});

test("matte preference surfaces matte products in the matches", () => {
  const recommendations = recommendLipsticks(
    demoSnapshot,
    sampleLipstickCatalog,
    { finish: "matte", occasion: "everyday" },
  );

  assert.ok(
    recommendations.some((item) => item.product.finish === "matte"),
    "expected at least one matte product in the top three",
  );
  assert.ok(
    recommendations.every((item) => !item.reason.includes("no matte product")),
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
    ["sun-coral-balm", "coral-fizz-balm", "peach-nude-cream"],
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

  assert.equal(recommendations.length, 3);
  assert.deepEqual(recommendations[0]?.matchedConcernIds, ["moisture"]);
  assert.ok(
    recommendations.every(
      (item) =>
        item.matchedConcernIds.filter((id) => id === "moisture").length <= 1,
    ),
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
    ["sun-coral-balm", "coral-fizz-balm", "peach-nude-cream"],
  );
  assert.match(recommendations[0]?.reason ?? "", /acne signal is 99\/100/);
});

test("high pore scores lead with a satin pore-aware product", () => {
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
  assert.equal(recommendations[0]?.product.id, "peach-nude-cream");
  assert.equal(recommendations[0]?.product.finish, "satin");
  assert.match(recommendations[0]?.reason ?? "", /pore texture is 80\/100/);
});
