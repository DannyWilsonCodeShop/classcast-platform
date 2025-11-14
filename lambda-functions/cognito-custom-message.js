/**
 * AWS Lambda function for Cognito Custom Message Trigger
 * This function customizes the email verification message to include a verification link
 */

exports.handler = async (event) => {
    console.log('Cognito Custom Message Trigger:', JSON.stringify(event, null, 2));

    const { triggerSource, request, response } = event;

    // Handle email verification
    if (triggerSource === 'CustomMessage_VerifyUserAttribute' || 
        triggerSource === 'CustomMessage_AdminCreateUser') {
        
        const verificationCode = request.codeParameter;
        const userName = request.userName;
        const userEmail = request.userAttributes.email;
        
        // Create verification link
        const verificationLink = `https://${process.env.DOMAIN_NAME || 'main.d166bugwfgjggz.amplifyapp.com'}/verify-email?email=${encodeURIComponent(userEmail)}&code=${verificationCode}`;
        
        // Custom HTML email template
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your ClassCast Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #4A90E2; }
        .logo { font-size: 24px; font-weight: bold; color: #4A90E2; }
        .content { padding: 30px 0; }
        .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #357ABD; }
        .code { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; border: 1px solid #e9ecef; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MyClassCast</div>
            <h1>Welcome to ClassCast!</h1>
        </div>
        
        <div class="content">
            <p>Hi there!</p>
            
            <p>Thank you for signing up for ClassCast. To complete your account setup, please verify your email address.</p>
            
            <p><strong>Two ways to verify your email:</strong></p>
            
            <div style="margin: 20px 0;">
                <p><strong>Option 1: Click the verification link (Recommended)</strong></p>
                <a href="${verificationLink}" class="button">Verify My Email</a>
            </div>
            
            <div style="margin: 20px 0;">
                <p><strong>Option 2: Enter the verification code manually</strong></p>
                <p>If the link doesn't work, you can enter this code on the verification page:</p>
                <div class="code">${verificationCode}</div>
                <p>Visit: <a href="https://${process.env.DOMAIN_NAME || 'main.d166bugwfgjggz.amplifyapp.com'}/verify-email?email=${encodeURIComponent(userEmail)}">https://${process.env.DOMAIN_NAME || 'main.d166bugwfgjggz.amplifyapp.com'}/verify-email?email=${encodeURIComponent(userEmail)}</a></p>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This verification code will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification code.
            </div>
            
            <p>If you didn't create an account with ClassCast, please ignore this email.</p>
            
            <p>Best regards,<br>The ClassCast Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${userEmail}</p>
            <p>© 2024 ClassCast. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        // Plain text version
        const textBody = `
Welcome to ClassCast!

Thank you for signing up for ClassCast. To complete your account setup, please verify your email address.

Two ways to verify your email:

Option 1: Click the verification link (Recommended)
${verificationLink}

Option 2: Enter the verification code manually
If the link doesn't work, you can enter this code on the verification page:
${verificationCode}

Visit: https://${process.env.DOMAIN_NAME || 'main.d166bugwfgjggz.amplifyapp.com'}/verify-email?email=${encodeURIComponent(userEmail)}

Important: This verification code will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification code.

If you didn't create an account with ClassCast, please ignore this email.

Best regards,
The ClassCast Team

This email was sent to ${userEmail}
© 2024 ClassCast. All rights reserved.
`;

        // Update the response
        response.emailSubject = 'Verify Your ClassCast Account';
        response.emailMessage = textBody;
        
        // For HTML emails, we need to use SES directly or modify the Cognito configuration
        // For now, we'll use the text version but include HTML in the message
        response.emailMessage = htmlBody;
    }

    return event;
};
