# EoN Browser — Complete Beginner's Guide
## Running · Building · Publishing · Sharing · Updating

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Difficulty:** Beginner-friendly — no experience needed

---

## Table of Contents

1. [What Is EoN Browser?](#1-what-is-eon-browser)
2. [Running the Browser Right Now](#2-running-the-browser-right-now)
3. [Understanding the Project Structure](#3-understanding-the-project-structure)
4. [Publishing to the Web (One-Click Deploy)](#4-publishing-to-the-web-one-click-deploy)
5. [Building a Production Version Manually](#5-building-a-production-version-manually)
6. [Sharing EoN Browser with Others](#6-sharing-eon-browser-with-others)
7. [Exporting as a Desktop App (Electron)](#7-exporting-as-a-desktop-app-electron)
8. [Installing on Android as a PWA](#8-installing-on-android-as-a-pwa)
9. [Updating the Browser After Changes](#9-updating-the-browser-after-changes)
10. [Troubleshooting Common Problems](#10-troubleshooting-common-problems)
11. [Glossary for Beginners](#11-glossary-for-beginners)

---

## 1. What Is EoN Browser?

EoN Browser is a **web application** that looks and feels like a real mobile browser (similar to Chrome or Samsung Internet). It is built using:

- **React** — the code that makes things appear on screen
- **TypeScript** — a programming language that catches mistakes early
- **Tailwind CSS** — makes the app look beautiful
- **Framer Motion** — handles animations
- **Zustand** — remembers things like your current theme
- **PostgreSQL** — a database that stores your tabs, bookmarks, and history
- **Express** — the backend server that handles data

**Important:** EoN Browser is a *simulated* browser interface — it is a browser-themed web app. It runs inside any real browser (Chrome, Safari, Firefox).

---

## 2. Running the Browser Right Now

### Option A — Run Directly in Replit (Easiest)

You are already here! The browser is already running. Here is how to see it:

**Step 1:** Look at the top of your Replit screen.  
You will see a panel on the right side called the **Preview pane**.  
This is where EoN Browser appears.

**Step 2:** If the preview pane is blank or showing an error, look at the left panel.  
Find the green **Run** button (triangle/play icon) at the very top of Replit.  
Click it once.

**Step 3:** Wait about 10–20 seconds.  
The app will start and appear in the preview pane on the right.

**Step 4:** You can also open EoN Browser in a **full browser tab** by:  
- Finding the small "open in new tab" or "external link" icon in the preview pane  
- Clicking it to open the browser full-screen

---

### Option B — Run on Your Own Computer

If you have downloaded the project files to your own computer:

**Step 1:** Install Node.js  
Go to → https://nodejs.org  
Download the version that says **"LTS"** (Recommended for most users)  
Run the installer and click through all the default options

**Step 2:** Install pnpm (the package manager this project uses)  
Open a **Terminal** (on Mac/Linux) or **Command Prompt** (on Windows)  
Type this command exactly and press Enter:
```
npm install -g pnpm
```
Wait for it to finish.

**Step 3:** Open a Terminal inside the project folder  
Navigate to where you downloaded the project. Example:
```
cd Downloads/eon-browser-project
```

**Step 4:** Install all the project's dependencies (do this only once):
```
pnpm install
```
This downloads all the code libraries the project needs. It may take 1–3 minutes.

**Step 5:** Set up the database  
EoN Browser uses a database to store your data. Run:
```
pnpm --filter @workspace/db run push
```

**Step 6:** Add starter data (optional but recommended):
```
npx tsx artifacts/api-server/src/seed.ts
```

**Step 7:** Start both servers (open two separate terminal windows):

*Terminal 1 — Start the Backend (data server):*
```
PORT=8080 pnpm --filter @workspace/api-server run dev
```

*Terminal 2 — Start the Frontend (the browser UI):*
```
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/eon-browser run dev
```

**Step 8:** Open EoN Browser  
Open Google Chrome or any web browser  
Go to: **http://localhost:3000**  
EoN Browser will appear!

---

## 3. Understanding the Project Structure

Here is what each folder and file does. Do not be overwhelmed — you only need to touch a few of these.

```
your-project/
│
├── artifacts/
│   ├── eon-browser/          ← The browser's visual interface (what you see)
│   │   ├── src/
│   │   │   ├── pages/        ← Each screen of the browser (Home, Settings, etc.)
│   │   │   ├── components/   ← Reusable pieces of UI (buttons, cards, etc.)
│   │   │   ├── store/        ← Saves settings like your current theme
│   │   │   ├── contexts/     ← Manages dark/light mode
│   │   │   └── index.css     ← All the colors and styles
│   │   └── dist/             ← The final built files (created when you run "build")
│   │
│   └── api-server/           ← The backend that handles your data
│       └── src/
│           ├── routes/       ← Handles requests for tabs, bookmarks, history, etc.
│           └── seed.ts       ← Fills the database with starter data
│
├── lib/
│   └── db/
│       └── src/schema/       ← Defines the structure of your database tables
│
└── pnpm-workspace.yaml       ← Connects all the pieces together
```

**Pages you can edit** (inside `artifacts/eon-browser/src/pages/`):
| File | What it controls |
|------|-----------------|
| `Home.tsx` | The homepage with search and shortcuts |
| `Browser.tsx` | The main browsing screen |
| `Tabs.tsx` | The tab switcher (like Chrome's tab view) |
| `Settings.tsx` | All settings and theme options |
| `Bookmarks.tsx` | Your saved bookmarks |
| `History.tsx` | Your browsing history |
| `Downloads.tsx` | Your downloaded files |
| `Intelligence.tsx` | The EoN AI chat |
| `Dashboard.tsx` | Browser stats and sync |
| `Workspaces.tsx` | Profile/workspace switcher |

---

## 4. Publishing to the Web (One-Click Deploy)

This is the easiest way to share EoN Browser with anyone in the world. After publishing, you get a permanent link like:  
`https://eon-browser.yourname.replit.app`

### Step-by-Step Publishing

**Step 1:** Make sure the app is working  
Look at the preview pane. If you see the browser homepage, you are ready.

**Step 2:** Click the **Deploy** button  
In Replit, look at the top-right area of the screen.  
You will see a button that says **"Deploy"** or shows a rocket icon 🚀  
Click it.

**Step 3:** Choose your deployment type  
A panel will appear. You will likely see options like:
- **Autoscale** — Recommended. Scales up when more people visit.
- **Reserved VM** — Runs 24/7 on a dedicated server.

For most users, choose **Autoscale**.

**Step 4:** Review the settings  
Replit will show you:
- The domain name (e.g., `eon-browser.yourname.replit.app`)
- The build command (already set correctly)
- The run command (already set correctly)

You do not need to change anything.

**Step 5:** Click **"Deploy"**  
The deployment process will:
1. Build the production version of the frontend (takes ~30 seconds)
2. Start the API server
3. Run database migrations
4. Make your app live on the internet

**Step 6:** Wait for the green checkmark ✓  
When you see "Deployment successful" or a green status, your browser is live!

**Step 7:** Copy your link  
Replit will show you a URL like:  
`https://eon-browser.yourname.replit.app`  
Copy this link. You can share it with anyone.

---

### After Publishing — Important Notes

- **Your app stays live** even when you close Replit
- **Changes you make** in Replit do NOT automatically update the deployed version
- To update the live version after making changes, you must **re-deploy** (repeat the steps above)
- The free Replit tier may put your app to sleep after inactivity — visitors may see a 10-second loading screen before it wakes up

---

## 5. Building a Production Version Manually

A "production build" is an optimized version of EoN Browser — smaller, faster, and ready to be put on any web server.

### What "Building" Means (Simple Explanation)

During development, the code is written in a human-readable format. When you "build," the computer:
1. Combines all your files into just 2–3 files
2. Removes all unnecessary spaces and comments
3. Compresses the code to make it load faster
4. Creates a folder called `dist/public` with the final files

### How to Build

**In a terminal, run:**
```
pnpm --filter @workspace/eon-browser run build
```

**Wait about 30–60 seconds.**

You will see output like:
```
✓ 2538 modules transformed.
dist/public/index.html        1.38 kB
dist/public/assets/index.css  131.26 kB
dist/public/assets/index.js   630.37 kB
✓ built in 13.98s
```

### Where Are the Built Files?

After building, find your files here:
```
artifacts/eon-browser/dist/public/
├── index.html          ← The main HTML file (entry point)
├── assets/
│   ├── index-xxxxx.css ← All the styles (colors, layout)
│   └── index-xxxxx.js  ← All the app code (compressed)
```

### Hosting the Built Files Anywhere

These files (`index.html` + the `assets/` folder) can be uploaded to ANY web host:

**Free options:**
- **Netlify** → Go to netlify.com → Drag and drop the `dist/public` folder
- **Vercel** → Go to vercel.com → Upload the folder
- **GitHub Pages** → Upload files to a GitHub repository
- **Cloudflare Pages** → Connect your GitHub repo at pages.cloudflare.com

**Important:** EoN Browser's frontend talks to a backend API. If you host just the frontend files on Netlify/Vercel, the data features (tabs, bookmarks, history) will not work unless you also deploy the backend API separately.

---

## 6. Sharing EoN Browser with Others

### Method 1 — Share the Replit Preview Link (Development)

While your app is running in Replit, there is a preview URL you can share. Look for a share icon or URL in the preview pane. This link works only while the app is running and you are in Replit.

Format: `https://[your-replit-username].replit.dev`

**Limitation:** This only works while you have Replit open. If you close Replit, the link stops working.

### Method 2 — Share the Deployed URL (Best for Sharing)

After deploying (see Section 4), you get a permanent link:  
`https://eon-browser.yourname.replit.app`

**This is the best way to share.** Anyone with this link can use EoN Browser from any device.

### Method 3 — Share the Source Code on GitHub

If you want developers to see your code or contribute:

**Step 1:** Create a free account at github.com

**Step 2:** Create a new repository  
- Click the green **"New"** button on GitHub  
- Name it `eon-browser`  
- Keep it Public (so others can see it)  
- Click **"Create repository"**

**Step 3:** Connect your Replit project to GitHub  
In Replit, look for **"Version Control"** or the Git icon in the left sidebar  
Click **"Connect to GitHub"**  
Follow the prompts to connect your account  
Push your code to GitHub

**Step 4:** Share your GitHub link  
Your code will be at: `https://github.com/yourname/eon-browser`

---

## 7. Exporting as a Desktop App (Electron)

Electron lets you wrap EoN Browser into a real desktop application — like a `.exe` file for Windows or `.app` for Mac. Users can install it like a regular program.

### What You Need First

- Node.js installed (see Section 2, Option B, Step 1)
- The project built (`pnpm --filter @workspace/eon-browser run build`)
- About 30 minutes

### Step-by-Step Desktop App Export

**Step 1:** Open a terminal in your project folder

**Step 2:** Install Electron and Electron Builder  
Run this command (only needs to be done once):
```
npm install -g electron electron-builder
```

**Step 3:** Create an Electron main file  
Create a new file called `electron-main.js` in the root of your project.  
Copy and paste this into it:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 850,
    minWidth: 360,
    minHeight: 640,
    title: 'EoN Browser',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your built app
  win.loadFile(path.join(__dirname, 'artifacts/eon-browser/dist/public/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**Step 4:** Create a package.json for Electron  
Create a new file called `electron-package.json` and paste:

```json
{
  "name": "eon-browser",
  "version": "1.0.0",
  "description": "EoN Browser — Premium Mobile Browser",
  "main": "electron-main.js",
  "scripts": {
    "start": "electron .",
    "build-win": "electron-builder --win",
    "build-mac": "electron-builder --mac",
    "build-linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.eonbrowser.app",
    "productName": "EoN Browser",
    "directories": {
      "output": "electron-dist"
    },
    "files": [
      "electron-main.js",
      "artifacts/eon-browser/dist/public/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "icon.icns"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

**Step 5:** Build the frontend first (if you haven't already)
```
pnpm --filter @workspace/eon-browser run build
```

**Step 6:** Test the desktop app (before packaging)
```
electron electron-main.js
```
A window should open showing EoN Browser! If it works, continue to the next step.

**Step 7:** Package for Windows (`.exe`)
```
npx electron-builder --win --config electron-package.json
```

**Step 8:** Package for Mac (`.dmg`)
```
npx electron-builder --mac --config electron-package.json
```

**Step 9:** Package for Linux (`.AppImage`)
```
npx electron-builder --linux --config electron-package.json
```

### Where Are the Desktop App Files?

After packaging, find your files in:
```
electron-dist/
├── EoN Browser Setup 1.0.0.exe    ← Windows installer
├── EoN Browser-1.0.0.dmg          ← Mac disk image
└── EoN Browser-1.0.0.AppImage     ← Linux app
```

**Sharing the desktop app:**  
Share the `.exe`, `.dmg`, or `.AppImage` file directly. The person receiving it installs it like any normal program.

---

## 8. Installing on Android as a PWA

A **PWA (Progressive Web App)** lets Android users install EoN Browser directly to their home screen — it feels like a real app without going through the Play Store. This is the easiest way to get EoN Browser on a phone.

### Requirements
- EoN Browser must be deployed (have a live URL — see Section 4)
- The user must have Chrome on Android

### How to Install (User's Steps)

**Step 1:** Open Chrome on your Android phone

**Step 2:** Go to your EoN Browser URL  
Example: `https://eon-browser.yourname.replit.app`

**Step 3:** Wait for the page to fully load

**Step 4:** Tap the three-dot menu (⋮) in the top right corner of Chrome

**Step 5:** Tap **"Add to Home screen"** or **"Install app"**

**Step 6:** A dialog appears asking "Add EoN Browser to Home screen?"  
Tap **"Add"**

**Step 7:** EoN Browser now appears on your home screen as an app icon!  
Tapping it opens the browser in full-screen mode, without Chrome's address bar.

### Making EoN Browser "More App-like" (Optional Enhancement)

To make the PWA install experience better, add this to your `artifacts/eon-browser/public/manifest.json`:

Create the file if it doesn't exist:
```json
{
  "name": "EoN Browser",
  "short_name": "EoN",
  "description": "Premium power-user mobile browser",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0d0d",
  "theme_color": "#4A9EFF",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Then add this line to your `artifacts/eon-browser/index.html`, inside the `<head>` section:
```html
<link rel="manifest" href="/manifest.json">
```

After rebuilding and redeploying, Chrome will show an "Install" banner automatically.

---

## 9. Updating the Browser After Changes

### Making a Change

**Step 1:** Open the file you want to change  
For example, to change the homepage, open:  
`artifacts/eon-browser/src/pages/Home.tsx`

**Step 2:** Make your edit  
The preview in Replit will update automatically (this is called "hot reload")

**Step 3:** Check the preview looks correct

### Saving Your Changes (Version Control)

In Replit, your changes are automatically saved. But if you want to properly track your changes:

**Using Replit's built-in Git:**
1. Click the **"Version Control"** icon in the left sidebar (looks like a branch/fork icon)
2. You will see a list of changed files
3. Type a short description of what you changed, like: `"Improved homepage layout"`
4. Click **"Commit"**

This saves a snapshot of your changes that you can go back to.

### Updating the Live Deployed Version

After making changes and testing them, you need to redeploy:

**Step 1:** Click the **"Deploy"** button again (same as Section 4)  
**Step 2:** Replit will rebuild and update your live URL automatically  
**Step 3:** The update usually takes 1–3 minutes  
**Step 4:** Refresh your live URL to see the changes

### Rolling Back (Going Back to a Previous Version)

If you made a change that broke something:

**Option A — Use Replit Checkpoints:**  
1. In Replit, look for **"History"** or a clock icon in the left sidebar  
2. You will see a list of previous versions of your project  
3. Click on one to restore it  
4. Click **"Restore"** to go back to that version

**Option B — Use Git to revert:**  
In the terminal:
```
git log --oneline
```
This shows your commit history. Find the commit you want to go back to, copy its ID (the short code on the left), then:
```
git revert [commit-id]
```

---

## 10. Troubleshooting Common Problems

### Problem: "The app is blank / shows nothing"

**Cause:** The server didn't start.  
**Fix:**  
1. In Replit, click the **Run** button  
2. Wait 20 seconds  
3. Refresh the preview pane

---

### Problem: "Tabs/Bookmarks/History not loading (spinning forever)"

**Cause:** The API server (backend) isn't running, or the database doesn't have tables.  
**Fix:**

Run these commands in the terminal:
```
pnpm --filter @workspace/db run push
```
Then restart the API server:
```
PORT=8080 pnpm --filter @workspace/api-server run dev
```

---

### Problem: "Build failed with errors"

**Cause:** Usually a TypeScript error in the code.  
**Fix:**

Run the type checker to see what's wrong:
```
pnpm --filter @workspace/eon-browser run typecheck
```
Read the error message. It will tell you exactly which file and line has a problem.  
Fix that specific line, then try building again:
```
pnpm --filter @workspace/eon-browser run build
```

---

### Problem: "PORT is already in use"

**Cause:** Another process is using port 3000 or 8080.  
**Fix:**

On Mac/Linux, find and kill the process:
```
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

On Windows:
```
netstat -ano | findstr :3000
taskkill /PID [the-number-shown] /F
```

Then try starting again.

---

### Problem: "pnpm command not found"

**Cause:** pnpm is not installed.  
**Fix:**
```
npm install -g pnpm
```
Then close and reopen your terminal.

---

### Problem: "Deployed app shows old version / didn't update"

**Fix:**  
Hard refresh your browser: Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).  
If still showing old version, redeploy via the Deploy button in Replit.

---

### Problem: "Electron app opens but shows blank white screen"

**Cause:** The built files aren't being found.  
**Fix:** Make sure you built the frontend first:
```
pnpm --filter @workspace/eon-browser run build
```
Check that `artifacts/eon-browser/dist/public/index.html` exists.  
Then try running Electron again.

---

### Problem: "PWA install option not appearing on Android"

**Cause:** Chrome only shows the install prompt after you visit the site twice, OR if a `manifest.json` is present.  
**Fix:**  
1. Add the `manifest.json` file (see Section 8)  
2. Make sure the site is served over HTTPS (Replit deployments automatically use HTTPS)  
3. Visit the site, close it, then visit again — the install prompt should appear

---

## 11. Glossary for Beginners

| Word | What it means |
|------|---------------|
| **Frontend** | The visual part of the app — what you see on screen |
| **Backend** | The invisible part that stores and manages data |
| **API** | A way for the frontend to talk to the backend |
| **Database** | A structured place to store information (tabs, bookmarks, etc.) |
| **Build** | Compiling your code into a compressed, fast version for production |
| **Deploy** | Making your app live on the internet |
| **Port** | A numbered "door" that a server listens on (e.g., 3000, 8080) |
| **pnpm** | A tool that installs JavaScript code libraries |
| **TypeScript** | JavaScript with extra rules to catch mistakes early |
| **React** | The library used to build the browser's user interface |
| **Vite** | A fast build tool that compiles the React code |
| **Electron** | A tool to turn web apps into desktop apps |
| **PWA** | Progressive Web App — a website that can be installed like a native app |
| **Hot Reload** | When you save a file and the app automatically updates without refreshing |
| **Commit** | Saving a snapshot of your code changes |
| **Rollback** | Going back to a previous version of your code |
| **Production** | The live, real version of your app that users interact with |
| **Development** | The local version you work on before publishing |
| **dist/public** | The folder containing your final built files |
| **node_modules** | A folder of downloaded code libraries (don't edit this manually) |
| **Environment Variable** | A secret or setting passed to the app at runtime (like PORT) |
| **HTTPS** | Secure version of HTTP — required for PWAs and secure connections |

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Set up database | `pnpm --filter @workspace/db run push` |
| Add starter data | `npx tsx artifacts/api-server/src/seed.ts` |
| Start frontend | `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/eon-browser run dev` |
| Start backend | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| Build for production | `pnpm --filter @workspace/eon-browser run build` |
| Check for code errors | `pnpm --filter @workspace/eon-browser run typecheck` |
| Test desktop app | `electron electron-main.js` |
| Package desktop (Windows) | `npx electron-builder --win` |
| Package desktop (Mac) | `npx electron-builder --mac` |
| Package desktop (Linux) | `npx electron-builder --linux` |

---

## Where Files End Up After Each Action

| Action | Output location |
|--------|----------------|
| `pnpm build` (frontend) | `artifacts/eon-browser/dist/public/` |
| `pnpm build` (backend) | `artifacts/api-server/dist/` |
| Electron build (Windows) | `electron-dist/EoN Browser Setup 1.0.0.exe` |
| Electron build (Mac) | `electron-dist/EoN Browser-1.0.0.dmg` |
| Electron build (Linux) | `electron-dist/EoN Browser-1.0.0.AppImage` |
| Replit Deploy | `https://eon-browser.yourname.replit.app` |

---

*EoN Browser — Built with React, TypeScript, TailwindCSS, Framer Motion, Zustand*  
*Guide version 1.0.0 — May 2026*
