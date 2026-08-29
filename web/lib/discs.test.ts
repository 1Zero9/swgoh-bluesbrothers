import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYouTubeId, CURATED_DISCS, DISC_CATEGORIES } from "./discs";

test("parseYouTubeId extracts video IDs correctly across various YouTube formats", () => {
  // Standard watch URL
  assert.equal(
    parseYouTubeId("https://www.youtube.com/watch?v=EHV0ZsAKoqI"),
    "EHV0ZsAKoqI"
  );

  // Short URL
  assert.equal(
    parseYouTubeId("https://youtu.be/YnaSRhMB_qo"),
    "YnaSRhMB_qo"
  );

  // Short URL with query params
  assert.equal(
    parseYouTubeId("https://youtu.be/9hB3S9y2Xh8?t=42"),
    "9hB3S9y2Xh8"
  );

  // Embed URL
  assert.equal(
    parseYouTubeId("https://www.youtube.com/embed/Vet6AH74xRY"),
    "Vet6AH74xRY"
  );

  // Shorts URL
  assert.equal(
    parseYouTubeId("https://youtube.com/shorts/0fG_Yn1cQ34?feature=share"),
    "0fG_Yn1cQ34"
  );

  // Direct 11-char ID
  assert.equal(
    parseYouTubeId("zZ5gCGJorK8"),
    "zZ5gCGJorK8"
  );

  // Invalid or empty inputs
  assert.equal(parseYouTubeId(""), null);
  assert.equal(parseYouTubeId("https://example.com/not-youtube"), null);
  assert.equal(parseYouTubeId("short"), null);
});

test("CURATED_DISCS contains valid tracks with required metadata", () => {
  assert.ok(CURATED_DISCS.length >= 15);

  for (const disc of CURATED_DISCS) {
    assert.ok(disc.id.length > 0, `Disc should have an id: ${disc.title}`);
    assert.ok(disc.title.length > 0, `Disc should have a title: ${disc.id}`);
    assert.ok(disc.artist.length > 0, `Disc should have an artist: ${disc.id}`);
    assert.equal(disc.youtubeId.length, 11, `Disc should have an 11-char YouTube ID: ${disc.title}`);
    assert.ok(disc.year > 1920 && disc.year <= 2030, `Disc year should be valid: ${disc.year}`);
    assert.ok(disc.album.length > 0, `Disc should have album info: ${disc.title}`);
    assert.ok(disc.duration.length > 0, `Disc should have duration: ${disc.title}`);
    assert.ok(disc.vibe.length > 0, `Disc should have vibe note: ${disc.title}`);
  }
});

test("DISC_CATEGORIES has all expected filter categories", () => {
  const ids = DISC_CATEGORIES.map((c) => c.id);
  assert.ok(ids.includes("all"));
  assert.ok(ids.includes("blues-brothers"));
  assert.ok(ids.includes("chicago-blues"));
  assert.ok(ids.includes("stax-soul"));
  assert.ok(ids.includes("delta-roots"));
  assert.ok(ids.includes("community"));
});
