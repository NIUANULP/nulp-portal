#!/bin/bash
set -euo pipefail
STARTTIME=$(date +%s)

build_tag=$1
name=player
node=$2
org=$3

commit_hash=$(git rev-parse --short HEAD)

cd src/app/app_dist
sed -i "/version/a\  \"buildHash\": \"${commit_hash}\"," package.json

echo "starting docker build"
docker build --no-cache --label commitHash=${commit_hash} -t ${org}/${name}:${build_tag} .
echo "completed docker build"

cd ../../..
echo "{\"image_name\" : \"${name}\", \"image_tag\" : \"${build_tag}\",\"commit_hash\" : \"${commit_hash}\", \"node_name\" : \"$node\"}" > metadata.json

ENDTIME=$(date +%s)
echo "Docker build completed. Took $((ENDTIME - STARTTIME)) seconds."
