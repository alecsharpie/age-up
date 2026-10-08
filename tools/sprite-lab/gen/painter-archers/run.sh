#!/bin/sh
# usage: run.sh <id>
S=tools/sprite-lab/gen/painter-archers
cd . && node $S/$1.mjs tools/sprite-lab/drafts/pixel.$1.js > $S/last.$1.txt && node tools/sprite-lab/lab.mjs render pixel $1 | tail -1 && node tools/sprite-lab/lab.mjs aaa $1 --verbose
