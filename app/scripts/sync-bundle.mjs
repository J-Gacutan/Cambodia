/**
 * Copy delivery/open-cleared/<version>/ → public/khm-bundle/<version>/.
 * Version comes from config/bundle-versions.json (or VITE_KHM_BUNDLE_VERSION).
 *
 * FLAG / INTERNAL policy:
 * - Only open-cleared delivery trees are copied.
 * - Case figure PNGs from outputs/qgis-bridge (INTERNAL) are NOT copied into
 *   public/khm-bundle — they must never reach public GitHub Pages.
 * - Drop in a later open-cleared folder and bump `current` — no app rewrite.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const versionsPath = join(repoRoot, "config/bundle-versions.json");
const versions = JSON.parse(readFileSync(versionsPath, "utf8"));
const version = process.env.VITE_KHM_BUNDLE_VERSION || versions.current;
const source = join(repoRoot, "delivery/open-cleared", version);
const dest = join(repoRoot, "public/khm-bundle", version);

if (!existsSync(source)) {
  console.error(`Bundle source missing: ${source}`);
  console.error("Build one with: python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));
if (manifest.public_ready !== true) {
  console.warn(
    `WARNING: ${version} has public_ready=${manifest.public_ready}. OK for local/INTERNAL preview; public Pages deploy must stay gated (khm-i6e.2).`
  );
}

mkdirSync(dirname(dest), { recursive: true });
rmSync(dest, { recursive: true, force: true });
cpSync(source, dest, { recursive: true });

writeFileSync(join(repoRoot, "public/khm-bundle/CURRENT"), `${version}\n`, "utf8");
writeFileSync(
  join(repoRoot, "public/khm-bundle/public-ready.json"),
  JSON.stringify(
    {
      version,
      public_ready: Boolean(manifest.public_ready),
      licence_gate: manifest.licence_gate ?? null,
      stub: Boolean(manifest.stub),
      synced_at: new Date().toISOString(),
      note: "GitHub Pages workflow reads public_ready and refuses deploy when false."
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`Synced ${version}: ${source} → ${dest}`);
console.log(`public_ready=${Boolean(manifest.public_ready)} · INTERNAL case PNGs not copied (Pages-safe).`);
