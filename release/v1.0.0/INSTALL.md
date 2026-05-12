# EoN Browser v1.0.0 — Installation Guide

## Android (No App Store Required)

### Method A: PWA Install (Easiest — 30 seconds)
1. Open Chrome on your Android phone
2. Visit your deployed EoN Browser URL
3. Tap **⋮** (three dots, top right)
4. Tap **"Add to Home screen"**
5. Tap **"Add"**
6. Done! EoN Browser icon is on your home screen

### Method B: APK Build (Full Native App)
See `android-project/README.md` for complete instructions.
Requires Android Studio — total time ~20 minutes.

---

## Desktop (Windows / Mac / Linux)

### Quick Run (needs Node.js)
```bash
cd desktop/
npm install
npm start
```

### Build Windows Installer (.exe)
```bash
cd desktop/
npm install
npm run build:win
# Output: release/desktop/EoN Browser Setup 1.0.0.exe
```

### Build Mac App (.dmg)
```bash
cd desktop/
npm install
npm run build:mac
# Output: release/desktop/EoN Browser-1.0.0.dmg
```

### Build Linux App (.AppImage)
```bash
cd desktop/
npm install
npm run build:linux
# Output: release/desktop/EoN Browser-1.0.0.AppImage
```

---

## Web Deployment

### Netlify (Free, 1 minute)
1. Go to https://netlify.com
2. Drag the `web/` folder onto the Netlify dashboard
3. Your app is live instantly!

### Vercel (Free, 1 minute)
1. Go to https://vercel.com
2. Click "Add New Project"
3. Upload the `web/` folder
4. Deploy!

### Local Server
```bash
npx serve web/
# Opens at http://localhost:3000
```
