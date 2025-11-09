# Runtime Assets

## Tray Icon

Place your system tray icon here as `icon.png`.

### Specifications:
- **Format**: PNG
- **Size**: 16x16 or 32x32 pixels (for macOS menu bar)
- **Transparency**: Alpha channel recommended for best appearance
- **Style**: Should work well in both light and dark mode

### Usage:
- This icon is loaded at runtime by `electron/tray/tray-manager.ts`
- It appears in the system tray/menu bar when the app is running
- Make sure to add your `icon.png` file to this directory before running the app

### Note:
This is different from the build icon (`build/icon.png`) which is used for the app icon itself.
