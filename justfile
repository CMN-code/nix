# Repo holding the shared rust-toolchain flake used by cmn-code/nix consumers
toolchain_repo := "git@github.com:cmn-code/nix.git"

# Keeps cmn-code/nix's rust-toolchain flake pinned to the same nixpkgs
# revision this repo's flox catalog already resolved. No-op if already synced.
sync-toolchain-flake:
    bun run scripts/sync_toolchain_flake.ts {{ toolchain_repo }}
