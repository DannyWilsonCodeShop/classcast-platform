# Verification — brand blue #0065a3 + kid-friendly fonts

Iteration: FIRST (no prior review.json present).

Brand blue: `#0065a3` == `rgb(0, 101, 163)`. Old dark blue being replaced: `#005587` == `rgb(0, 85, 135)` (and the even-older navy `#003366` == `rgb(0, 51, 102)` where it drove a card/button/shadow).

## PART A — brand color

### Item 1: card drop-shadows (both portals)
Shared CSS drives the card shadows/borders used across both portals.
- `src/styles/components.css`
  - `.card-professional:hover` box-shadow `rgba(0, 85, 135, …)` -> `rgba(0, 101, 163, …)` (both shadow layers).
  - `.card-subtle` border `rgba(0, 85, 135, 0.1)` -> `rgba(0, 101, 163, 0.1)`.
  - `.border-blue`, `.badge-blue` blue tints `rgba(0, 85, 135, …)` -> `rgba(0, 101, 163, …)`.
- `src/app/globals.css`
  - `.liquid-glass-indicator` box-shadow `rgba(0, 85, 135, 0.1)` -> `rgba(0, 101, 163, 0.1)`.
  - `.btn-gradient-cristo-rey:hover` box-shadow `rgba(0, 51, 102, 0.3)` -> `rgba(0, 101, 163, 0.3)`.

### Item 2: button colors still rendering old dark blue
- `src/styles/components.css` — `.btn-primary` (default/hover/active) and `.btn-secondary:hover`, `.btn-subtle` (+hover) blue shadows/tints `rgba(0, 85, 135, …)` -> `rgba(0, 101, 163, …)`.
- `src/components/instructor/CourseForm.tsx` — submit button `bg-[#003366] hover:bg-[#003366]/90` -> `bg-[#0065a3] hover:bg-[#00517f]`.
- `src/app/globals.css` — modal-open bottom nav background `rgba(0, 85, 135, 0.95)` -> `rgba(0, 101, 163, 0.95)`.

Portal grading Grade/Save buttons already used `bg-[#0065a3]` (left unchanged — already correct).

### Item 3: calendar number
- `src/components/study-hall/TestTrackerCalendar.tsx` — the only calendar component. "Today" cell already used `ring-[#0065a3]` / `text-[#0065a3]`; its month-title font was updated for Part B. No remaining old-blue in the calendar cells.

### Left intentionally unchanged
- Gradient endpoints `#0088cc` / `#0077aa` and the soft tint gradient `.bg-gradient-cristo-rey-soft` (`rgba(0, 51, 102, 0.1)`) — per instructions, gradient endpoints stay.
- Auth/login/logo-setup chrome (`#003366` / `#002244` / `slate-800` in LoginForm/SignupForm/AuthContainer/LogoUpload/logo-setup) — out of the two-portal styling scope; not flagged by the user.
- `'Grand Hotel', cursive` "ClassCast" wordmark — intentional brand script, not a heading/title.

## PART B — kid-friendly fonts (Fredoka headings, Nunito body)

- `src/app/layout.tsx` — replaced `Geist` import with `Fredoka` + `Nunito` via `next/font/google`; exposed `--font-fredoka` (weights 400/500/600/700) and `--font-nunito` (400/600/700/800); `<body>` className now applies `${nunito.variable} ${fredoka.variable} ${geistMono.variable}`.
- `src/app/globals.css` — `--font-geist-sans` now maps to Nunito; added `--font-heading` mapped to Fredoka; `body` uses Nunito; added base rule `h1..h6 { font-family: var(--font-heading); }` and `.font-heading` / `.font-display-style` utilities. Both portals share this root layout, so the change is global.
- `src/styles/typography.css` — removed the Google-Fonts `@import` (Source Serif 4 + Inter); `--font-display` now Fredoka, `--font-primary` now Nunito. This repoints every `.page-title`, `.section-title`, `.card-title`, `.text-display`, `.text-heading` to Fredoka and body text classes to Nunito.
- Replaced hardcoded inline `fontFamily: "'Source Serif 4', Georgia, serif"` (which would otherwise override the global rule) with `var(--font-fredoka), Fredoka, sans-serif` on the "Dashboard", "Assignments", "Recent Videos", "Grades", "My Courses", "Create Assignment", "Welcome to ClassCast", Study Hall, calendar month, and ChoiceBoard titles in:
  - `src/app/student/dashboard/page.tsx`, `src/app/student/courses/page.tsx`, `src/app/student/courses/[courseId]/page.tsx`, `src/app/student/grades/page.tsx`
  - `src/app/instructor/dashboard/page.tsx`, `src/app/instructor/assignments/create/page.tsx`
  - `src/app/study-hall/page.tsx`, `src/components/study-hall/TestTrackerCalendar.tsx`, `src/components/student/ChoiceBoard.tsx`

## Checks run
- `npx next build --no-lint` -> completed successfully (Middleware / Static / Dynamic route tables printed; exit 0).
- Grep after edits: no `rgb(0, 85, 135)` remaining in any CSS; the only `rgb(0, 51, 102)` left is the intentional soft-tint gradient endpoint.
- Grep confirms `--font-fredoka` / `--font-nunito` / `--font-heading` wired in layout.tsx + globals.css + typography.css; no leftover `geistSans`, `Source Serif`, or `Geist()` references.
- Staged only the 14 changed source files by name; `docs/aws-architecture.drawio` and the two `scripts/*thumbnails*.mjs` left untracked/untouched.
