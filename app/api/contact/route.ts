import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { Resend } from 'resend';
import { config } from '@/lib/config';

const resendApiKey = config.email.resendApiKey;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Contact reason display names
const getContactReasonDisplayName = (contactReason: string): string => {
  const reasons: Record<string, string> = {
    'general-inquiry': 'General Inquiry',
    'business-listing': 'Business Listing',
    'partnership': 'Partnership Opportunity',
    'technical-support': 'Technical Support',
    'marketing-services': 'Marketing Services',
    'other': 'Other'
  };
  return reasons[contactReason] || contactReason;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, businessType: contactReason, company, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Send email to admin
    const adminEmail = 'hello@spotlight.co.za'; // You can change this to your actual email
    const userEmail = email;

    if (!resend) {
      logError('Email service not configured: RESEND_API_KEY missing');
      return NextResponse.json(
        { error: 'Contact service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Email to admin
    const adminHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 24px; text-align: center; }
            .content { padding: 32px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
            .value { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #0ea5e9; font-size: 16px; }
            .message { background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 3px solid #0ea5e9; white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New Contact Inquiry</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Spotlight</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name</div>
                <div class="value">${name}</div>
              </div>

              <div class="field">
                <div class="label">Contact Reason</div>
                <div class="value">${getContactReasonDisplayName(contactReason)}</div>
              </div>

              <div class="field">
                <div class="label">Email</div>
                <div class="value">${email}</div>
              </div>

              ${company ? `
              <div class="field">
                <div class="label">Company</div>
                <div class="value">${company}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Message</div>
                <div class="message">${message}</div>
              </div>

              <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
                This inquiry was submitted through Spotlight contact form.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email to user (confirmation)
    const userHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thank you for contacting us</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 24px; text-align: center; }
            .content { padding: 32px; }
            .highlight { color: #0ea5e9; font-weight: 600; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .summary-item { margin-bottom: 12px; }
            .summary-label { font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-value { color: #1f2937; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Thank You!</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Spotlight</p>
            </div>
            <div class="content">
              <p>Hi <span class="highlight">${name}</span>,</p>

              <p>Thank you for reaching out! We've received your message and will get back to you within 24 hours.</p>

              <p>Here's a summary of your inquiry:</p>

              <div class="summary">
                <div class="summary-item">
                  <div class="summary-label">Contact Reason</div>
                  <div class="summary-value">${getContactReasonDisplayName(contactReason)}</div>
                </div>

                <div class="summary-item">
                  <div class="summary-label">Email</div>
                  <div class="summary-value">${email}</div>
                </div>

                ${company ? `
                <div class="summary-item">
                  <div class="summary-label">Company</div>
                  <div class="summary-value">${company}</div>
                </div>
                ` : ''}

                <div class="summary-item">
                  <div class="summary-label">Message</div>
                  <div class="summary-value" style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
                </div>
              </div>

              <p>If you have any additional information or need immediate assistance, feel free to reply to this email.</p>

              <p>Best regards,<br>
              Spotlight Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails in parallel
    const [adminResult, userResult] = await Promise.allSettled([
      resend.emails.send({
        from: 'Spotlight <noreply@spotlight.co.za>',
        to: [adminEmail],
        subject: `New Contact: ${name}${company ? ` from ${company}` : ''}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from: 'Spotlight <noreply@spotlight.co.za>',
        to: [userEmail],
        subject: 'Thank you for contacting Spotlight',
        html: userHtml,
      })
    ]);

    // Check results
    if (adminResult.status === 'rejected') {
      logError('Failed to send admin email:', adminResult.reason);
    }
    if (userResult.status === 'rejected') {
      logError('Failed to send user confirmation email:', userResult.reason);
    }

    // If at least the admin email was sent successfully, consider it a success
    if (adminResult.status === 'fulfilled') {
      return NextResponse.json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    logError('Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
