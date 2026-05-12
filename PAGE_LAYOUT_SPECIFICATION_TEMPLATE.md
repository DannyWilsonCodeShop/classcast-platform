# Page Layout Specification Template

Use this template to describe page layouts for new applications. The more detail you provide, the more accurate the implementation will be.

## 1. PAGE OVERVIEW

### Basic Information
- **Page Name**: [e.g., "Student Dashboard", "Admin Panel", "User Profile"]
- **User Role**: [e.g., Student, Instructor, Admin, Public]
- **Primary Purpose**: [Brief description of what this page does]
- **Page Type**: [Dashboard, Feed, Form, Detail View, List View, etc.]

### Example (Student Dashboard)
```
Page Name: Student Dashboard
User Role: Student
Primary Purpose: Central hub for students to view assignments, interact with peers, and track progress
Page Type: Dashboard with social feed
```

---

## 2. LAYOUT STRUCTURE

### Grid System
Describe the overall grid layout:
- **Desktop Layout**: [e.g., "3-column grid", "2-column with sidebar", "single column"]
- **Column Proportions**: [e.g., "3/4 main content, 1/4 sidebar", "equal columns", "60/40 split"]
- **Mobile Behavior**: [How columns stack on mobile]

### Example (Student Dashboard)
```
Desktop Layout: 2-column grid (4-column system)
Column Proportions: 
  - Left: 3/4 width (main feed)
  - Right: 1/4 width (sidebar widgets)
Mobile Behavior: Stacks vertically (sidebar moves below feed)
```

---

## 3. HEADER/TOP SECTION

### Header Content
- **Title**: [Static text or dynamic greeting]
- **Subtitle**: [Optional secondary text]
- **Actions**: [Buttons, search, filters, etc.]
- **Sticky**: [Yes/No - does it stay visible when scrolling?]

### Example (Student Dashboard)
```
Title: Dynamic greeting ("Good morning, Danny!")
Subtitle: "Ready to continue your learning journey?"
Actions: None in header (actions in feed composer)
Sticky: No (uses DashboardLayout component)
```

---

## 4. MAIN CONTENT AREA

### Section 1: [Name of first major section]
**Location**: [Left column, right column, full width, etc.]
**Type**: [Feed, List, Grid, Form, etc.]
**Content**: [What displays here]

#### Components/Widgets
1. **[Component Name]**
   - Purpose: [What it does]
   - Position: [Top, middle, bottom, floating]
   - Size: [Full width, card, compact]
   - Interactive: [Yes/No - clickable, expandable, etc.]
   - Data Source: [API endpoint, static, user input]

#### Visual Style
- Background: [Color, gradient, image]
- Borders: [Yes/No, color, rounded corners]
- Shadows: [None, subtle, prominent]
- Spacing: [Tight, normal, spacious]

### Example (Student Dashboard - Main Feed)
```
Section 1: Social Feed
Location: Left column (3/4 width)
Type: Virtualized scrolling feed
Content: Video submissions, community posts, assignments

Components:
1. Post Composer Bar
   - Purpose: Create new community posts
   - Position: Top of feed (sticky)
   - Size: Full width card
   - Interactive: Yes (expandable textarea, checkbox for "Explore" mode)
   - Data Source: User input
   - Visual: Gradient background (blue-50 to purple-50), rounded-xl, shadow-lg

2. Feed Items (Virtualized)
   - Purpose: Display peer videos and posts
   - Position: Scrollable list below composer
   - Size: Full width cards with spacing
   - Interactive: Yes (like, comment, play video)
   - Data Source: /api/student/feed
   - Visual: White cards, rounded-xl, shadow-md, hover effects
```

---

## 5. SIDEBAR/SECONDARY CONTENT

### Widgets/Cards
List each widget in order from top to bottom:

1. **[Widget Name]**
   - Purpose: [What it shows/does]
   - Size: [Compact, medium, large]
   - Update Frequency: [Real-time, on load, manual refresh]
   - Interactive: [Yes/No]
   - Visual Style: [Colors, icons, layout]

### Example (Student Dashboard - Right Sidebar)
```
Widgets (top to bottom):

1. Quick Stats Cards (4 cards)
   - Purpose: Show activity metrics
   - Size: 2x2 grid of compact cards
   - Update Frequency: On page load
   - Interactive: No (display only)
   - Visual: Colored icons, white background, rounded-lg
   - Metrics:
     * Days Active (blue, ClockIcon)
     * Assignments Done (green, AcademicCapIcon)
     * Study Streak (orange, FireIcon)
     * Course Progress (purple, ChartBarIcon)

2. Course Progress Cards
   - Purpose: Show progress in each enrolled course
   - Size: Stacked cards
   - Update Frequency: On page load
   - Interactive: Yes (clickable to course page)
   - Visual: Course color accent, progress bar, rounded-lg

3. Study Streak Widget
   - Purpose: Gamification - show consecutive study days
   - Size: Medium card
   - Update Frequency: Daily
   - Interactive: No
   - Visual: Fire emoji, streak counter, motivational text
```

---

## 6. FEED/LIST ITEMS

If your page has a feed or list of items, describe the item structure:

### Item Types
List each type of item that can appear:

**[Item Type 1]**
- Visual Layout: [Image/video position, text layout]
- Header: [Author info, timestamp, badges]
- Body: [Main content - text, media, etc.]
- Footer: [Actions, stats, metadata]
- Interactions: [Like, comment, share, etc.]

### Example (Student Dashboard - Feed Items)
```
Item Types:

1. Video Submission Item
   - Visual Layout: Video player at top, content below
   - Header: 
     * Avatar (left)
     * Student name + course badge
     * Timestamp (right)
     * Pin/highlight badge (if applicable)
   - Body:
     * Video player (aspect-video, auto-play on scroll)
     * Assignment title
     * Description (rich text)
   - Footer:
     * Like button with count
     * Comment button with count
     * View count
     * Interaction bar (like, comment, share)
   - Interactions: Play/pause, like, comment, share

2. Community Post Item
   - Visual Layout: Text-focused, no media
   - Header: Same as video item
   - Body:
     * Post content (rich text)
     * Daily question prompt (if applicable)
   - Footer: Same interaction bar
   - Interactions: Like, comment
```

---

## 7. INTERACTIVE ELEMENTS

### Buttons
List primary actions and their styling:

**[Button Name]**
- Label: [Text on button]
- Style: [Primary, secondary, ghost, etc.]
- Color: [Blue, green, gradient, etc.]
- Size: [Small, medium, large]
- Icon: [Yes/No, which icon]
- Location: [Where it appears]
- Action: [What happens when clicked]

### Forms/Inputs
**[Input Name]**
- Type: [Text, textarea, select, checkbox, etc.]
- Placeholder: [Placeholder text]
- Validation: [Required, min length, format, etc.]
- Style: [Border, rounded, shadow]

### Example (Student Dashboard)
```
Buttons:

1. Post Composer Toggle
   - Label: "✨ [Daily Question]"
   - Style: Rounded-full, gradient background
   - Color: White to blue-50 gradient
   - Size: Full width, medium height
   - Icon: Sparkles emoji
   - Location: Top of feed
   - Action: Expands textarea for posting

2. Explore Toggle
   - Label: "🔥 Explore"
   - Style: Checkbox with label
   - Color: Blue-700 text, white background
   - Size: Small, compact
   - Icon: Fire icon
   - Location: Right side of post composer
   - Action: Toggles between class feed and all public videos

Inputs:

1. Post Content Textarea
   - Type: Textarea
   - Placeholder: Daily question text
   - Validation: None (optional content)
   - Style: Rounded-xl, blue border, focus ring
   - Rows: 3
   - Auto-focus: Yes
```

---

## 8. RESPONSIVE BEHAVIOR

### Breakpoints
Describe how layout changes at different screen sizes:

**Desktop (lg: 1024px+)**
- [Layout description]

**Tablet (md: 768px - 1023px)**
- [Layout description]

**Mobile (sm: < 768px)**
- [Layout description]

### Example (Student Dashboard)
```
Desktop (lg: 1024px+):
- 4-column grid system
- Feed takes 3 columns, sidebar takes 1 column
- Side-by-side layout
- All widgets visible

Tablet (md: 768px - 1023px):
- Single column layout
- Feed full width
- Sidebar widgets stack below feed
- Reduced padding

Mobile (sm: < 768px):
- Single column, full width
- Compact spacing
- Smaller text sizes
- Touch-friendly button sizes (min 44px)
- Sidebar widgets collapse or hide
```

---

## 9. COLORS & STYLING

### Color Palette
- **Primary**: [Color and usage]
- **Secondary**: [Color and usage]
- **Accent**: [Color and usage]
- **Background**: [Color]
- **Text**: [Primary and secondary text colors]

### Design Tokens
- **Border Radius**: [sm, md, lg, xl, 2xl, full]
- **Shadows**: [sm, md, lg, xl, 2xl]
- **Spacing**: [Tight, normal, spacious]
- **Font Sizes**: [Text sizes used]

### Example (Student Dashboard)
```
Color Palette:
- Primary: Blue-500 (buttons, links)
- Secondary: Purple-500 (accents, highlights)
- Accent: Orange-500 (streak, fire elements)
- Background: Gray-50 (page background)
- Text: Gray-800 (primary), Gray-600 (secondary)

Design Tokens:
- Border Radius: rounded-xl (cards), rounded-full (buttons)
- Shadows: shadow-lg (cards), shadow-md (hover states)
- Spacing: gap-6 (grid), p-4 (card padding)
- Font Sizes: text-sm (body), text-xl (headings)

Gradients:
- Post composer: from-blue-50 to-purple-50
- Buttons: from-blue-500 to-indigo-600
```

---

## 10. DATA & STATE

### Data Sources
List APIs or data sources:

**[Endpoint Name]**
- URL: [API endpoint]
- Method: [GET, POST, etc.]
- Purpose: [What data it provides]
- Refresh: [On load, real-time, manual]

### State Management
**[State Variable]**
- Type: [Array, Object, Boolean, etc.]
- Initial Value: [Default state]
- Updates When: [What triggers updates]
- Used By: [Which components use it]

### Example (Student Dashboard)
```
Data Sources:

1. Feed API
   - URL: /api/student/feed
   - Method: GET
   - Purpose: Fetch video submissions and community posts
   - Refresh: On load, after posting
   - Params: userId, includeAllPublic

2. Connections API
   - URL: /api/connections
   - Method: GET
   - Purpose: Get user's study buddies
   - Refresh: On load

State Management:

1. feed
   - Type: Array<FeedItem>
   - Initial: []
   - Updates: After API fetch, after posting
   - Used By: VirtualizedFeed component

2. includeAllPublicVideos
   - Type: Boolean
   - Initial: false
   - Updates: When explore toggle clicked
   - Used By: Feed filter, API params

3. showPostComposer
   - Type: Boolean
   - Initial: false
   - Updates: When composer button clicked
   - Used By: Post composer visibility
```

---

## 11. SPECIAL FEATURES

### Animations
- [Describe any animations, transitions, or motion]

### Virtualization
- [If using virtual scrolling, describe it]

### Real-time Updates
- [WebSockets, polling, etc.]

### Accessibility
- [Keyboard navigation, screen reader support, ARIA labels]

### Example (Student Dashboard)
```
Animations:
- Smooth scroll to video on focus
- Fade-in for feed items
- Hover scale on cards (scale-105)
- Slide-in for notifications

Virtualization:
- VirtualizedFeed component for performance
- Only renders visible feed items
- Loads more on scroll

Real-time Updates:
- None (refresh on page load)

Accessibility:
- Keyboard navigation for feed
- ARIA labels on interactive elements
- Focus indicators on all buttons
- Alt text on images/videos
```

---

## 12. SIMILAR PAGES (Reference)

If you want a layout similar to an existing page, reference it:

**Reference Page**: [Page name or URL]
**Similarities**: [What to copy]
**Differences**: [What to change]

### Example
```
Reference Page: Student Dashboard (class-cast.com/student/dashboard)
Similarities: 
- 3/4 + 1/4 column layout
- Feed-based main content
- Widget sidebar
- Social interactions

Differences:
- Different data source (products instead of videos)
- No video player (image gallery instead)
- Different color scheme (green instead of blue)
```

---

## QUICK CHECKLIST

When describing a page layout, make sure to include:

- [ ] Page name and purpose
- [ ] Grid layout (columns, proportions)
- [ ] Header content and behavior
- [ ] Main content sections (left to right, top to bottom)
- [ ] Sidebar widgets (if applicable)
- [ ] Feed/list item structure (if applicable)
- [ ] Button styles and actions
- [ ] Form inputs and validation
- [ ] Responsive breakpoints
- [ ] Color palette and styling
- [ ] Data sources and APIs
- [ ] Special features (animations, virtualization, etc.)

---

## EXAMPLE: Complete Specification

Here's how you'd describe the Student Dashboard using this template:

```
PAGE: Student Dashboard

LAYOUT:
- 4-column grid system
- Left: 3 columns (feed)
- Right: 1 column (sidebar)
- Mobile: stacks vertically

HEADER:
- Dynamic greeting: "Good morning, [Name]!"
- Subtitle: "Ready to continue your learning journey?"

LEFT COLUMN (Feed):
1. Post Composer (top, sticky)
   - Gradient background (blue-purple)
   - User avatar + expandable input
   - "Explore" toggle checkbox
   - Daily rotating question prompt

2. Virtualized Feed
   - Video submission cards
   - Community post cards
   - Like/comment interactions
   - Auto-play videos on scroll

RIGHT COLUMN (Sidebar):
1. Quick Stats (4 cards in 2x2 grid)
   - Days Active (blue)
   - Assignments Done (green)
   - Study Streak (orange)
   - Course Progress (purple)

2. Course Progress Cards
   - One per enrolled course
   - Progress bar
   - Clickable to course page

3. Study Streak Widget
   - Fire emoji
   - Streak counter
   - Motivational text

COLORS:
- Primary: Blue-500
- Accent: Purple-500, Orange-500
- Background: Gray-50
- Gradients: Blue-to-purple

DATA:
- /api/student/feed (feed items)
- /api/connections (study buddies)
- Real-time: None
- Refresh: On load, after actions

SPECIAL:
- Virtualized scrolling for performance
- Auto-play videos in viewport
- Responsive: sidebar moves below on mobile
```

---

## TIPS FOR BEST RESULTS

1. **Be Specific**: "Blue button" vs "bg-blue-500 rounded-lg px-4 py-2"
2. **Use Visual References**: "Like the Instagram feed" or "Similar to Twitter's sidebar"
3. **Describe Interactions**: "Clicking opens modal" vs just "button"
4. **Include Edge Cases**: "What shows when feed is empty?"
5. **Mention Performance**: "Virtualized for 1000+ items" vs "Simple list"
6. **Think Mobile-First**: How does it work on phones?
7. **Consider States**: Loading, empty, error, success
8. **Use Screenshots**: If you have a design, share it!

---

With this template, you can describe any page layout clearly and get accurate implementations!
