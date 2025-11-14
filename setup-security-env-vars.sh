#!/bin/bash

echo "🔐 ClassCast Security Environment Variables Setup"
echo "=================================================="
echo ""

APP_ID="d166bugwfgjggz"

echo "📋 This script will add critical security environment variables"
echo "   to your AWS Amplify deployment."
echo ""

# Generate a secure JWT secret (in production, you should use your own secure value)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

echo "🔑 Generated secure JWT_SECRET (64 bytes, base64 encoded)"
echo ""

echo "⚠️  IMPORTANT: Save this JWT_SECRET in a secure location!"
echo "   You'll need it if you ever need to manually configure the environment."
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""

read -p "Press Enter to continue with Amplify configuration..."
echo ""

# Add JWT security variables
echo "📦 Adding JWT_SECRET to Amplify..."
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    JWT_SECRET="$JWT_SECRET"

echo ""
echo "📦 Adding JWT expiration settings..."
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    JWT_EXPIRES_IN="7d" \
    JWT_REFRESH_EXPIRES_IN="30d"

echo ""
echo "📦 Adding AWS credentials (from existing environment)..."
if [ ! -z "$AWS_ACCESS_KEY_ID" ] && [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
  aws amplify update-app \
    --app-id $APP_ID \
    --environment-variables \
      AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
      AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
  echo "✅ AWS credentials added"
else
  echo "⚠️  AWS credentials not found in environment"
  echo "   You may need to add them manually in the Amplify console"
fi

echo ""
echo "✅ Security environment variables configured successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Wait 2-3 minutes for Amplify to redeploy"
echo "2. Verify the deployment: https://main.d166bugwfgjggz.amplifyapp.com"
echo "3. Test login and password reset functionality"
echo ""
echo "🔐 Security features now active:"
echo "   ✓ JWT token validation with issuer/audience"
echo "   ✓ Rate limiting for login attempts"
echo "   ✓ Password complexity requirements"
echo "   ✓ Secure password reset tokens"
echo "   ✓ Enhanced encryption (12 rounds bcrypt)"
echo ""
echo "⚠️  Remember to keep your JWT_SECRET secure and never commit it to Git!"
echo ""

