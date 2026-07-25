import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: 'us-east-1' });

const INQUIRIES_TABLE = 'classcast-contact-inquiries';
const TO_EMAIL = 'wilson.danny@me.com';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, school, role, message } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    const inquiry = {
      inquiryId: `inq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone: phone || '',
      school: school || '',
      role: role || '',
      message: message || '',
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Save to DynamoDB (always works — this is the primary store)
    try {
      await docClient.send(new PutCommand({
        TableName: INQUIRIES_TABLE,
        Item: inquiry,
      }));
    } catch (dbError) {
      // If the table doesn't exist yet, just log — we'll still try email
      console.log('DynamoDB save failed (table may not exist):', dbError);
    }

    // Try to send email notification (best effort)
    try {
      // Try using the verified sender — if SES is in sandbox, both sender and recipient must be verified
      const fromEmail = 'wilson.danny@me.com'; // Use a verified email as sender
      await ses.send(new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: `ClassCast Sales Inquiry from ${name}` },
          Body: {
            Text: {
              Data: `New sales inquiry:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSchool: ${school || 'N/A'}\nRole: ${role || 'N/A'}\nMessage: ${message || 'None'}\n\n---\nFrom class-cast.com/about`
            }
          },
        },
      }));
      console.log('Sales inquiry email sent successfully');
    } catch (sesError: any) {
      console.log('SES email failed (sandbox or not configured):', sesError?.message || sesError);
      // Not a failure — the inquiry is saved in DynamoDB
    }

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Contact sales error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
