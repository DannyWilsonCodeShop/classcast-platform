const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: 'us-east-1' });

async function testVideoSubmissionEmail() {
  const now = new Date().toISOString();
  const emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">📹 New Video Submission</h2>
          
          <p>A student has submitted a new video assignment:</p>
          
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0;"><strong>Student:</strong> Test Student</p>
            <p style="margin: 5px 0;"><strong>Student ID:</strong> test_12345</p>
            <p style="margin: 5px 0;"><strong>Assignment:</strong> Test Video Assignment</p>
            <p style="margin: 5px 0;"><strong>Submission Method:</strong> Upload</p>
            <p style="margin: 5px 0;"><strong>Submitted At:</strong> ${now}</p>
          </div>

          <div style="background: #f9fafb; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0;"><strong>Submission Details:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Submission ID: submission_test_123</li>
              <li>Assignment ID: assignment_test_123</li>
              <li>Course ID: course_test_123</li>
              <li>Duration: 120 seconds</li>
              <li>File Size: 25.5 MB</li>
            </ul>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This is a TEST notification from ClassCast Platform<br>
            Generated at ${new Date().toISOString()}
          </p>
        </div>
      </body>
    </html>
  `;

  const params = {
    Source: 'noreply@myclasscast.com',
    Destination: {
      ToAddresses: ['wilson.danny@me.com'],
    },
    Message: {
      Subject: {
        Data: `📹 TEST: New Video Submission by Test Student`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `
TEST: New Video Submission

Student: Test Student
Student ID: test_12345
Assignment: Test Video Assignment
Submission Method: Upload
Submitted At: ${now}

Submission Details:
- Submission ID: submission_test_123
- Assignment ID: assignment_test_123
- Course ID: course_test_123
- Duration: 120 seconds
- File Size: 25.5 MB

Generated at ${new Date().toISOString()}
          `,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.MessageId);
    console.log('\n📧 Check your inbox at wilson.danny@me.com');
    console.log('⚠️  NOTE: You must verify wilson.danny@me.com first by clicking the verification link AWS sent you.');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    if (error.message.includes('not verified')) {
      console.log('\n⚠️  IMPORTANT: Check your email inbox at wilson.danny@me.com');
      console.log('   AWS SES has sent you a verification link. Click it to verify the email.');
      console.log('   Then run this script again.');
    }
  }
}

testVideoSubmissionEmail();

