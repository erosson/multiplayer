#!/bin/bash
# TODO run with jest, or some other test framework
set -eux

curl http://multiplayer-test.erosson.org:3000/
curl http://multiplayer-test3.erosson.org:30000/
echo 'pass'
