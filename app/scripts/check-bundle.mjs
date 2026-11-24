/**
 * Verify public/khm-bundle/<current>/ against config/contract-pin.json (LKA-style).
 * Stub bundles pass without a pin. Non-stub requires a matching pin.
 *
 *   node app/scripts/check-bundle.mjs [--root=<repo>]
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootArg = process.argv.slice(2).find((a) => a.startsWith("--root="));
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : join(__dirname, "../.."));

const versions = JSON.parse(readFileSync(join(root, "config", "bundle-versions.json"), "utf8"));
const version = process.env.VITE_KHM_BUNDLE_VERSION || versions.current;
const base = join(root, "public", "khm-bundle", version);
const problems = [];

if (!existsSync(join(base, "manifest.json"))) {
  problems.push(`missing ${base}/manifest.json — run npm run sync:bundle first`);
  console.log(problems.join("\n"));
  console.log(`FAIL: ${problems.length} bundle problem(s)`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(base, "manifest.json"), "utf8"));
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]
  );
const files = existsSync(base) ? walk(base) : [];
const sha256 = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

const pinFile = join(root, "config", "contract-pin.json");
const pin = existsSync(pinFile) ? JSON.parse(readFileSync(pinFile, "utf8")) : null;
let pinNote;

if (pin && pin.bundle_version === version) {
  const listed = new Map(Object.entries(pin.files ?? {}));
  for (const [path, expected] of listed) {
    const f = join(base, path);
    if (!existsSync(f)) problems.push(`${path}: pinned in the contract, missing from public/khm-bundle`);
    else if (sha256(f) !== expected) problems.push(`${path}: sha256 differs from the contract pin`);
  }
  for (const f of files) {
    const path = relative(base, f).split(sep).join("/");
    if (!listed.has(path)) problems.push(`${path}: in public/khm-bundle, not in the contract pin`);
  }
  if (pin.cambodia_commit && typeof pin.cambodia_commit !== "string") {
    problems.push("contract pin cambodia_commit is not a string");
  }
  if (pin.public_ready === true && manifest.public_ready !== true) {
    problems.push("pin says public_ready=true but manifest does not");
  }
  pinNote = `pinned to Cambodia ${pin.cambodia_commit}, ${listed.size} files match, public_ready=${Boolean(manifest.public_ready)}`;
} else if (manifest.stub === true) {
  pinNote = "stub, no contract pin";
} else {
  problems.push(
    `bundle ${version} is not a stub and has no matching contract pin; run npm run sync:bundle (after node scripts/write-contract.mjs)`
  );
}

// Soft licence checks: every layer row must carry evidence + licence fields.
if (manifest.families?.includes("layers") && existsSync(join(base, "layers", "index.json"))) {
  const layers = JSON.parse(readFileSync(join(base, "layers", "index.json"), "utf8"));
  for (const layer of layers) {
    for (const key of ["evidence_class", "register_id", "licence_plain"]) {
      if (!layer[key]) problems.push(`layer ${layer.id}: missing ${key}`);
    }
    if (!("licence_spdx" in layer)) problems.push(`layer ${layer.id}: missing licence_spdx (may be null)`);
    if (typeof layer.public_ready !== "boolean") problems.push(`layer ${layer.id}: public_ready must be boolean`);
    if (layer.public_ready === true && manifest.public_ready !== true) {
      problems.push(`layer ${layer.id}: public_ready=true while bundle gate is false`);
    }
  }
}

if (manifest.public_ready === true && manifest.licence_gate?.includes("blocked")) {
  problems.push("manifest public_ready=true while licence_gate still blocked");
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`FAIL: ${problems.length} bundle problem(s)`);
  process.exit(1);
}
console.log(`PASS: bundle ${version}, ${pinNote}`);
