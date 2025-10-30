# Assets

This directory contains application resources:

- `icon.png` - Application icon for Linux (512x512px recommended)
- `icon.icns` - Application icon for macOS
- `icon.ico` - Application icon for Windows

## Generating Icons

To generate proper icon files from a source PNG:

1. Start with a 1024x1024px PNG file
2. Use tools like:
   - [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
   - [png2icons](https://www.npmjs.com/package/png2icons)
   - Online converters

Example:
```bash
npx electron-icon-builder --input=icon-source.png --output=assets
```

## Placeholder

The current setup uses placeholder icons. Replace these with your actual application icons before distribution.
