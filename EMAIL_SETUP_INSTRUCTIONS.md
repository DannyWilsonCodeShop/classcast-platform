# 📧 Email Setup Instructions for ClassCast Error Reports

## 🚨 **Current Status: Email Not Configured**

You're not receiving error reports because the email system needs to be configured with your email credentials.

---

## 🔧 **Quick Setup (5 minutes)**

### **Step 1: Create Environment File**
Create a file called `.env.local` in your project root:

```bash
# In your ClassCast project directory
touch .env.local
```

### **Step 2: Add Email Configuration**
Add these lines to your `.env.local` file:

```env
# Email Configuration for Error Reports
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=ClassCast Error Reports <your.email@gmail.com>
ADMIN_EMAIL=your.email@gmail.com
```

**Replace with your actual values:**
- `SMTP_USER`: Your Gmail address
- `SMTP_PASS`: Your Gmail app password (NOT your regular password)
- `ADMIN_EMAIL`: Where you want to receive error reports (can be same as SMTP_USER)

---

## 🔑 **Gmail App Password Setup**

### **Why App Password?**
Gmail requires app passwords for security when using SMTP with third-party applications.

### **How to Get Gmail App Password:**

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Turn on 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other" as the device and name it "ClassCast"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

3. **Use App Password**
   - Use this 16-character password as `SMTP_PASS`
   - NOT your regular Gmail password

---

## 📝 **Example Configuration**

Here's what your `.env.local` should look like:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=danny@yourschool.edu
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=ClassCast Alerts <danny@yourschool.edu>
ADMIN_EMAIL=danny@yourschool.edu

# Other environment variables...
DATABASE_URL=your_database_url_here
NEXTAUTH_SECRET=your_nextauth_secret_here
```

---

## 🧪 **Test Email System**

After setting up your `.env.local` file:

### **Method 1: API Test (Recommended)**
```bash
# Start your development server
npm run dev

# In another terminal, test the email:
curl -X POST http://localhost:3000/api/test-email
```

### **Method 2: Check Configuration**
```bash
curl -X GET http://localhost:3000/api/test-email
```

### **Method 3: Trigger Real Error**
- Go to your ClassCast app
- Click the red bug report button in the dashboard
- Submit a test bug report
- Check your email for the report

---

## 📧 **What Emails You'll Receive**

Once configured, you'll automatically get emails for:

### **🐛 JavaScript Errors**
```
Subject: 🚨 ClassCast Error Report - /student/dashboard
- Error message and stack trace
- User information (name, ID, email)
- Page where error occurred
- Browser and device info
```

### **📱 Mobile Upload Errors**
```
Subject: 🚨 ClassCast Error Report - Mobile Upload
- "undefined is not an object (evaluating 'o.size')"
- Mobile device information
- File upload details
- User context
```

### **🔧 API Errors**
```
Subject: 🚨 ClassCast Error Report - API Failure
- API endpoint that failed
- Error status code and message
- Request details
- User making the request
```

### **📝 User Bug Reports**
```
Subject: 🚨 ClassCast Error Report - User Reported
- User description of the problem
- Steps to reproduce
- User contact information
- Page where issue occurred
```

---

## 🔧 **Alternative Email Providers**

### **Outlook/Hotmail**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your.email@outlook.com
SMTP_PASS=your_password_here
```

### **Yahoo Mail**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your.email@yahoo.com
SMTP_PASS=your_app_password_here
```

### **Custom SMTP Server**
```env
SMTP_HOST=mail.yourschool.edu
SMTP_PORT=587
SMTP_USER=your.username
SMTP_PASS=your_password
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **"Authentication failed"**
- ✅ Use app password, not regular password
- ✅ Enable 2-Factor Authentication first
- ✅ Check SMTP_USER is correct email

#### **"Connection refused"**
- ✅ Check SMTP_HOST and SMTP_PORT
- ✅ Ensure firewall allows SMTP connections
- ✅ Try port 465 with secure: true

#### **"Invalid login"**
- ✅ Verify email address is correct
- ✅ Regenerate app password
- ✅ Check for typos in credentials

### **Test Commands:**
```bash
# Check if environment variables are loaded
node -e "console.log(process.env.SMTP_USER)"

# Test SMTP connection
curl -X POST http://localhost:3000/api/test-email
```

---

## ✅ **Verification Checklist**

- [ ] Created `.env.local` file
- [ ] Added SMTP_USER (your email)
- [ ] Generated Gmail app password
- [ ] Added SMTP_PASS (app password)
- [ ] Set ADMIN_EMAIL (where to receive reports)
- [ ] Restarted development server
- [ ] Tested with `/api/test-email`
- [ ] Received test email successfully

---

## 🎯 **Quick Start Commands**

```bash
# 1. Create environment file
echo "SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password_here
ADMIN_EMAIL=your.email@gmail.com" > .env.local

# 2. Edit with your credentials
nano .env.local

# 3. Restart server
npm run dev

# 4. Test email system
curl -X POST http://localhost:3000/api/test-email
```

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check the test endpoint**: `GET /api/test-email` shows current config
2. **Look at server logs**: Check console for SMTP errors
3. **Verify credentials**: Double-check email and app password
4. **Try different provider**: Test with different email service

**Once configured, you'll receive all error reports automatically!** 📧✅