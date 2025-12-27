import { Resend } from 'resend';
import { config } from './config';

const resend = new Resend(config.email.resendApiKey);

export interface BusinessReportData {
  businessName: string;
  period: 'weekly' | 'monthly' | 'yearly';
  metrics: {
    clicks: number;
    directions: number;
    calls: number;
    websites: number;
    shares: number;
    totalInteractions: number;
  };
  chartData: Array<{
    date: string;
    clicks: number;
    directions: number;
    calls: number;
    websites: number;
    shares: number;
  }>;
}

export const sendBusinessReport = async (
  email: string,
  data: BusinessReportData
): Promise<boolean> => {
  try {
    const periodLabel = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    }[data.period];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${periodLabel} Business Report - ${data.businessName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .metric { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .metric h3 { margin: 0 0 10px 0; color: #667eea; }
            .metric p { margin: 0; font-size: 24px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${periodLabel} Performance Report</h1>
              <h2>${data.businessName}</h2>
            </div>
            <div class="content">
              <p>Here's your ${data.period} performance summary for ${data.businessName}:</p>

              <div class="metric">
                <h3>Total Interactions</h3>
                <p>${data.metrics.totalInteractions.toLocaleString()}</p>
              </div>

              <div class="metric">
                <h3>Profile Clicks</h3>
                <p>${data.metrics.clicks.toLocaleString()}</p>
              </div>

              <div class="metric">
                <h3>Directions Requested</h3>
                <p>${data.metrics.directions.toLocaleString()}</p>
              </div>

              <div class="metric">
                <h3>Phone Calls</h3>
                <p>${data.metrics.calls.toLocaleString()}</p>
              </div>

              <div class="metric">
                <h3>Website Visits</h3>
                <p>${data.metrics.websites.toLocaleString()}</p>
              </div>

              <div class="metric">
                <h3>Social Shares</h3>
                <p>${data.metrics.shares.toLocaleString()}</p>
              </div>

              <p style="margin-top: 30px;">
                Keep up the great work! Your business is getting great visibility on the Garden Route Defaults Engine.
              </p>

              <p>
                Best regards,<br>
                Garden Route Defaults Engine Team
              </p>
            </div>
            <div class="footer">
              <p>This report was generated automatically. If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: result, error } = await resend.emails.send({
      from: 'Garden Route Defaults <reports@gardenroute.com>',
      to: [email],
      subject: `${periodLabel} Business Report - ${data.businessName}`,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
};

export const sendBulkBusinessReports = async (
  reports: Array<{ email: string; data: BusinessReportData }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const report of reports) {
    const result = await sendBusinessReport(report.email, report.data);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};
