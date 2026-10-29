#!/bin/sh
# Builds public/leds.wasm from leds.c. Needs LLVM clang + wasm-ld
# (brew install llvm lld). The .wasm is committed, so CI doesn't need them.
set -e
cd "$(dirname "$0")"
/opt/homebrew/opt/llvm/bin/clang --target=wasm32 -O2 -nostdlib -ffreestanding \
  -Wall -Wextra -Werror \
  -fuse-ld=/opt/homebrew/bin/wasm-ld \
  -Wl,--no-entry -Wl,--strip-all -Wl,-z,stack-size=8192 -Wl,--initial-memory=65536 -Wl,--max-memory=65536 \
  -o ../public/leds.wasm leds.c
wc -c < ../public/leds.wasm | xargs printf 'leds.wasm: %s bytes\n'
