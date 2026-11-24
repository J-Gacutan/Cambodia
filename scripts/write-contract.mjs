#!/usr/bin/env node
/**
 * Write contract/platform.json (LKA-style sha256 pin) for an open-cleared bundle.
 *
 *   node scripts/write-contract.mjs [version]
 *
 * Version defaults to config/bundle-versions.json → current.
 * Paths are relative to delivery/open-cleared/<version>/.
 * Does not flip public_ready. Re-run after every bundle content change.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const versions = JSON.parse(readFileSync(join(repoRoot, "config/bundle-versions.json"), "utf8"));
const version = process.argv[2] || versions.current;
const source = join(repoRoot, "delivery/open-cleared", version);

if (!existsSync(source) || !statSync(source).isDirectory()) {
  console.error(`missing ${source}`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

const files = walk(source)
  .map((f) => relative(source, f).split(sep).join("/"))
  .sort()
  .map((path) => ({ path, sha256: sha256(join(source, path)) }));

let cambodiaCommit = "uncommitted";
try {
  cambodiaCommit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
} catch {
  /* leave uncommitted */
}

const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));
if (manifest.version !== version) {
  console.error(`manifest.version=${manifest.version} but asked for ${version}`);
  process.exit(1);
}

const contract = {
  note: "Pinned exchange for the Cambodia screen console (LKA-style). Paths relative to delivery/open-cleared/<bundle_version>/. Sync verifies every sha256 before copying into public/khm-bundle/. Never invent public_ready — that is khm-i6e.2.",
  platform_repo: "Cambodia",
  bundle_version: version,
  cambodia_commit: cambodiaCommit,
  public_ready: Boolean(manifest.public_ready),
  licence_gate: manifest.licence_gate ?? null,
  files
};

const outDir = join(repoRoot, "contract");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "platform.json");
writeFileSync(outFile, `${JSON.stringify(contract, null, 2)}\n`);
console.log(
  `Wrote ${outFile} (${files.length} files, commit ${cambodiaCommit}, public_ready=${contract.public_ready})`
);
