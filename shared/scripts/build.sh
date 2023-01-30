#!/bin/sh
set -eu
cd "`dirname "$0"`/.."

mkdir -p dist
../vendor/protoc/bin/protoc \
    src/count.proto \
    src/platform.proto \
    --ts_out dist/ --proto_path src 
node ./scripts/proto-patch.js
tsc
echo proto build successful
