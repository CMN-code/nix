# Keeps cmn-code/nix's rust-toolchain flake pinned to the same nixpkgs
# revision this repo's flox catalog already resolved. No-op if already synced.
sync-toolchain-flake:
    bun run scripts/sync_toolchain_flake.ts
