import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Guards against shipping a version without its release note (this once slipped through for 20 releases).
test("the current package version has an entry at the top of the changelog", () => {
  const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const firstEntry = changelog.match(/^## (\d+\.\d+\.\d+)/m)?.[1];
  assert.equal(firstEntry, version, `CHANGELOG.md's newest entry is ${firstEntry}, but package.json is ${version}`);
});
