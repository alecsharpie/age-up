#!/bin/sh
# view.sh id : render and crop the frames area at full res into scratch crops
cd .
node tools/sprite-lab/lab.mjs render pixel $1 >/dev/null
S=tools/sprite-lab/gen/painter-ships
magick tools/sprite-lab/out/pixel.$1.png -crop 1400x${2:-1040}+10+${3:-55} +repage $S/crop-$1.png
