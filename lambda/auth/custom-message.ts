import { CustomMessageTriggerHandler } from 'aws-lambda';

export const handler: CustomMessageTriggerHandler = async (event) => {
  try {
    const { userAttributes, codeParameter } = event.request;
    
    let message = '';
    let emailSubject = '';
    
    // Determine trigger source from event
    const triggerSource = event.triggerSource;
    
    switch (triggerSource) {
      case 'CustomMessage_SignUp':
        message = `
          <html>
            <body>
              <h2>Welcome to DemoProject!</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>Thank you for signing up for DemoProject. To complete your registration, please use the following verification code:</p>
              <h3 style="color: #007bff; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <p>This code will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'Welcome to DemoProject - Verify Your Email';
        break;
        
      case 'CustomMessage_ResendCode':
        message = `
          <html>
            <body>
              <h2>DemoProject Verification Code</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>Here's your new verification code:</p>
              <h3 style="color: #007bff; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <p>This code will expire in 24 hours.</p>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'DemoProject - New Verification Code';
        break;
        
      case 'CustomMessage_ForgotPassword':
        message = `
          <html>
            <body>
              <h2>DemoProject Password Reset</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>We received a request to reset your password. Use the following code to reset your password:</p>
              <h3 style="color: #dc3545; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <p>This code will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'DemoProject - Password Reset Code';
        break;
        
      case 'CustomMessage_UpdateUserAttribute':
        message = `
          <html>
            <body>
              <h2>DemoProject Email Verification</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>Please verify your new email address using the following code:</p>
              <h3 style="color: #007bff; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <p>This code will expire in 24 hours.</p>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'DemoProject - Verify New Email Address';
        break;
        
      case 'CustomMessage_VerifyUserAttribute':
        message = `
          <html>
            <body>
              <h2>DemoProject Attribute Verification</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>Please verify your attribute change using the following code:</p>
              <h3 style="color: #007bff; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <p>This code will expire in 24 hours.</p>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'DemoProject - Verify Attribute Change';
        break;
        
      default:
        // Fallback to default message
        message = `
          <html>
            <body>
              <h2>DemoProject</h2>
              <p>Hello ${userAttributes['given_name'] || 'there'},</p>
              <p>Please use the following code:</p>
              <h3 style="color: #007bff; font-size: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                ${codeParameter}
              </h3>
              <br>
              <p>Best regards,<br>The DemoProject Team</p>
            </body>
          </html>
        `;
        emailSubject = 'DemoProject - Verification Code';
    }
    
    // Set the custom message
    event.response.emailSubject = emailSubject;
    event.response.emailMessage = message;
    
    console.log(`Custom message generated for trigger: ${triggerSource}`);
    return event;
    
  } catch (error) {
    console.error('Error in custom message generation:', error);
    
    // Return event with default message on error
    event.response.emailSubject = 'DemoProject';
    event.response.emailMessage = `Your verification code is: ${event.request.codeParameter}`;
    
    return event;
  }
};
