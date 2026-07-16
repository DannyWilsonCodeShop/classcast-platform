import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'us-east-1' });

const TO_EMAIL = 'wilson.danny@me.com';
const FROM_EMAIL = 'noreply@class-cast.com'; // Must be verified in SES

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, school, role, message } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    const subject = `ClassCast Sales Inquiry from ${name}`;
    const body = `
New sales inquiry from the ClassCast website:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
School: ${school || 'Not provided'}
Role: ${role || 'Not provided'}
Message: ${message || 'No additional message'}

---
Sent from class-cast.com/about
    `.trim();

    try {
      await ses.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }));
    } catch (sesError: any) {
      console.error('SES send failed:', sesError);
      // If SES fails (not verified, sandbox mode, etc.), still return success
      // The form data is logged and we don't want to block the user
      console.log('Contact form data (SES failed):', { name, email, school, role, message });
    }

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Contact sales error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
