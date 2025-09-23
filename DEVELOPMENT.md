# ClassCast Platform - Development Setup

## 🚀 Quick Start

This guide will help you set up the ClassCast platform for development and testing.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **AWS Account**: For backend services (optional for basic testing)

## 📋 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/DannyWilsonCodeShop/classcast-platform.git
cd classcast-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# AWS Configuration (Optional - app works with mock data)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
S3_BUCKET_NAME=your_bucket_name
DYNAMODB_TABLE_PREFIX=classcast

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing
1. **Instructor Portal**: Navigate to `/instructor/dashboard`
2. **Student Portal**: Navigate to `/student/dashboard`
3. **Grading Interface**: Navigate to `/instructor/grading/bulk`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── instructor/        # Instructor portal pages
│   ├── student/           # Student portal pages
│   └── api/               # API routes
├── components/            # React components
│   ├── instructor/        # Instructor-specific components
│   ├── student/           # Student-specific components
│   └── common/            # Shared components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── contexts/              # React contexts
```

## 🔧 Key Features to Test

### Instructor Features
- ✅ Course management and creation
- ✅ Assignment creation with dual due dates
- ✅ Video grading interface with AI assistance
- ✅ Peer response analytics
- ✅ Student management

### Student Features
- ✅ Video submission
- ✅ Peer response system with validation
- ✅ Assignment viewing with due dates
- ✅ Community feed

### New Features (Latest)
- ✅ **Dual Due Dates**: Separate deadlines for videos and responses
- ✅ **Response Limits**: Fair distribution of peer responses
- ✅ **Real-time Validation**: Word/character count limits
- ✅ **Enhanced UI**: Clear display of requirements

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
npm run type-check
```

## 📱 Mobile Testing

The application is fully responsive. Test on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS Safari, Android Chrome)
- Tablet devices

## 🔐 Authentication

The app includes mock authentication for testing:
- **Instructor**: Use any email/password
- **Student**: Use any email/password
- **Admin**: Use any email/password

## 📊 Mock Data

The application uses comprehensive mock data including:
- 30+ student submissions
- Multiple courses and assignments
- Peer responses and interactions
- AI grading suggestions

## 🚀 Deployment

### Staging Environment
The `development/testing-branch` is automatically deployed to:
- **Staging URL**: [Will be provided by your hosting platform]

### Production Environment
- **Production URL**: https://main.d166bugwfgjggz.amplifyapp.com
- **Custom Domain**: https://myclasscast.com (when DNS is configured)

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review the GitHub issues
3. Contact the development team

## 🔄 Recent Updates

### Latest Features (v1.2.0)
- Dual due dates for videos and peer responses
- Response limits to ensure fair distribution
- Enhanced peer response validation
- Improved UI/UX for assignment management
- Real-time validation feedback

---

**Happy Testing! 🎉**
