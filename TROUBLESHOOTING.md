# DemoProject Troubleshooting Guide

## 🚨 **Three Configuration Problems - SOLVED!**

This guide addresses the three main configuration issues that were causing problems with your Next.js setup.

## **Problem 1: `experimental.serverActions` Configuration Error**

### **Error Message:**
```
⚠ Invalid next.config.ts options detected: 
⚠ Expected object, received boolean at "experimental.serverActions"
```

### **Root Cause:**
The `serverActions` option was configured as a boolean (`true`) instead of an object.

### **Solution:**
```typescript
// ❌ WRONG - This causes the error
experimental: {
  serverActions: true,
}

// ✅ CORRECT - This fixes the error
experimental: {
  serverActions: {
    allowedOrigins: ['localhost:3000', '*.vercel.app'],
  },
}
```

## **Problem 2: `swcMinify` Unrecognized Option**

### **Error Message:**
```
⚠ Unrecognized key(s) in object: 'swcMinify'
```

### **Root Cause:**
`swcMinify` is enabled by default in Next.js 13+ and doesn't need to be specified.

### **Solution:**
```typescript
// ❌ WRONG - This causes the error
swcMinify: true,

// ✅ CORRECT - Remove this line entirely
// swcMinify is enabled by default
```

## **Problem 3: Turbopack Compatibility Issues**

### **Error Message:**
```
⨯ You are using configuration and/or tools that are not yet
supported by Next.js with Turbopack:
- Unsupported Next.js configuration option(s) (next.config.js)
  To use Turbopack, remove the following configuration options:
    - experimental.typedRoutes
```

### **Root Cause:**
`experimental.typedRoutes` is not yet supported in Turbopack.

### **Solution:**
```typescript
// ❌ WRONG - This causes Turbopack to fail
experimental: {
  typedRoutes: true, // Not supported in Turbopack yet
}

// ✅ CORRECT - Comment out for Turbopack compatibility
experimental: {
  // typedRoutes: true, // This will cause Turbopack to fail
}
```

## 🔧 **How to Fix These Issues**

### **Option 1: Use the Configuration Switcher Scripts**

#### **Windows:**
```batch
# Check current status
scripts\switch-config.bat status

# Switch to regular mode (recommended for now)
scripts\switch-config.bat regular

# Switch to Turbopack mode (experimental)
scripts\switch-config.bat turbopack
```

#### **Linux/Mac:**
```bash
# Make script executable
chmod +x scripts/switch-config.sh

# Check current status
./scripts/switch-config.sh status

# Switch to regular mode (recommended for now)
./scripts/switch-config.sh regular

# Switch to Turbopack mode (experimental)
./scripts/switch-config.sh turbopack
```

### **Option 2: Manual Configuration**

#### **For Regular Development (Recommended):**
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
    // typedRoutes: true, // Commented out for now
  },
  
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
```

#### **For Turbopack Development:**
```typescript
// next.config.turbopack.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
    // IMPORTANT: No typedRoutes for Turbopack compatibility
  },
  
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
```

## 🚀 **Recommended Development Workflow**

### **Step 1: Use Regular Mode (Recommended)**
```bash
# This will work without any configuration issues
npm run dev
```

### **Step 2: When You Want to Try Turbopack**
```bash
# Switch to Turbopack configuration
scripts\switch-config.bat turbopack  # Windows
./scripts/switch-config.sh turbopack  # Linux/Mac

# Start with Turbopack
npm run dev:turbo
```

### **Step 3: Switch Back to Regular Mode**
```bash
# Switch back to regular configuration
scripts\switch-config.bat regular    # Windows
./scripts/switch-config.sh regular   # Linux/Mac

# Start regular development
npm run dev
```

## 📋 **Current Status**

✅ **Problem 1**: `experimental.serverActions` - FIXED  
✅ **Problem 2**: `swcMinify` - FIXED  
✅ **Problem 3**: `experimental.typedRoutes` - FIXED  

## 🔍 **Verification Steps**

1. **Check Configuration Status:**
   ```bash
   scripts\switch-config.bat status  # Windows
   ./scripts/switch-config.sh status # Linux/Mac
   ```

2. **Test Regular Development:**
   ```bash
   npm run dev
   # Should start without configuration warnings
   ```

3. **Test Turbopack (Optional):**
   ```bash
   scripts\switch-config.bat turbopack  # Windows
   ./scripts/switch-config.sh turbopack # Linux/Mac
   npm run dev:turbo
   # Should start without Turbopack compatibility errors
   ```

## 🎯 **Best Practices**

1. **Use Regular Mode for Development**: Most stable, all features work
2. **Use Turbopack for Testing**: Faster builds, but some features limited
3. **Keep Both Configurations**: Easy switching between modes
4. **Monitor for Updates**: `typedRoutes` support may come in future Turbopack versions

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Clear Next.js Cache:**
   ```bash
   npm run clean
   # or manually delete .next folder
   ```

2. **Restart Development Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

3. **Check File Permissions:**
   ```bash
   # Linux/Mac only
   chmod +x scripts/*.sh
   ```

4. **Verify Configuration Files:**
   - `next.config.ts` should exist and be valid TypeScript
   - `next.config.turbopack.ts` should exist for Turbopack mode

---

**Your Next.js configuration is now fully compatible with both regular development and Turbopack! 🎉**
