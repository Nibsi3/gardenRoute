import { NextRequest, NextResponse } from "next/server";
import { sendBusinessReport } from "@/lib/email";
import { getBusinessMetrics } from "../../store/metricsStore";
import { getBusinesses } from "../../store/businessStore";

export async function POST(request: NextRequest) {
  try {
    const { businessName, period = 'weekly', email } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name required" },
        { status: 400 }
      );
    }

    // Get business details
    const businesses = await getBusinesses();
    const business = businesses.find(b => b.name === businessName);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const recipientEmail = email || business.email;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No email address available for this business" },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    let startDate: string;

    switch (period) {
      case 'weekly':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'monthly':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'yearly':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        return NextResponse.json(
          { error: "Invalid period. Use 'weekly', 'monthly', or 'yearly'" },
          { status: 400 }
        );
    }

    // Get metrics data
    const metrics = await getBusinessMetrics(businessName, startDate, endDate);

    // Aggregate totals
    const totals = metrics.reduce(
      (acc, m) => ({
        clicks: acc.clicks + m.clicks,
        directions: acc.directions + m.directions,
        calls: acc.calls + m.calls,
        websites: acc.websites + m.websites,
        shares: acc.shares + m.shares,
      }),
      { clicks: 0, directions: 0, calls: 0, websites: 0, shares: 0 }
    );

    const totalInteractions =
      totals.clicks + totals.directions + totals.calls + totals.websites + totals.shares;

    // Prepare chart data (simplified for email)
    const chartData = metrics.slice(-14).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: m.clicks,
      directions: m.directions,
      calls: m.calls,
      websites: m.websites,
      shares: m.shares,
    }));

    // Send email
    const success = await sendBusinessReport(recipientEmail, {
      businessName,
      period: period as 'weekly' | 'monthly' | 'yearly',
      metrics: {
        ...totals,
        totalInteractions,
      },
      chartData,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Report sent successfully to ${recipientEmail}`,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending business report:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
