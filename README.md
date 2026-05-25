# ADHD Cleaning Checklist — Deploy Instructions

## IMPORTANT: Folder Structure
The files MUST stay in their folders exactly like this:

```
adhd-cleaning-app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx
│   └── main.jsx
└── public/
    └── manifest.json
```

---

## Step 1: GitHub Setup
1. Go to **github.com** and sign in
2. Create a new repository called `adhd-cleaning-app` (set to **Public**)
3. On the new repo page, click **"uploading an existing file"**
4. **Drag the entire unzipped folder** into the upload area (not individual files)
5. Click **"Commit changes"**

## Step 2: Deploy on Vercel
1. Go to **vercel.com** → sign in with GitHub
2. Click **"Add New Project"**
3. Find `adhd-cleaning-app` → click **Import**
4. Leave all settings as default → click **Deploy**
5. Wait ~1 minute → you get a live URL! 🎉

## Step 3: Install on your phone

### Android (Chrome):
1. Open the URL in Chrome
2. Tap ⋮ menu → **"Add to Home screen"**
3. Tap Add ✓

### iPhone (Safari):
1. Open the URL in **Safari** (not Chrome)
2. Tap the Share button ↑
3. Tap **"Add to Home Screen"**
4. Tap Add ✓

---

## Updating the app later
1. Come back to Claude and ask for changes
2. Download the new App.jsx
3. Go to GitHub repo → src/App.jsx → pencil icon → upload new file
4. Vercel updates automatically within 1 minute!
