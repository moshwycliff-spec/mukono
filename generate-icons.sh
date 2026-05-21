#!/bin/bash
# Icon generation script
# Requires ImageMagick

echo "Generating PWA icons for Mukono Survey App..."

# Create a simple green square icon with "M" text
convert -size 512x512 xc:#1a5f2a -pointsize 200 -fill white -gravity center -annotate +0+0 "M" icon-base.png

# Generate all required sizes
sizes=(72 96 128 144 152 192 384 512)
for size in "${sizes[@]}"; do
    convert icon-base.png -resize ${size}x${size} icons/icon-${size}x${size}.png
    echo "Created icon-${size}x${size}.png"
done

# Generate favicon
convert icon-base.png -resize 16x16 icons/favicon.ico

echo "Done! All icons generated in icons/ folder"
