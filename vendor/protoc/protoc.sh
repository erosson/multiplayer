#!/bin/sh
cd "`dirname "$0"`"
# https://github.com/protocolbuffers/protobuf/releases/latest
wget -O protoc.zip https://github.com/protocolbuffers/protobuf/releases/download/v21.12/protoc-21.12-linux-x86_64.zip
rm -rf protoc
unzip -d protoc *.zip
