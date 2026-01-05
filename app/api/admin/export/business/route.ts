import { NextRequest, NextResponse } from "next/server";
import { getBusinessMetrics } from "../../store/metricsStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get("name");
  const range = searchParams.get("range") || "weekly";

  if (!businessName) {
    return NextResponse.json({ error: "Business name required" }, { status: 400 });
  }

  const endDate = new Date().toISOString().split('T')[0];
  let startDate: string;

  switch (range) {
    case "weekly":
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case "monthly":
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case "yearly":
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const metrics = await getBusinessMetrics(businessName, startDate, endDate);

  // Generate CSV content
  const csvHeaders = "Date,Clicks,Directions,Calls,Websites,Shares\n";
  const csvRows = metrics.map((m: { date: string; clicks: number; directions: number; calls: number; websites: number; shares: number }) =>
    `${m.date},${m.clicks},${m.directions},${m.calls},${m.websites},${m.shares}`
  ).join('\n');

  const csvContent = csvHeaders + csvRows;

  // Return CSV file
  const response = new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${range}_report.csv"`,
    },
  });

  return response;
}
