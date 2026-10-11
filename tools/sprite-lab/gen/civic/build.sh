#!/bin/sh
# build.sh <type> "<header comment lines>"
S=tools/sprite-lab/gen/civic
D=./tools/sprite-lab/drafts
{ cat $S/$1.head.js; cat $S/kit.js; echo; cat $S/$1.body.js; } > $D/pixel.$1.js
node tools/sprite-lab/gen/ages/wrap.mjs $1
cd . && node tools/sprite-lab/lab.mjs render pixel $1 2>&1 | tail -2 && node tools/sprite-lab/lab.mjs aaa $1 --verbose 2>&1 | head -6
