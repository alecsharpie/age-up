#!/bin/sh
# usage: build.sh <type>  — splices kit.js into <type>.src.js at //@KIT and writes the draft
D=./tools/sprite-lab/drafts
S=tools/sprite-lab/gen/mil
awk -v kit="$S/kit.js" '/^\/\/@KIT/{while((getline l < kit)>0)print l; next}{print}' "$S/$1.src.js" > "$D/pixel.$1.js"
node tools/sprite-lab/gen/ages/wrap.mjs $1
