# App Store Rejection Fixes — Complete

## Apple Rejection Details (June 25, 2026)
Reviewed on iPad Air 11-inch (M3), Version 1.0.0 (3)

---

## Fix 1: Guideline 2.3.10 — Accurate Metadata (Screenshots)

**Issue:** Screenshots showed non-iOS status bar images.

**Fix:** Created `/demo/screenshots` page that renders the student dashboard with 100% mock data:
- Zero real student PII — all fake names (Alex Johnson, Sam Rivera, etc.)
- Stock Unsplash photo avatars
- Generic academic assignments (Video Essay: The American Revolution, Lab Report: Cell Division)
- Gradient placeholders for video thumbnails
- No authentication required — just navigate to `localhost:3003/demo/screenshots`

**Files:**
- `src/lib/demo-screenshot-data.ts` — All mock data
- `src/app/demo/screenshots/page.tsx` — Screenshot-ready dashboard page

**How to capture new screenshots:**
1. Run `npx next dev -p 3003`
2. In the Simulator, navigate to `http://localhost:3003/demo/screenshots`
3. Capture screenshots using Simulator → File → Screenshot (⌘S)
4. These will show proper iOS status bar with no real student data

---

## Fix 2: Guideline 4 — Design (iPad + Safe Areas)

**Issues:** 
- App not optimized for iPad (showed tiny phone frame)
- Bottom nav cut off by home indicator on iPhone

**Fixes:**

### iPad Support
- Updated CSS media queries to use `(hover: hover) and (pointer: fine)` to detect desktops
- Tablets (iPad) now get full-screen mobile layout without the decorative phone frame
- iPad uses `100dvh` height and fills the screen properly

### Safe Area (iPhone)
- Changed `contentInset` from `'automatic'` to `'never'` in `capacitor.config.ts` (gives full CSS control)
- Removed body-level safe area padding from `NativeAppInit` (was causing double-padding)
- Added `native-bottom-nav` CSS class that applies `padding-bottom: env(safe-area-inset-bottom)` only on native devices
- Added `html[data-native]` marker for CSS targeting (set by NativeAppInit on mount)
- Applied `native-bottom-nav` to all 10 student page bottom navigation bars

**Files:**
- `src/components/native/NativeAppInit.tsx` — Simplified, no body padding
- `src/app/globals.css` — iPad detection, native safe area rules
- `capacitor.config.ts` — `contentInset: 'never'`
- All `src/app/student/**/page.tsx` — Added `native-bottom-nav` class

---

## Fix 3: Guideline 1.3 — Kids Category

**Issue:** Kids Category was selected in App Store Connect, but app is for high school students 14+.

**Action Required in App Store Connect:**
- Remove the Kids Category designation
- Set age rating appropriately (17+ not needed, just remove Kids)
- The app targets ages 14-18 in education context

**Code addition (optional, good practice):**
- `src/components/common/AgeGate.tsx` — Age verification component (confirms 14+)
- Can be wired into the auth flow if needed for future submissions

---

## Fix 4: Guideline 5.1.1(v) — Account Deletion

**Issue:** App supports account creation but had no account deletion option.

**Fixes:**
- Created `DELETE /api/auth/delete-account` API endpoint
  - Requires JWT authentication
  - Deletes user record from DynamoDB
  - Cleans up related data (enrollments, submissions, notifications)
  - Returns success/error response
- Updated Settings page (`/student/settings`) with "Danger Zone" section:
  - "Delete My Account" button
  - Confirmation flow requiring user to type "DELETE"
  - Warning about permanent data loss
  - Error handling for network/auth issues
  - On success: clears local storage, logs out, redirects to login

**Files:**
- `src/app/api/auth/delete-account/route.ts` — API endpoint
- `src/app/student/settings/page.tsx` — UI with confirmation flow

**For the resubmission reply to Apple:**
Record a screen recording showing:
1. Login with demo account
2. Navigate to Profile → Settings
3. Scroll to "Danger Zone"
4. Tap "Delete My Account"
5. Type DELETE and confirm
6. Show the deletion completes

---

## Fix 5: Privacy Policy Update (Guideline 5.1.1)

**Enhanced `/privacy` page with:**
- Camera, Microphone & Photo Library usage descriptions
- Explicit statement: data used ONLY for App Functionality, never advertising
- Third-Party SDKs section: explicitly states NO tracking, NO ad SDKs
- COPPA/FERPA compliance details
- Account Deletion instructions (step-by-step)
- Data Retention policy
- User Rights section

**File:** `src/app/privacy/page.tsx`

---

## Deployment Steps

1. Push changes to `main` (triggers AWS Amplify deploy to class-cast.com)
2. After deploy, update capacitor.config.ts:
   - Uncomment: `url: 'https://class-cast.com'`
   - Comment out: `url: 'http://localhost:3003'`
3. Run `npx cap sync ios`
4. Open Xcode: `npx cap open ios`
5. Increment version to 1.0.0 (4)
6. Archive and upload to App Store Connect
7. In App Store Connect:
   - Remove Kids Category designation
   - Upload new screenshots from `/demo/screenshots` (captured on simulator)
   - Update privacy questionnaire to disclose camera, mic, photos (all for App Functionality)
   - Reply to rejection with resolution notes

---

## App Store Connect Privacy Questionnaire Answers

| Data Type | Collected? | Purpose |
|-----------|-----------|---------|
| Name | Yes | App Functionality |
| Email | Yes | App Functionality |
| Photos or Videos | Yes | App Functionality |
| Camera | Yes (on-device only) | App Functionality |
| Microphone | Yes (on-device only) | App Functionality |
| User Content (videos) | Yes | App Functionality |
| Advertising Data | No | — |
| Analytics | No | — |
| Tracking | No | — |

All data is linked to the user's identity. No data is used for tracking.
