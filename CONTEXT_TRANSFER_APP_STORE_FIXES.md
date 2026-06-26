# Context Transfer: App Store Rejection Fixes & Demo Mode

## CURRENT STATE
- App is live at `https://class-cast.com` (AWS Amplify, connected to GitHub `main` branch)
- iOS app submitted to App Store Connect under "ClassCast.ai" (Apple ID: 6782478390, Bundle: com.myclasscast.ios)
- Android AAB built and uploaded to Google Play Console (package: com.myclasscast.ios)
- **Apple REJECTED the submission** with these violations:
  1. **1.3.0 Safety: Kids Category** — App is used by minors (high school students). May need Kids category or age-gating.
  2. **2.3.10 Performance: Accurate Metadata** — Screenshots show real student photos/data. Need mock data screenshots.
  3. **4.0.0 Design: Preamble** — Likely safe area issues (bottom bar cut off in WebView).
  4. **5.1.1 Legal: Privacy - Data Collection and Storage** — Need stronger privacy disclosures, especially for camera/photos + student data (COPPA/FERPA).

## WHAT NEEDS TO BE DONE

### 1. Demo Mode for Screenshots (HIGHEST PRIORITY)
Create a login that shows ONLY mock/stock data:
- Fake student name (e.g. "Alex Johnson", "Sam Rivera")
- Stock photo avatars (no real students)
- Generic assignment titles ("Video Essay: The American Revolution", "Lab Report: Cell Division")
- Placeholder video thumbnails (solid color gradients or stock imagery)
- Mock grades, mock courses
- **Purpose**: Take clean screenshots for App Store that contain zero real student PII

### 2. Fix iOS Safe Area Issues
- **Top**: Status bar area (safe-area-inset-top) — content has gap at top
- **Bottom**: Home indicator area (safe-area-inset-bottom) — bottom nav is cut off
- Current CSS in `globals.css` uses `env(safe-area-inset-top/bottom)` but it's not working properly in the Capacitor WebView
- `viewport-fit: cover` is set in layout.tsx
- `contentInset: 'automatic'` in capacitor.config.ts
- Simulator currently points to `http://localhost:3003` for local dev (configured in capacitor.config.ts)

### 3. Address Kids Category (1.3.0)
Options:
- Mark app as "Made for Kids" in App Store Connect (triggers strict rules)
- OR declare it's NOT primarily for kids but is used in education (ages 14-18)
- May need to add age gate or parental consent screen
- Need to ensure no tracking/advertising SDKs (we don't have any)

### 4. Privacy Policy & Data Collection (5.1.1)
- Privacy policy exists at `/privacy` page
- Need to update App Store Connect privacy questionnaire thoroughly
- Must disclose: camera, microphone, photos, name, email, video recordings
- Must state data is used for "App Functionality" not advertising
- May need to add in-app privacy disclosure before camera access

## TECHNICAL DETAILS

### Capacitor Config (capacitor.config.ts)
- Currently set to `url: 'http://localhost:3003'` for local dev
- Production should be `url: 'https://class-cast.com'`
- Run `npx cap sync ios` after changing

### Dev Server
- Start with: `npx next dev -p 3003`
- Simulator loads from localhost when configured for local dev

### Key Files
- `src/app/globals.css` — Safe area CSS rules
- `src/app/layout.tsx` — Viewport meta (viewportFit: cover)
- `capacitor.config.ts` — Server URL config
- `ios/App/App/Info.plist` — Camera/mic permissions
- `src/app/privacy/page.tsx` — Privacy policy page
- `src/lib/demo-mode-middleware.ts` — Existing demo mode middleware (may need expansion)

### Existing Demo Users (from DynamoDB)
- `demo_student_1` — used for demo mode
- There's already a `src/lib/demo-mode-middleware.ts` file that handles some demo routing

### Git Status
- On `main` branch
- All changes pushed
- Last commit: "Fix iOS safe area insets"

### App Store Connect Info
- App Name: ClassCast.ai
- Bundle ID: com.myclasscast.ios
- Apple ID: 6782478390
- Privacy Policy URL: https://class-cast.com/privacy
- Support URL: https://class-cast.com
- Category: Education

### Google Play Console
- Package: com.myclasscast.ios
- AAB at: android/app/release/app-release.aab
- Keystore: android/classcast-release.keystore (password: classcast2026, alias: classcast)

## FILES TO READ IN NEW SESSION
- `src/lib/demo-mode-middleware.ts`
- `src/app/globals.css`
- `capacitor.config.ts`
- `src/app/layout.tsx`
- `src/app/privacy/page.tsx`
- `src/app/student/dashboard/page.tsx`
