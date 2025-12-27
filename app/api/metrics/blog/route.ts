import { NextRequest, NextResponse } from "next/server";
import { addBlogMetric } from "../../admin/store/metricsStore";

export async function POST(request: NextRequest) {
  try {
    const { blogSlug, action } = await request.json();

    if (!blogSlug || !action) {
      return NextResponse.json(
        { error: "Blog slug and action required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['read', 'share'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get existing metrics for today
    const existingMetrics = await import("../../admin/store/metricsStore").then(
      m => m.getBlogMetrics(blogSlug, today, today)
    );

    const existing = existingMetrics[0] || {
      blog_slug: blogSlug,
      date: today,
      reads: 0,
      shares: 0
    };

    // Increment the appropriate metric
    const updatedMetric = { ...existing };
    switch (action) {
      case 'read':
        updatedMetric.reads += 1;
        break;
      case 'share':
        updatedMetric.shares += 1;
        break;
    }

    await addBlogMetric(updatedMetric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking blog metric:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
