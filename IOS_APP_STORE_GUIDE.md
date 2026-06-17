# ClassCast iOS App - App Store Deployment Guide

## Overview

ClassCast uses **Capacitor** to wrap the Next.js web app into a native iOS app. This gives you a real native app shell with access to device APIs (camera, push notifications, haptics) while reusing 100% of your existing web codebase.

---

## Architecture

```
┌────────────────────────────────┐
│     Apple App Store            │
├────────────────────────────────┤
│     Native iOS Shell           │
│     (Capacitor + WKWebView)    │
├────────────────────────────────┤
│     Next.js Static Export      │
│     (HTML/CSS/JS in WebView)   │
├────────────────────────────────┤
│     ClassCast API              │
│     (AWS: DynamoDB, S3, etc.)  │
└────────────────────────────────┘
```

---

## Prerequisites

1. **macOS** with Xcode 15+ installed
2. **Apple Developer Account** ($99/year) - https://developer.apple.com
3. **Node.js 18+** and npm
4. **CocoaPods** (if not installed): `sudo gem install cocoapods`

---

## Quick Start (Development)

```bash
# 1. Build the Next.js app for mobile
npm run build:mobile

# 2. Sync web assets to iOS project
npm run cap:sync

# 3. Open in Xcode
npm run cap:open:ios

# Or do all at once:
npm run cap:build:ios
```

### Live Reload During Development

For faster development, point Capacitor at your dev server:

1. Edit `capacitor.config.ts` and uncomment the `server.url` line:
   ```ts
   server: {
     url: 'http://YOUR_LOCAL_IP:3000',
     cleartext: true,
   }
   ```
2. Run `npm run dev` in one terminal
3. Run `npm run cap:run:ios` to launch on simulator/device

---

## Project Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift      # Native app entry point
│   │   ├── Info.plist             # iOS permissions & config
│   │   ├── Assets.xcassets/       # App icons & images
│   │   └── Base.lproj/           # Storyboards
│   ├── App.xcodeproj/            # Xcode project
│   └── CapApp-SPM/               # Capacitor Swift Package
├── .gitignore
└── debug.xcconfig

src/lib/capacitor.ts               # Native bridge utilities
src/components/native/NativeAppInit.tsx  # Native init component
capacitor.config.ts                # Capacitor configuration
next.config.mobile.ts              # Static export config for mobile
```

---

## Building for App Store Release

### Step 1: Prepare Assets

#### App Icon
Generate all required sizes from your logo. You need:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 76x76 (iPad @1x)

Place them in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Quick way:** Use https://appicon.co or run:
```bash
# Install imagemagick if needed: brew install imagemagick
sips -z 1024 1024 public/UpdatedCCLogo.png --out ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png
```

#### Splash Screen
The splash screen is configured in `capacitor.config.ts`. Update `ios/App/App/Assets.xcassets/Splash.imageset/` with your branded splash image (Cristo Rey blue #005587 background with the ClassCast logo).

### Step 2: Configure Signing

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the **App** target → **Signing & Capabilities**
3. Set your **Team** (Apple Developer account)
4. Set **Bundle Identifier**: `com.classcast.app`
5. Xcode will auto-manage provisioning profiles

### Step 3: Build Production

```bash
# Build static export
npm run build:mobile

# Sync to iOS
npx cap sync ios

# Open Xcode
npx cap open ios
```

In Xcode:
1. Set scheme to **App** → **Any iOS Device (arm64)**
2. Product → Archive
3. Once archived, click **Distribute App**
4. Choose **App Store Connect**
5. Upload

### Step 4: App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Create a new app:
   - **Bundle ID**: com.classcast.app
   - **Name**: ClassCast
   - **Primary Language**: English (U.S.)
   - **Category**: Education
3. Fill in metadata:
   - **Subtitle**: Smart Learning Platform
   - **Description**: (see below)
   - **Keywords**: education, learning, LMS, video, assignments, students, classroom
   - **Support URL**: Your support page URL
   - **Privacy Policy URL**: Your privacy policy URL

### App Store Description (suggested)

> ClassCast is a modern learning management platform designed for students and instructors. Submit video assignments, track grades, access lesson modules, and stay connected with your courses — all from your iPhone.
>
> Features:
> • View and submit video assignments
> • Track your grades and course progress
> • Access lesson modules and study materials
> • Receive push notifications for deadlines
> • Interactive quizzes and study tools
> • Secure login with role-based access

### Step 5: Screenshots

Required sizes:
- 6.7" (iPhone 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 14 Plus): 1284 x 2778
- 5.5" (iPhone 8 Plus): 1242 x 2208
- 12.9" iPad Pro: 2048 x 2732

Use the iOS Simulator to capture screenshots of key screens (login, dashboard, assignments, grades).

---

## App Review Checklist

Apple will review your app. Make sure:

- [ ] App doesn't crash on launch
- [ ] Login works with a demo account (provide credentials in review notes)
- [ ] All declared permissions have valid usage descriptions
- [ ] Privacy policy URL is accessible
- [ ] No placeholder content visible
- [ ] Camera/photo permissions only requested when needed
- [ ] Push notifications work (or are optional)
- [ ] App provides value beyond just a website wrapper (native features)

**Review Notes (provide to Apple):**
```
Demo login credentials:
Email: studentdemo@myclasscast.com
Password: DannysCodeShop

This app provides native push notifications, haptic feedback,
and optimized mobile-first experience for our educational platform.
```

---

## Native Features Included

| Feature | Plugin | Status |
|---------|--------|--------|
| Push Notifications | @capacitor/push-notifications | ✅ Ready |
| Camera (video assignments) | @capacitor/camera | ✅ Ready |
| Haptic Feedback | @capacitor/haptics | ✅ Ready |
| Status Bar control | @capacitor/status-bar | ✅ Ready |
| Splash Screen | @capacitor/splash-screen | ✅ Ready |
| Keyboard management | @capacitor/keyboard | ✅ Ready |
| App lifecycle | @capacitor/app | ✅ Ready |

---

## Environment Configuration

For the iOS app to talk to your production API, update `capacitor.config.ts`:

```ts
server: {
  // Production: leave this commented out — app uses bundled static files
  // and makes API calls to your production URL configured in the app

  // Development: uncomment to use live reload
  // url: 'http://192.168.1.100:3000',
  // cleartext: true,
}
```

Your API base URL should be configured in your environment/auth setup to point to production (e.g., `https://api.myclasscast.com` or your Vercel deployment).

---

## Updating the App

After making changes to the web app:

```bash
# Build and sync
npm run build:mobile && npx cap sync ios

# Open Xcode, increment version number, archive, and upload
npx cap open ios
```

Bump the version in Xcode (General → Version and Build) before each App Store submission.

---

## Troubleshooting

### "capacitor.config.ts not found"
Run from the project root directory.

### White screen on launch
Make sure `out/` directory exists after build. Check that `webDir` in capacitor.config.ts points to `out`.

### API calls failing
The iOS app needs to reach your backend. If using local dev, make sure your Mac's IP is accessible from the simulator. For production, ensure CORS headers allow the Capacitor origin (`capacitor://localhost`).

### Push notifications not working
1. Ensure you have an APNs key configured in Apple Developer Portal
2. Add the Push Notifications capability in Xcode
3. Configure your server to send via APNs

---

## Cost Summary

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Capacitor (open source) | Free |
| App Store submission | Free (included with dev account) |
