# usage: `source ./vendor/path.sh`
VENDOR_DIR="`dirname "$BASH_SOURCE"`"
export PATH="$PATH:$VENDOR_DIR/bin:$VENDOR_DIR/protoc/bin"
