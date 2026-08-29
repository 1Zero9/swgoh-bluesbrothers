import test from "node:test";
import assert from "node:assert/strict";
import { FIELD_GUIDES, GUIDE_CATEGORIES } from "./guides-data";

test("FIELD_GUIDES contains comprehensive guides with valid metadata and step instructions", () => {
  assert.ok(FIELD_GUIDES.length >= 5);

  for (const guide of FIELD_GUIDES) {
    assert.ok(guide.id, "Guide must have an id");
    assert.ok(guide.slug, "Guide must have a slug");
    assert.ok(guide.title, "Guide must have a title");
    assert.ok(guide.shortDescription, "Guide must have a description");
    assert.ok(guide.steps.length >= 2, `${guide.title} must have at least 2 steps`);

    for (const step of guide.steps) {
      assert.ok(step.stepNumber > 0, "Step number must be positive");
      assert.ok(step.title, "Step must have a title");
      assert.ok(step.instruction, "Step must have clear instructions");
    }

    assert.ok(guide.faq.length >= 1, `${guide.title} must have at least 1 FAQ item`);
  }
});

test("GUIDE_CATEGORIES covers all guide categories in the dataset", () => {
  const categoryIds = new Set(GUIDE_CATEGORIES.map((c) => c.id));
  assert.ok(categoryIds.has("ALL"));
  assert.ok(categoryIds.has("GETTING_STARTED"));
  assert.ok(categoryIds.has("TERRITORY_WAR"));
  assert.ok(categoryIds.has("DATACRONS"));
  assert.ok(categoryIds.has("CANTINA"));
  assert.ok(categoryIds.has("OFFICER"));

  for (const guide of FIELD_GUIDES) {
    assert.ok(
      categoryIds.has(guide.category),
      `Category ${guide.category} in ${guide.title} must exist in GUIDE_CATEGORIES`,
    );
  }
});
