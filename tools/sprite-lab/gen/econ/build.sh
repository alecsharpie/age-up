#!/bin/sh
# build.sh <type> : head + prelude + body -> drafts/pixel.<type>.js
S=tools/sprite-lab/gen/econ
D=./tools/sprite-lab/drafts
{ sed -n '/^\/\/ ==head/,/^\/\/ ==end/p' $S/$1.js | sed '1d;$d'; cat $S/prelude.js; sed -n '/^\/\/ ==end/,$p' $S/$1.js | sed '1d'; } > $D/pixel.$1.js
node tools/sprite-lab/gen/ages/wrap.mjs $1
cd . && node tools/sprite-lab/lab.mjs render pixel $1 2>&1 | tail -3 && node tools/sprite-lab/lab.mjs aaa $1 --verbose 2>&1 | head -8
