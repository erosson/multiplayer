#!/bin/sh
set -eu
cd "`dirname "$0"`/.."

mkdir -p dist
../vendor/protoc/bin/protoc \
    src/count.proto \
    src/platform.proto \
    src/swarm/session/session.proto \
    --ts_out dist/ --proto_path src 
echo proto build successful
