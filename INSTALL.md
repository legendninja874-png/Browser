# EoN Browser — Quick Install Guide

## Option 1: Install on Android (No App Store Needed)

1. Open Chrome on your Android phone
2. Visit your EoN Browser URL
3. Tap ⋮ (three dots) → "Add to Home screen" → "Add"
4. EoN Browser icon appears on your home screen!

## Option 2: Install on Desktop (Chrome/Edge)

1. Open Chrome or Edge on your computer
2. Visit your EoN Browser URL
3. Look for the install icon (⊕) in the address bar
4. Click it → "Install" → Done!

## Option 3: Desktop App via Electron

Requirements: Node.js (https://nodejs.org)

```bash
# 1. Go to the desktop folder
cd desktop

# 2. Install Electron
npm install

# 3. Run EoN Browser as a desktop app
npm start
```

## Option 4: Android APK via Android Studio

Requirements: Android Studio + Java JDK 17

See `android/README.md` for full step-by-step instructions.

## Option 5: Self-host on any server

```bash
# Upload the contents of artifacts/eon-browser/dist/public/ to any web host
# OR run locally:
npx serve artifacts/eon-browser/dist/public
# Then open http://localhost:3000
```
