{
  description = "Toolchain definitions, currently only consisting of Rust";
  inputs = {
  nixpkgs.url = "github:flox/nixpkgs/d407951447dcd00442e97087bf374aad70c04cea";
  flake-utils.url = "github:numtide/flake-utils";
  rust-overlay = {
    url = "github:oxalica/rust-overlay";
    inputs.nixpkgs.follows = "nixpkgs";
  };
};  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
    let
      inherit (nixpkgs) lib;
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ (import rust-overlay) ];
      };

      mkToolchain = channel: channel.default.override {
        extensions = [ "rust-analyzer" "clippy" "rustfmt" ];
        targets = [
          "x86_64-unknown-linux-musl"
          "aarch64-unknown-linux-musl"
        ];
      };
    in {
      packages = lib.mapAttrs' (version: channel:
        lib.nameValuePair
          ("rust-" + builtins.replaceStrings [ "." ] [ "_" ] version)
          (mkToolchain channel)
      ) pkgs.rust-bin.stable;
    });
}
