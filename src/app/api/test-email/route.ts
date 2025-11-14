import { NextRequest, NextResponse } from 'next/server';

// Serverless-compatible email function
async function createTransporter() {
  try {
    // Dynamic import to avoid serverless build issues
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default;
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw new Error('Email service unavailable');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing email configuration...');
    
    // Check environment variables
    const emailConfig = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
    };

    console.log('📧 Email Configuration:', emailConfig);

    // If no SMTP configuration, return config info
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
      return NextResponse.json({
        success: false,
        message: 'Email not configured',
        config: emailConfig,
        instructions: {
          step1: 'Set SMTP_USER to your email address (e.g., your.email@gmail.com)',
          step2: 'Set SMTP_PASS to your email app password',
          step3: 'Set ADMIN_EMAIL to where you want to receive error reports',
          step4: 'Optionally set SMTP_FROM for custom from address',
          note: 'Add these to your .env.local file'
        }
      });
    }

    // Create transporter
    const transporter = await createTransporter();

    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Send test email
    const testEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #059669; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-left: 10px; font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ ClassCast Email Test</h1>
        <p>Test email sent at: ${new Date().toISOString()}</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h2>🎉 Email System Working!</h2>
            <p>This is a test email to verify that the ClassCast error reporting system is working correctly.</p>
            
            <h3>📧 Configuration Details:</h3>
            <p><span class="label">SMTP Host:</span><span class="value">${process.env.SMTP_HOST || 'smtp.gmail.com'}</span></p>
            <p><span class="label">SMTP Port:</span><span class="value">${process.env.SMTP_PORT || '587'}</span></p>
            <p><span class="label">From Address:</span><span class="value">${process.env.SMTP_FROM || process.env.SMTP_USER}</span></p>
            <p><span class="label">Admin Email:</span><span class="value">${process.env.ADMIN_EMAIL}</span></p>
            
            <h3>✅ What This Means:</h3>
            <ul>
                <li>Error reports will be sent to: <strong>${process.env.ADMIN_EMAIL}</strong></li>
                <li>Bug reports from students will be emailed to you</li>
                <li>System errors will be automatically reported</li>
                <li>Mobile upload errors will be tracked and sent</li>
            </ul>
            
            <h3>🔧 Next Steps:</h3>
            <p>The email system is now working! You should receive error reports automatically when:</p>
            <ul>
                <li>Students encounter upload errors</li>
                <li>JavaScript errors occur in the app</li>
                <li>API errors happen on the server</li>
                <li>Users submit bug reports manually</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: '✅ ClassCast Email Test - System Working!',
      html: testEmailBody,
    });

    console.log('📧 Test email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      details: {
        messageId: info.messageId,
        to: process.env.ADMIN_EMAIL,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        timestamp: new Date().toISOString()
      },
      config: emailConfig
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Email test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
        SMTP_PORT: process.env.SMTP_PORT || 'NOT SET', 
        SMTP_USER: process.env.SMTP_USER || 'NOT SET',
        SMTP_PASS: process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET',
        SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
      },
      troubleshooting: {
        commonIssues: [
          'SMTP credentials not set in environment variables',
          'Gmail requires app password (not regular password)',
          'SMTP_HOST/PORT incorrect for email provider',
          'Firewall blocking SMTP connection',
          'Email provider requires 2FA setup'
        ],
        gmailSetup: [
          '1. Enable 2-Factor Authentication on Gmail',
          '2. Go to Google Account → Security → App passwords',
          '3. Generate app password for "Mail"',
          '4. Use app password as SMTP_PASS (not your regular password)'
        ]
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Just return current configuration without sending email
  const emailConfig = {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER || 'NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET',
    SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
  };

  return NextResponse.json({
    message: 'Email configuration status',
    config: emailConfig,
    isConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ADMIN_EMAIL),
    instructions: {
      step1: 'Add these to your .env.local file:',
      step2: 'SMTP_USER=your.email@gmail.com',
      step3: 'SMTP_PASS=your_app_password_here',
      step4: 'ADMIN_EMAIL=where_you_want_reports@email.com',
      step5: 'Then POST to /api/test-email to send a test'
    }
  });
}