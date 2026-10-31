#!/usr/bin/env bash
# Compress the exported models (about 2.4 MB down to about 0.6 MB).
# The set is static, so its meshes are merged by material; the characters keep
# their named, separately animated parts and are only compressed.
# Run from personal-website/ after build_arrival.py.
set -euo pipefail

DIR="public/models/cabin"
GT=(pnpm dlx @gltf-transform/cli@4)
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"${GT[@]}" dedup "$DIR/set.glb" "$TMP/a.glb"
"${GT[@]}" flatten "$TMP/a.glb" "$TMP/b.glb"
"${GT[@]}" join "$TMP/b.glb" "$TMP/c.glb"
"${GT[@]}" meshopt "$TMP/c.glb" "$DIR/set.glb"

for name in eduard hiker rusty cow hugo; do
  "${GT[@]}" meshopt "$DIR/$name.glb" "$TMP/$name.glb"
  mv "$TMP/$name.glb" "$DIR/$name.glb"
done

ls -l "$DIR"
