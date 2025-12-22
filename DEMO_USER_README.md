# 🎭 Demo User System

This document explains the demo user functionality that allows viewing another user's data in read-only mode.

## 📋 Demo User Credentials

- **Email**: `demo@email.com`
- **Password**: `Demo1234!`
- **Target User**: `dwilson1919@gmail.com` (the user whose data will be displayed)

## 🎯 What the Demo User Can Do

### ✅ **Allowed Actions (Read-Only)**
- View all pages and interfaces
- Browse assignments and submissions
- See student dashboard and feed
- View profiles and course information
- Navigate through all sections of the platform
- See peer interactions and ratings

### ❌ **Blocked Actions**
- Create, edit, or delete any content
- Submit assignments or responses
- Upload files or videos
- Grade submissions
- Send messages or notifications
- Modify user profiles or settings
- Perform any write operations

## 🚀 How to Use

### 1. **Login**
1. Go to the login page
2. Enter email: `demo@email.com`
3. Enter password: `Demo1234!`
4. Click login

### 2. **Demo Mode Indicators**
- **Blue banner** at the top showing "Demo Mode: Viewing dwilson1919@gmail.com's account"
- **"Read Only" indicator** in the banner
- **"Exit Demo" button** to logout
- All write operations are disabled/hidden

### 3. **Navigation**
- Navigate normally through all pages
- All data shown belongs to `dwilson1919@gmail.com`
- Experience the platform as if you were that user (but read-only)

## 🔧 Technical Implementation

### **Authentication Layer**
- Demo user credentials are hardcoded in `/api/auth/login`
- Special `isDemoUser` flag and `demoViewingUserId` field
- JWT tokens include demo mode information

### **API Middleware**
- All API requests are intercepted for demo users
- `userId` parameters are automatically replaced with target user ID
- Write operations (POST/PUT/DELETE) are blocked
- Special headers added: `X-Demo-Mode`, `X-Demo-Target-User`

### **Frontend Components**
- `DemoModeBanner` component shows demo status
- `useAuthGuard` hook includes demo mode checks
- All write operations are disabled in demo mode
- Read-only indicators throughout the UI

### **Database Queries**
- Demo user queries are redirected to target user's data
- Submissions filtered by target user ID
- Feed shows target user's enrolled courses
- Profile data comes from target user

## 🛠️ Setup Instructions

### **1. Create Demo User in Database**
```bash
node create-demo-user.js
```

### **2. Test Demo Functionality**
```bash
node test-demo-user.js
```

### **3. Manual Testing**
1. Start the development server: `npm run dev`
2. Go to http://localhost:3000/auth/login
3. Login with demo credentials
4. Verify demo banner appears
5. Navigate through the platform
6. Confirm all data belongs to target user
7. Verify write operations are blocked

## 🔍 Verification Checklist

- [ ] Demo user can login successfully
- [ ] Demo banner appears on all pages
- [ ] All data shown belongs to target user
- [ ] Write operations are blocked
- [ ] Navigation works normally
- [ ] "Exit Demo" button logs out properly
- [ ] No errors in browser console
- [ ] API requests include demo headers

## 🚨 Security Considerations

### **Data Protection**
- Demo user can only view one specific user's data
- No access to other users' information
- All write operations are completely blocked
- Session isolation prevents data corruption

### **Access Control**
- Demo mode is clearly indicated to prevent confusion
- Time-limited sessions (standard JWT expiration)
- Audit logging of demo user access
- No persistent changes possible

### **Production Safety**
- Demo user should be disabled in production
- Target user data should be sanitized for demos
- Consider using synthetic demo data instead of real user data

## 🎨 Customization

### **Change Target User**
Update the `demoViewingUserId` in:
- `/api/auth/login` route (test users array)
- `create-demo-user.js` script
- This README documentation

### **Modify Demo Permissions**
Edit the permission checks in:
- `src/lib/demo-mode-utils.ts`
- `src/hooks/useAuthGuard.ts`
- Individual API endpoints

### **Customize Demo Banner**
Modify the banner in:
- `src/components/common/DemoModeBanner.tsx`
- Styling and messaging
- Add/remove functionality

## 📊 Demo Data Requirements

For the best demo experience, ensure the target user (`dwilson1919@gmail.com`) has:
- Complete profile information
- Enrolled in courses with assignments
- Submitted assignments and videos
- Peer interactions and ratings
- Rich feed content

## 🐛 Troubleshooting

### **Demo User Can't Login**
- Check if credentials match exactly
- Verify test users array in `/api/auth/login`
- Check browser console for errors

### **No Demo Banner Showing**
- Verify `DemoModeBanner` is imported and used
- Check if `isDemoUser` flag is set correctly
- Inspect user object in browser dev tools

### **Seeing Wrong User's Data**
- Verify `demoViewingUserId` is set correctly
- Check API middleware is transforming requests
- Look for demo headers in network tab

### **Write Operations Not Blocked**
- Check `useAuthGuard` hook implementation
- Verify permission checks in components
- Test API endpoints directly

## 📝 Notes

- Demo user functionality is designed for showcasing the platform
- All changes are prevented to maintain data integrity
- The system provides a safe way to demonstrate features
- Consider using synthetic data for production demos

---

**Ready to demo!** 🎉

Login with `demo@email.com` / `Demo1234!` and explore the platform safely.