import { NextRequest, NextResponse } from "next/server";
import { addBusinessMetric } from "../../admin/store/metricsStore";

export async function POST(request: NextRequest) {
  try {
    const { businessName, action } = await request.json();

    if (!businessName || !action) {
      return NextResponse.json(
        { error: "Business name and action required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['click', 'directions', 'call', 'website', 'share'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get existing metrics for today
    const existingMetrics = await import("../../admin/store/metricsStore").then(
      m => m.getBusinessMetrics(businessName, today, today)
    );

    const existing = existingMetrics[0] || {
      business_name: businessName,
      date: today,
      clicks: 0,
      directions: 0,
      calls: 0,
      websites: 0,
      shares: 0
    };

    // Increment the appropriate metric
    const updatedMetric = { ...existing };
    switch (action) {
      case 'click':
        updatedMetric.clicks += 1;
        break;
      case 'directions':
        updatedMetric.directions += 1;
        break;
      case 'call':
        updatedMetric.calls += 1;
        break;
      case 'website':
        updatedMetric.websites += 1;
        break;
      case 'share':
        updatedMetric.shares += 1;
        break;
    }

    await addBusinessMetric(updatedMetric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking business metric:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
