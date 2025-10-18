# 📱 Social Media-Style Student Dashboard - Demo Guide

## 🚀 Live Demo URL

**Development Environment:**  
https://development-testing-branch.d166bugwfgjggz.amplifyapp.com/student/dashboard-new

---

## 🎯 What to Expect

### **Layout Overview:**

```
┌────────────────────────────────────────────────┐
│ ClassCast | [Post to community...] | 🏫        │ ← Top Bar
├────────────────────────────────────────────────┤
│                                                │
│  💬 Study Group this Saturday! (2d ago)        │
│  "Anyone want to join a study group..."        │
│  ❤️ 15  💬 5                                   │
│                                                │
│  📝 Essay: Romeo & Juliet [ENG] (Active)       │
│  Due: Nov 21, 2025 at 11:59 PM                 │
│  [View Assignment]                             │
│                                                │
│  💬 Need help with quadratic equations         │
│  "Can someone explain how to..."               │
│  ❤️ 8  💬 3                                    │
│                                                │
│  📝 WWII Research Presentation [HIS]           │
│  Due: Dec 2, 2025                              │
│                                                │
├────────────────────────────────────────────────┤
│  [MAT] [ENG] [HIS]    [+]    [👤]             │ ← Bottom Nav
│   3️⃣    2️⃣    1️⃣    Join   Profile           │
└────────────────────────────────────────────────┘
```

---

## 📊 Demo Content Created

### **Courses (3 total):**

1. **MAT** - Integrated Mathematics 2 (102 students)
2. **ENG** - English Literature I (20 students)  
3. **HIS** - World History (20 students)

### **Community Posts (5):**

1. 📚 "Study Group this Saturday!"
2. ❓ "Need help with quadratic equations"
3. 💡 "Great resource found!"
4. 😰 "Test anxiety tips?"
5. 🎵 "Favorite study music?"

### **Assignments (4):**

| Assignment | Course | Status | Due Date |
|------------|--------|--------|----------|
| Quadratic Functions Project | MAT | 🟢 Upcoming | +7 days |
| Essay: Romeo & Juliet | ENG | 🟡 Active | +3 days |
| WWII Research Presentation | HIS | 🟢 Upcoming | +14 days |
| Math Practice Problems | MAT | 🔴 Past Due | -2 days |

---

## 🎮 Interactive Features to Test

### **1. Course Filtering:**
- Click **[MAT]** button → See only MAT250 content
- Click **[ENG]** button → See only ENG101 content
- Click **[HIS]** button → See only HIS201 content
- Click **"Show All"** → See everything

### **2. Post to Community:**
- Click "Post to community..." at top
- Write a message
- Click Post
- See it appear in feed immediately

### **3. Bottom Navigation:**
- **[MAT] [ENG] [HIS]** - Course filter buttons
- **[+]** - Join new class (goes to enrollment page)
- **[👤]** - Your profile (goes to profile page)

### **4. Feed Interactions:**
- ❤️ Like buttons (UI ready, backend needed)
- 💬 Comment buttons (UI ready, backend needed)
- Course badges show on each item

---

## 🎨 Design Features

### **Mobile-First:**
- Optimized for phone screens
- Touch-friendly buttons
- Sticky header and footer
- Max width 2xl (672px)

### **Social Media Aesthetics:**
- Instagram/TikTok-inspired layout
- Clean, minimal design
- Relative timestamps ("2h ago", "3d ago")
- Visual hierarchy

### **Color Coding:**
- 🟢 Green assignments: 7+ days away
- 🟡 Yellow assignments: < 7 days
- 🔴 Red assignments: Past due
- Blue badges for course tags

---

## 📝 Feed Content Mix

The feed shows a **chronological mix** of:

1. **Community Posts** - Student discussions
2. **Assignments** - Color-coded by status
3. **Videos** - (Ready when video submissions table exists)

All sorted by timestamp, newest first.

---

## 🔄 What Students See

**Students enrolled in all 3 courses will see:**
- Mixed feed of MAT, ENG, and HIS content
- 3 course buttons in bottom nav
- Ability to filter by course
- Community posts from all classmates
- Assignments from all enrolled courses

**Students in only MAT250:**
- Only 1 course button [MAT]
- Only MAT250 assignments
- All community posts (global)

---

## 🧪 Testing Checklist

- [ ] Visit `/student/dashboard-new`
- [ ] See mixed feed content
- [ ] Click [MAT] → Filter to MAT only
- [ ] Click [ENG] → Filter to ENG only
- [ ] Click "Show All" → See everything
- [ ] Click "Post to community..." → Create post
- [ ] Check bottom nav shows 3 courses
- [ ] Try clicking [+] Join button
- [ ] Try clicking [👤] Profile button
- [ ] Verify assignments color-coded correctly
- [ ] Test on mobile device/responsive mode

---

## 📱 Access

**Dev Site:** https://development-testing-branch.d166bugwfgjggz.amplifyapp.com  
**New Feed:** `/student/dashboard-new`  
**Old Dashboard:** `/student/dashboard` (unchanged)

---

## 🎯 Next Steps

Once you've tested and like it:
1. We can add video submissions to the feed
2. Hook up like/comment functionality
3. Add pull-to-refresh
4. Implement notifications count on course buttons
5. Replace old dashboard with new one
6. Merge to production

---

**Enjoy exploring the new social feed!** 🚀

