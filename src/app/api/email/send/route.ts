import { NextRequest, NextResponse } from 'next/server';
import { queueEmail } from '@/lib/email/emailQueue';
import { type EmailData } from '@/lib/email/emailService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth.config';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.to || !data.subject || (!data.text && !data.html)) {
      return NextResponse.json(
        { error: 'Missing required fields (to, subject, and either text or html)' },
        { status: 400 }
      );
    }

    // Prepare email data
    const emailData: EmailData = {
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments
    };

    // Queue the email
    const jobId = await queueEmail(emailData, {
      priority: data.priority,
      delay: data.delay
    });

    return NextResponse.json({ success: true, jobId }, { status: 200 });
  } catch (error) {
    console.error('Error queuing email:', error);
    return NextResponse.json(
      { error: 'Failed to queue email', details: (error as Error).message },
      { status: 500 }
    );
  }
}
