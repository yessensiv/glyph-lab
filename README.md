# GLYPH LAB

Browser-local image to ASCII art generator.

**Live site:** [glyph-lab-livid.vercel.app](https://glyph-lab-livid.vercel.app/)

Convert JPG, PNG, WebP or GIF images, adjust width and style, then copy text or export TXT, PNG and SVG. Image processing happens on your device.

## Run locally

Serve the `dist` directory with any static HTTP server. No build, dependencies or API keys are required.

```sh
cd dist
python -m http.server 8080
```

Open http://localhost:8080.

## Vercel

Framework: Other. Output directory: `dist`. No build or install command required.

## License

Code: [MIT](dist/LICENSE.txt). Bundled font: [SIL Open Font License](dist/assets/fonts/OFL.txt). Sample image rights remain with their respective owners.
