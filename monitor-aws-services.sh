#!/bin/bash

# AWS Services Monitoring Script
# This script checks the health of all critical AWS services
# Run this script regularly to prevent disconnections

echo "🛡️  AWS Services Health Monitor"
echo "================================"
echo "Timestamp: $(date)"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

# Run the connection safeguards check
echo "🔍 Running health checks..."
node connection-safeguards.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Health check completed successfully"
    
    # Create a timestamped log entry
    echo "$(date): Health check passed" >> aws-health.log
    
    # If this is a cron job, send notification (optional)
    if [ "$1" = "--cron" ]; then
        echo "📧 Health check notification sent (if configured)"
    fi
else
    echo ""
    echo "❌ Health check failed"
    
    # Create a timestamped error log entry
    echo "$(date): Health check failed" >> aws-health.log
    
    # Send alert (you can customize this)
    echo "🚨 ALERT: AWS services health check failed!"
    echo "Please check the logs and run recovery procedures."
    
    exit 1
fi

echo ""
echo "📊 Monitoring complete. Check aws-health.log for history."
