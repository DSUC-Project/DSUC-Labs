#!/usr/bin/env node
/**
 * Backend-local seed integrity check (safe for Render rootDir=backend).
 * Validates backend/content/academy-v2/seed only — no monorepo paths required.
 *
 * Full monorepo guard (no FE duplicate tree) lives at:
 *   scripts/assert-academy-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(__dirname, "../content/academy-v2/seed");

const REQUIRED_FILES = [
  "course.json",
  "instructor.json",
  "learningPath.json",
  "lessons.json",
  "modules.json",
];

function fail(message) {
  console.error(`assert-academy-seed (backend): FAIL — ${message}`);
  process.exit(1);
}

if (!fs.existsSync(SEED_DIR)) {
  fail(`seed directory missing: ${SEED_DIR}`);
}

for (const name of REQUIRED_FILES) {
  const full = path.join(SEED_DIR, name);
  if (!fs.existsSync(full)) {
    fail(`missing ${name}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    fail(`${name} is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    fail(`${name} must be a non-empty JSON array`);
  }
}

console.log("assert-academy-seed (backend): OK");
console.log(`  seed: ${SEED_DIR}`);
process.exit(0);
