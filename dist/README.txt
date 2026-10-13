GLYPH LAB — Image to ASCII Studio

An open-source, browser-local image conversion studio.

Run a static HTTP server in this directory, for example:
  python -m http.server 8080
Then open http://localhost:8080

No build, package installation, API key, account, or backend is required.
The bundled JetBrains Mono font is licensed under the SIL Open Font License;
see assets/fonts/OFL.txt. The site code remains MIT licensed.
Files are processed using Canvas and ImageBitmap on the visitor's device.

Controls: image upload/drop/paste; presets; 40–280 columns; five character
ramps; color; invert; brightness; contrast; cell aspect; dithering.
Exports: plain-text clipboard, TXT, PNG, SVG.
Demo artwork: four original procedural mathematical sculptures.
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
