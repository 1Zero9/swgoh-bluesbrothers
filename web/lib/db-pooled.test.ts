import assert from "node:assert/strict";
import test from "node:test";
import { isAccelerateUrl } from "./db-url";

test("Prisma's pooled address is recognised, the plain one is not", () => {
  assert.equal(isAccelerateUrl("prisma+postgres://accelerate.prisma-data.net/?api_key=example"), true);
  assert.equal(isAccelerateUrl("prisma://accelerate.prisma-data.net/?api_key=example"), true);
  assert.equal(isAccelerateUrl("postgres://db.example.test:5432/postgres"), false);
});
