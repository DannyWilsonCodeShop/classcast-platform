# ClassCast Platform Testing Checklist

## 🎯 **Testing Overview**
This checklist covers all major functionality of the ClassCast video assignment platform.

## 📋 **Phase 1: Basic App Access**

### ✅ Homepage Testing
- [ ] **URL**: `http://localhost:3001` or `https://myclasscast.com`
- [ ] **Check**: ClassCast logo and branding visible
- [ ] **Check**: "Sign In" and "Sign Up" buttons present
- [ ] **Check**: Navigation menu works
- [ ] **Check**: Responsive design on mobile/tablet
- [ ] **Check**: Dark mode toggle (if available)

### ✅ Legal Pages Testing
- [ ] **Terms Page**: `http://localhost:3001/terms`
  - [ ] Page loads without errors
  - [ ] Content is properly formatted
  - [ ] All sections are readable
- [ ] **Privacy Page**: `http://localhost:3001/privacy`
  - [ ] Page loads without errors
  - [ ] Content is properly formatted
  - [ ] All sections are readable

## 🔐 **Phase 2: Authentication System**

### ✅ User Registration
- [ ] **URL**: `http://localhost:3001/auth/signup`
- [ ] **Test Case 1**: Valid Student Registration
  - Email: `teststudent@example.com`
  - First Name: `Test`
  - Last Name: `Student`
  - Password: `TestPassword123!`
  - Role: `Student`
  - Student ID: `TEST001`
  - [ ] Registration successful
  - [ ] Redirected to login page
  - [ ] Success message displayed

- [ ] **Test Case 2**: Valid Instructor Registration
  - Email: `testinstructor@example.com`
  - First Name: `Test`
  - Last Name: `Instructor`
  - Password: `TestPassword123!`
  - Role: `Instructor`
  - Instructor ID: `INST001`
  - Department: `Computer Science`
  - [ ] Registration successful
  - [ ] Redirected to login page
  - [ ] Success message displayed

- [ ] **Test Case 3**: Invalid Registration
  - [ ] Try with existing email (should fail)
  - [ ] Try with weak password (should fail)
  - [ ] Try with missing required fields (should fail)
  - [ ] Try with invalid email format (should fail)

### ✅ User Login
- [ ] **URL**: `http://localhost:3001/auth/login`
- [ ] **Test Case 1**: Login with existing instructor
  - Email: `instructor@classcast.com`
  - Password: `Instructor123!`
  - [ ] Login successful
  - [ ] Redirected to instructor dashboard

- [ ] **Test Case 2**: Login with existing student
  - Email: `student@classcast.com`
  - Password: `Student123!`
  - [ ] Login successful
  - [ ] Redirected to student dashboard

- [ ] **Test Case 3**: Login with admin
  - Email: `admin@classcast.com`
  - Password: `Admin123!`
  - [ ] Login successful
  - [ ] Redirected to appropriate dashboard

- [ ] **Test Case 4**: Invalid Login
  - [ ] Wrong password (should fail)
  - [ ] Non-existent email (should fail)
  - [ ] Empty fields (should fail)

### ✅ Password Reset
- [ ] **URL**: `http://localhost:3001/auth/forgot-password`
- [ ] **Test**: Enter valid email address
- [ ] **Expected**: Appropriate response (may not send actual email in dev)

## 👨‍🎓 **Phase 3: Student Features**

### ✅ Student Dashboard
- [ ] **URL**: `http://localhost:3001/student/dashboard`
- [ ] **Check**: Dashboard loads without errors
- [ ] **Check**: Student-specific content displayed
- [ ] **Check**: Navigation menu works
- [ ] **Check**: Assignment overview visible
- [ ] **Check**: Progress tracking elements present

### ✅ Student Assignments
- [ ] **URL**: `http://localhost:3001/student/assignments`
- [ ] **Check**: Assignment list loads
- [ ] **Check**: Filter options work
- [ ] **Check**: Search functionality works
- [ ] **Check**: Assignment details can be viewed
- [ ] **Check**: Due dates and status displayed

### ✅ Video Submission
- [ ] **URL**: `http://localhost:3001/student/video-submission`
- [ ] **Check**: Upload interface loads
- [ ] **Check**: File selection works
- [ ] **Check**: Video preview works (if video selected)
- [ ] **Check**: Form validation works
- [ ] **Test**: Try uploading a small test video

### ✅ Submission History
- [ ] **URL**: `http://localhost:3001/student/submissions`
- [ ] **Check**: Submission list loads
- [ ] **Check**: Filter options work
- [ ] **Check**: Submission details can be viewed
- [ ] **Check**: Status and grades displayed

## 👨‍🏫 **Phase 4: Instructor Features**

### ✅ Instructor Dashboard
- [ ] **URL**: `http://localhost:3001/instructor/dashboard`
- [ ] **Check**: Dashboard loads without errors
- [ ] **Check**: Instructor-specific content displayed
- [ ] **Check**: Class management tools visible
- [ ] **Check**: Assignment creation options present
- [ ] **Check**: Student progress overview

## 🔧 **Phase 5: API Endpoints**

### ✅ Health Check
- [ ] **URL**: `http://localhost:3001/api/health`
- [ ] **Expected Response**: `{"status": "ok"}`

### ✅ Authentication APIs
- [ ] **Login API**: `POST http://localhost:3001/api/auth/login`
  - [ ] Test with valid credentials
  - [ ] Test with invalid credentials
  - [ ] Check response format

- [ ] **Signup API**: `POST http://localhost:3001/api/auth/signup`
  - [ ] Test with valid data
  - [ ] Test with invalid data
  - [ ] Check response format

- [ ] **User Info API**: `GET http://localhost:3001/api/auth/me`
  - [ ] Test when logged in
  - [ ] Test when not logged in

### ✅ Other APIs
- [ ] **Users API**: `GET http://localhost:3001/api/users`
- [ ] **Submissions API**: `GET http://localhost:3001/api/submissions`
- [ ] **Upload API**: `POST http://localhost:3001/api/upload`

## 🧪 **Phase 6: Test Pages**

### ✅ Authentication Testing
- [ ] **URL**: `http://localhost:3001/test-auth`
- [ ] **Test**: Mock authentication button
- [ ] **Test**: Login/logout functionality
- [ ] **Test**: Auth status checking

### ✅ Signup Testing
- [ ] **URL**: `http://localhost:3001/test-signup`
- [ ] **Test**: Signup form functionality
- [ ] **Test**: Validation messages

### ✅ Background Testing
- [ ] **URL**: `http://localhost:3001/test-background`
- [ ] **Test**: Background processes

## 🌐 **Phase 7: Production Testing**

### ✅ Live Site Testing
- [ ] **URL**: `https://myclasscast.com`
- [ ] **Check**: Site loads correctly
- [ ] **Check**: All pages accessible
- [ ] **Check**: Authentication works
- [ ] **Check**: Database connectivity
- [ ] **Check**: File uploads work
- [ ] **Check**: SSL certificate valid

## 🐛 **Bug Reporting Template**

For any issues found, document:
- **Page/Feature**: Which page or feature
- **Steps to Reproduce**: Exact steps taken
- **Expected Result**: What should happen
- **Actual Result**: What actually happened
- **Browser/Device**: Browser and device used
- **Screenshot**: If applicable

## ✅ **Testing Completion**

- [ ] All Phase 1 tests completed
- [ ] All Phase 2 tests completed
- [ ] All Phase 3 tests completed
- [ ] All Phase 4 tests completed
- [ ] All Phase 5 tests completed
- [ ] All Phase 6 tests completed
- [ ] All Phase 7 tests completed
- [ ] All bugs documented and reported
- [ ] App ready for production use

---

**Testing Date**: ___________
**Tester**: ___________
**App Version**: ___________
**Notes**: ___________
