# EoN Browser — Android APK Build

This folder contains the Capacitor configuration for building EoN Browser as a real Android APK.

## Prerequisites (Install These First)

1. **Node.js** — https://nodejs.org (LTS version)
2. **Android Studio** — https://developer.android.com/studio
   - During install, make sure "Android SDK", "Android SDK Platform", and "Android Virtual Device" are checked
3. **Java JDK 17** — https://adoptium.net

## Step-by-Step APK Build

### Step 1 — Build the Web App
Run this in the project root:
```
pnpm --filter @workspace/eon-browser run build
```

### Step 2 — Install Capacitor CLI
```
npm install -g @capacitor/cli
```

### Step 3 — Initialize Capacitor (first time only)
```
cd artifacts/eon-browser
npx cap init "EoN Browser" "com.eonbrowser.app" --web-dir=dist/public
```

### Step 4 — Add Android Platform (first time only)
```
npm install @capacitor/android
npx cap add android
```

### Step 5 — Copy Web Build to Android
```
npx cap copy android
```

### Step 6 — Sync Plugins
```
npx cap sync android
```

### Step 7 — Open in Android Studio
```
npx cap open android
```
Android Studio will open. Wait for Gradle sync to complete (~2 minutes).

### Step 8 — Build Debug APK
In Android Studio:
- Click **Build** menu at the top
- Click **Build Bundle(s) / APK(s)**
- Click **Build APK(s)**
- Wait for build to complete
- Click "locate" in the notification — this shows you where the APK is

**APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 9 — Build Release APK
In Android Studio:
- Click **Build** menu
- Click **Generate Signed Bundle / APK**
- Choose **APK**
- Create a new keystore (or use existing one)
- Follow the wizard to generate release APK

**Release APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

### Step 10 — Install APK on Android Device
1. Copy the APK file to your Android phone
2. On your phone, go to **Settings → Security → Unknown Sources** → Enable
3. Open the APK file on your phone
4. Tap **Install**
5. EoN Browser appears on your home screen!

## Capacitor Config Reference

The `capacitor.config.json` file (in `artifacts/eon-browser/`) controls:
- App ID (bundle identifier)
- App name
- Web directory (where built files are)
- Server URL (for live reload during development)
