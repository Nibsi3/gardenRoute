import { NextRequest, NextResponse } from "next/server";
import { getBusinessMetrics } from "../../store/metricsStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get("name");
  const range = searchParams.get("range") || "daily";

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
    default: // daily
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const metrics = await getBusinessMetrics(businessName, startDate, endDate);

  // Aggregate totals
  const totals = metrics.reduce((acc: { clicks: number; directions: number; calls: number; websites: number; shares: number }, m: { clicks: number; directions: number; calls: number; websites: number; shares: number }) => ({
    clicks: acc.clicks + m.clicks,
    directions: acc.directions + m.directions,
    calls: acc.calls + m.calls,
    websites: acc.websites + m.websites,
    shares: acc.shares + m.shares,
  }), { clicks: 0, directions: 0, calls: 0, websites: 0, shares: 0 });

  // Group by time period based on range
  let data: any[] = [];
  if (range === "daily") {
    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData: { [key: string]: any } = {};

    metrics.forEach(m => {
      const day = dayNames[new Date(m.date).getDay()];
      if (!dayData[day]) {
        dayData[day] = { label: day, clicks: 0, directions: 0, calls: 0, websites: 0, shares: 0 };
      }
      dayData[day].clicks += m.clicks;
      dayData[day].directions += m.directions;
      dayData[day].calls += m.calls;
      dayData[day].websites += m.websites;
      dayData[day].shares += m.shares;
    });

    data = Object.values(dayData);
  } else if (range === "monthly") {
    // Group by month
    const monthData: { [key: string]: any } = {};

    metrics.forEach(m => {
      const month = new Date(m.date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthData[month]) {
        monthData[month] = { label: month, clicks: 0, directions: 0, calls: 0, websites: 0, shares: 0 };
      }
      monthData[month].clicks += m.clicks;
      monthData[month].directions += m.directions;
      monthData[month].calls += m.calls;
      monthData[month].websites += m.websites;
      monthData[month].shares += m.shares;
    });

    data = Object.values(monthData);
  } else if (range === "yearly") {
    // Group by year
    const yearData: { [key: string]: any } = {};

    metrics.forEach(m => {
      const year = new Date(m.date).getFullYear().toString();
      if (!yearData[year]) {
        yearData[year] = { label: year, clicks: 0, directions: 0, calls: 0, websites: 0, shares: 0 };
      }
      yearData[year].clicks += m.clicks;
      yearData[year].directions += m.directions;
      yearData[year].calls += m.calls;
      yearData[year].websites += m.websites;
      yearData[year].shares += m.shares;
    });

    data = Object.values(yearData);
  }

  const response = {
    name: businessName,
    totals,
    data,
  };

  return NextResponse.json(response);
}

