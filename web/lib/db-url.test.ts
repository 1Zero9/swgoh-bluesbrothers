import assert from "node:assert/strict";
import test from "node:test";
import { explicitSsl } from "./db-url";

test("require, prefer and verify-ca become verify-full", () => {
  for (const mode of ["require", "prefer", "verify-ca"]) {
    assert.equal(new URL(explicitSsl(`postgres://u:p@h:5432/db?sslmode=${mode}`)).searchParams.get("sslmode"), "verify-full");
  }
});

test("everything else is left alone", () => {
  for (const url of ["postgres://u:p@h/db", "postgres://u:p@h/db?sslmode=verify-full", "postgres://u:p@h/db?sslmode=disable", "postgres://u:p@h/db?uselibpqcompat=true&sslmode=require", "not a url"]) {
    assert.equal(explicitSsl(url), url);
  }
});

test("other settings and the password survive", () => {
  const out = explicitSsl("postgres://user:p%40ss@host.example:6543/postgres?pgbouncer=true&sslmode=require");
  const url = new URL(out);
  assert.equal(url.password, "p%40ss");
  assert.equal(url.searchParams.get("pgbouncer"), "true");
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
});
