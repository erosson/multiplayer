#!/bin/sh
# populate `~/.kube/config` from `$KUBE_CONFIG`. this is a secret set in github-actions and gitpod. It's secret.
# feels like the default file should be named `.kube/konfig`...
set -eu
mkdir -p $HOME/.kube
echo $KUBE_CONFIG | base64 -di > $HOME/.kube/config
