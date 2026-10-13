GLYPH LAB — Image to ASCII Studio

An open-source, browser-local image conversion studio.

Run a static HTTP server in this directory, for example:
  python -m http.server 8080
Then open http://localhost:8080

No build, package installation, API key, account, or backend is required.
The bundled JetBrains Mono font is licensed under the SIL Open Font License;
see assets/fonts/OFL.txt. The site code remains MIT licensed.
Files are processed using Canvas and ImageBitmap on the visitor's device.

Controls: image upload/drop/paste; presets; 40–280 columns; six character
ramps; color; invert; brightness; contrast; cell aspect; dithering; color ink lift.
Exports: plain-text clipboard, TXT, PNG, SVG.
Color ink preserves this visual style in PNG and SVG. Clipboard and TXT use
a brightness-based monochrome ramp so the text remains recognizable without color.
Demo images: five project-supplied artworks and photographs, plus an original
procedural orbital sculpture for a compact ASCII example. Supplied image rights
remain with their respective owners; the MIT code license does not grant
additional rights to these images.
Languages: English and Russian.

index.html  — page structure and copy
style.css   — responsive visual design
refined.css — typography and composition refinement
app.js      — conversion, controls, exports, translation
title-motion.js — animated ASCII headline, pause and reduced-motion support
assets/     — original artwork and favicon
LICENSE.txt — MIT license

The source download is packaged separately from the deployed site's
hosting credentials and project identity. No third-party scripts, fonts,
analytics, or image services are required.
