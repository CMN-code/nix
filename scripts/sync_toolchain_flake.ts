#!/usr/bin/env bun

// Keeps this flake's nixpkgs input pinned to the same nixpkgs revision this
// repo's own flox environment already resolved (.flox/env/manifest.lock),
// so consumers of this toolchain never end up linking against a different
// glibc/gcc/openssl than the rest of their own flox environment.
// No-op if the flake is already in sync with origin/main.

import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";

async function readFromMain(path: string): Promise<string> {
  const result = await $`git show origin/main:${path}`.quiet().nothrow();
  if (result.exitCode !== 0) {
    console.error(`error: ${path} not found on origin/main.`);
    console.error("Make sure it's committed and pushed before running this script.");
    process.exit(1);
  }
  return result.text();
}

await $`git fetch origin main`.quiet();

const lockfile = JSON.parse(await readFromMain(".flox/env/manifest.lock"));
const rev = lockfile.packages.find(
  (p: { system: string; locked_url?: string; rev?: string }) =>
    p.system === "x86_64-linux" && p.locked_url != null,
)?.rev;

if (!rev) {
  console.error("error: could not determine flox catalog nixpkgs rev from .flox/env/manifest.lock");
  process.exit(1);
}

const flakeOnMain = await readFromMain("flake.nix");
const current = flakeOnMain.match(/github:flox\/nixpkgs\/([0-9a-f]{40})/)?.[1];

if (current === rev) {
  console.log(`flake.nix already pinned to ${rev} — nothing to do`);
  process.exit(0);
}

const dirty = (await $`git status --porcelain`.text()).trim();
if (dirty) {
  console.error("error: working tree is dirty, refusing to update main");
  process.exit(1);
}

await $`git checkout main`;
await $`git merge --ff-only origin/main`;

writeFileSync(
  "flake.nix",
  flakeOnMain.replace(/github:flox\/nixpkgs\/[0-9a-f]{40}/, `github:flox/nixpkgs/${rev}`),
);
await $`nix --extra-experimental-features "nix-command flakes" flake update nixpkgs`;

await $`git add flake.nix flake.lock`;
await $`git commit -m ${`chore: sync nixpkgs to flox catalog rev ${rev}`}`;
await $`git push origin main`;

console.log(`Synced flake.nix to nixpkgs rev ${rev} and pushed to main`);
