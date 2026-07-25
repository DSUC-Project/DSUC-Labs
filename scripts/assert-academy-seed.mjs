#!/usr/bin/env node
/**
 * Monorepo guard for Academy v2 curated seed.
 *
 * Contributors: just edit backend/content/academy-v2/seed/ — no extra commands.
 * This script runs automatically on frontend `npm run build` (prebuild).
 *
 * Canonical: backend/content/academy-v2/seed/
 * Frontend loads it via @academy-v2-seed (Vite alias) — not a second tree.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const REQUIRED_FILES = [
  "course.json",
  "instructor.json",
  "learningPath.json",
  "lessons.json",
  "modules.json",
];

const CANONICAL_DIR = path.join(
  REPO_ROOT,
  "backend",
  "content",
  "academy-v2",
  "seed",
);

const FORBIDDEN_FE_SEED_DIR = path.join(
  REPO_ROOT,
  "frontend",
  "src",
  "content",
  "academy-v2",
  "seed",
);

const V2_LOCAL_CATALOG = path.join(
  REPO_ROOT,
  "frontend",
  "src",
  "lib",
  "academy",
  "v2LocalCatalog.ts",
);

function fail(message) {
  console.error(`assert-academy-seed: FAIL — ${message}`);
  process.exit(1);
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

// --- Canonical present ---
if (!fs.existsSync(CANONICAL_DIR)) {
  fail(`canonical seed directory missing: ${CANONICAL_DIR}`);
}

const missing = REQUIRED_FILES.filter(
  (name) => !fs.existsSync(path.join(CANONICAL_DIR, name)),
);
if (missing.length) {
  fail(`canonical seed missing files: ${missing.join(", ")}`);
}

// Basic JSON parse + non-empty arrays where expected
for (const name of REQUIRED_FILES) {
  const full = path.join(CANONICAL_DIR, name);
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

const canonicalHashes = Object.fromEntries(
  REQUIRED_FILES.map((name) => [
    name,
    sha256File(path.join(CANONICAL_DIR, name)),
  ]),
);

// --- No second editable tree under frontend ---
if (fs.existsSync(FORBIDDEN_FE_SEED_DIR)) {
  const feFiles = listJsonFiles(FORBIDDEN_FE_SEED_DIR);
  const drifts = [];

  for (const name of REQUIRED_FILES) {
    const fePath = path.join(FORBIDDEN_FE_SEED_DIR, name);
    if (!fs.existsSync(fePath)) {
      drifts.push(`${name}: present in canonical, missing under frontend seed`);
      continue;
    }
    const feHash = sha256File(fePath);
    if (feHash !== canonicalHashes[name]) {
      drifts.push(`${name}: hash mismatch (FE ≠ backend canonical)`);
    }
  }

  for (const name of feFiles) {
    if (!REQUIRED_FILES.includes(name)) {
      drifts.push(`${name}: extra file only under frontend seed`);
    }
  }

  const detail =
    drifts.length > 0
      ? `\n  Drift:\n  - ${drifts.join("\n  - ")}`
      : "\n  Files match, but a second tree must not exist.";

  fail(
    `forbidden duplicate seed at ${FORBIDDEN_FE_SEED_DIR}.${detail}\n` +
      `  Edit only: backend/content/academy-v2/seed/\n` +
      `  Frontend loads via @academy-v2-seed (see frontend/vite.config.ts).\n` +
      `  Delete frontend/src/content/academy-v2/seed/ after switching imports.`,
  );
}

// --- Frontend imports must use the alias ---
if (!fs.existsSync(V2_LOCAL_CATALOG)) {
  fail(`missing ${V2_LOCAL_CATALOG}`);
}

const catalogSource = fs.readFileSync(V2_LOCAL_CATALOG, "utf8");
const legacyImport =
  /@\/content\/academy-v2\/seed\//.test(catalogSource) ||
  /content\/academy-v2\/seed\//.test(catalogSource);
const usesAlias = /@academy-v2-seed\//.test(catalogSource);

if (legacyImport) {
  fail(
    "frontend/src/lib/academy/v2LocalCatalog.ts still imports a local seed path. " +
      "Use @academy-v2-seed/* only.",
  );
}

if (!usesAlias) {
  fail(
    "frontend/src/lib/academy/v2LocalCatalog.ts must import seed via @academy-v2-seed/*",
  );
}

console.log("assert-academy-seed: OK");
console.log(`  canonical: ${CANONICAL_DIR}`);
for (const name of REQUIRED_FILES) {
  console.log(
    `  ${name}  sha256=${canonicalHashes[name].slice(0, 12)}...`,
  );
}
console.log("  frontend: @academy-v2-seed -> backend/content/academy-v2/seed");
process.exit(0);
