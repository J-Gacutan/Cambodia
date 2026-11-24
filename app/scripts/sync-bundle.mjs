/**
 * Copy delivery/open-cleared/<version>/ → public/khm-bundle/<version>/.
 * Version comes from config/bundle-versions.json (or VITE_KHM_BUNDLE_VERSION).
 *
 * LKA-style contract pin (khm-i6e.7):
 * - Non-stub bundles must match contract/platform.json sha256 list exactly.
 * - On success, writes config/contract-pin.json for check-bundle.mjs.
 * - Stub bundles skip the pin (fixtures / thin clones).
 *
 * FLAG / INTERNAL policy:
 * - Only open-cleared delivery trees are copied.
 * - Case figure PNGs from outputs/qgis-bridge (INTERNAL) are NOT copied.
 * - Never flip public_ready here — that is khm-i6e.2.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const versionsPath = join(repoRoot, "config/bundle-versions.json");
const versions = JSON.parse(readFileSync(versionsPath, "utf8"));
const version = process.env.VITE_KHM_BUNDLE_VERSION || versions.current;
const source = join(repoRoot, "delivery/open-cleared", version);
const dest = join(repoRoot, "public/khm-bundle", version);
const contractFile = join(repoRoot, "contract/platform.json");
const pinFile = join(repoRoot, "config/contract-pin.json");

const fail = (lines) => {
  for (const line of [].concat(lines)) console.error(line);
  console.error("FAIL: bundle not synced");
  process.exit(1);
};

if (!existsSync(source) || !statSync(source).isDirectory()) {
  fail([
    `Bundle source missing: ${source}`,
    "Build one with: python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub"
  ]);
}

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );
const listFiles = (dir) =>
  walk(dir)
    .map((f) => relative(dir, f).split(sep).join("/"))
    .sort();

const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));
if (manifest.version !== version) {
  fail(`manifest.version=${manifest.version} but pin asks for ${version}`);
}
if (manifest.public_ready !== true) {
  console.warn(
    `WARNING: ${version} has public_ready=${manifest.public_ready}. OK for local/INTERNAL preview; public Pages deploy must stay gated (khm-i6e.2).`
  );
}

const isStub = manifest.stub === true;
let listed = null;
let cambodiaCommit = null;

if (!isStub) {
  if (!existsSync(contractFile)) {
    fail([
      `missing ${contractFile}`,
      "Generate with: node scripts/write-contract.mjs",
      "Stub bundles may omit the contract; non-stub pins require it (khm-i6e.7)."
    ]);
  }
  let contract;
  try {
    contract = JSON.parse(readFileSync(contractFile, "utf8"));
  } catch (error) {
    fail(`${contractFile}: not valid JSON (${error.message})`);
  }
  const problems = [];
  if (contract.bundle_version !== version) {
    problems.push(
      `contract pins bundle_version ${contract.bundle_version ?? "(none)"}, asked for ${version}`
    );
  }
  if (typeof contract.cambodia_commit !== "string" || contract.cambodia_commit.length === 0) {
    problems.push("contract has no cambodia_commit");
  }
  cambodiaCommit = contract.cambodia_commit;

  listed = new Map(
    Array.isArray(contract.files)
      ? contract.files.map((f) => [f?.path, f?.sha256])
      : Object.entries(contract.files ?? {})
  );
  if (listed.size === 0) problems.push("contract lists no files");

  for (const [path, expected] of listed) {
    if (typeof path !== "string" || isAbsolute(path) || normalize(path).split(sep).includes("..")) {
      problems.push(`unsafe path in contract: ${path}`);
      continue;
    }
    if (typeof expected !== "string" || !/^[0-9a-f]{64}$/.test(expected)) {
      problems.push(`${path}: contract sha256 is not 64 hex characters`);
      continue;
    }
    const file = join(source, path);
    if (!existsSync(file)) problems.push(`${path}: listed in the contract, missing from the delivery tree`);
    else if (sha256(file) !== expected) problems.push(`${path}: sha256 differs from the contract`);
  }
  for (const path of listFiles(source)) {
    if (!listed.has(path)) problems.push(`${path}: in the delivery tree, not in the contract`);
  }
  if (problems.length) fail(problems);
}

mkdirSync(dirname(dest), { recursive: true });
rmSync(dest, { recursive: true, force: true });
cpSync(source, dest, { recursive: true });

if (listed) {
  const drift = [];
  for (const [path, expected] of listed) {
    const file = join(dest, path);
    if (!existsSync(file)) drift.push(`${path}: missing after copy`);
    else if (sha256(file) !== expected) drift.push(`${path}: sha256 differs after copy`);
  }
  for (const path of listFiles(dest)) {
    if (!listed.has(path)) drift.push(`${path}: extra file after copy`);
  }
  if (drift.length) {
    rmSync(dest, { recursive: true, force: true });
    fail(drift);
  }

  const pinFiles = Object.fromEntries([...listed].sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    pinFile,
    `${JSON.stringify(
      {
        bundle_version: version,
        cambodia_commit: cambodiaCommit,
        public_ready: Boolean(manifest.public_ready),
        licence_gate: manifest.licence_gate ?? null,
        files: pinFiles
      },
      null,
      2
    )}\n`
  );
}

writeFileSync(join(repoRoot, "public/khm-bundle/CURRENT"), `${version}\n`, "utf8");
writeFileSync(
  join(repoRoot, "public/khm-bundle/public-ready.json"),
  JSON.stringify(
    {
      version,
      public_ready: Boolean(manifest.public_ready),
      licence_gate: manifest.licence_gate ?? null,
      stub: Boolean(manifest.stub),
      cambodia_commit: cambodiaCommit,
      synced_at: new Date().toISOString(),
      note: "GitHub Pages workflow reads public_ready and refuses deploy when false."
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`Synced ${version}: ${source} → ${dest}`);
if (listed) {
  console.log(
    `PASS: contract pin (${listed.size} files, cambodia ${cambodiaCommit}, public_ready=${Boolean(manifest.public_ready)})`
  );
} else {
  console.log("stub bundle — no contract pin written");
}
console.log("INTERNAL case PNGs not copied (Pages-safe).");
