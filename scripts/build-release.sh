#!/usr/bin/env bash
# =============================================================================
# EoN Browser — Release Build Script
# Run this from the project root: bash scripts/build-release.sh
# =============================================================================

set -e

VERSION="1.0.0"
RELEASE_DIR="release/v${VERSION}"
WEB_DIST="artifacts/eon-browser/dist/public"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        EoN Browser Build System          ║"
echo "║              Version ${VERSION}               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Clean previous builds ────────────────────────────────────────────
echo "► [1/6] Cleaning previous builds..."
rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}/web"
mkdir -p "${RELEASE_DIR}/android-project"
mkdir -p "${RELEASE_DIR}/desktop"
echo "   ✓ Release directory: ${RELEASE_DIR}/"

# ── Step 2: Install dependencies ─────────────────────────────────────────────
echo ""
echo "► [2/6] Installing dependencies..."
pnpm install --frozen-lockfile
echo "   ✓ Dependencies installed"

# ── Step 3: Type check ────────────────────────────────────────────────────────
echo ""
echo "► [3/6] Running type check..."
if pnpm --filter @workspace/eon-browser run typecheck 2>&1; then
  echo "   ✓ No type errors"
else
  echo "   ⚠ Type errors found (continuing build)"
fi

# ── Step 4: Build frontend ────────────────────────────────────────────────────
echo ""
echo "► [4/6] Building production frontend..."
pnpm --filter @workspace/eon-browser run build
echo "   ✓ Frontend built: ${WEB_DIST}/"

# ── Step 5: Build API server ──────────────────────────────────────────────────
echo ""
echo "► [5/6] Building API server..."
pnpm --filter @workspace/api-server run build
echo "   ✓ API server built: artifacts/api-server/dist/"

# ── Step 6: Package release files ────────────────────────────────────────────
echo ""
echo "► [6/6] Packaging release files..."

# Web build
cp -r "${WEB_DIST}/." "${RELEASE_DIR}/web/"
echo "   ✓ Web build copied"

# Desktop files
cp -r desktop/ "${RELEASE_DIR}/desktop/"
echo "   ✓ Electron desktop files copied"

# Android project files
cp artifacts/eon-browser/capacitor.config.json "${RELEASE_DIR}/android-project/"
cp android/README.md "${RELEASE_DIR}/android-project/"
echo "   ✓ Android project files copied"

# Create info file
cat > "${RELEASE_DIR}/BUILD_INFO.txt" << EOF
EoN Browser — Release Build
============================
Version:    ${VERSION}
Built:      ${TIMESTAMP}
Node:       $(node --version)
Platform:   $(uname -s) $(uname -m)

Contents:
  web/                 Web app (deploy to any web host)
  desktop/             Electron desktop wrapper
  android-project/     Android Capacitor project setup

Web Deployment:
  Upload the web/ folder to Netlify, Vercel, or Cloudflare Pages.
  Or run: npx serve web/

Desktop (requires Electron):
  cd desktop && npm install && npm start

Android APK:
  See android-project/README.md for full instructions.
  Requires: Android Studio + Java JDK 17

Live URL (after Replit Deploy):
  https://eon-browser.[your-username].replit.app
EOF
echo "   ✓ Build info written"

# Create downloadable zip
echo ""
echo "► Creating release zip..."
cd release && zip -r "eon-browser-v${VERSION}-${TIMESTAMP}.zip" "v${VERSION}/" -x "*.DS_Store" 2>/dev/null
ZIP_NAME="eon-browser-v${VERSION}-${TIMESTAMP}.zip"
echo "   ✓ Release zip: release/${ZIP_NAME}"
cd ..

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    BUILD COMPLETE                               ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Web build:        ${RELEASE_DIR}/web/                         "
echo "║  Desktop files:    ${RELEASE_DIR}/desktop/                     "
echo "║  Android setup:    ${RELEASE_DIR}/android-project/             "
echo "║  Release zip:      release/${ZIP_NAME}                         "
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Next steps:"
echo "  1. Deploy web: Click 'Deploy' in Replit"
echo "  2. Desktop app: cd desktop && npm install && npm start"
echo "  3. Android APK: See release/v${VERSION}/android-project/README.md"
echo ""
