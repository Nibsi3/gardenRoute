import { NextRequest, NextResponse } from "next/server";
import { logError } from '@/lib/logger';
import { dbBusinesses, dbMetrics } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const town = searchParams.get("town");
    const range = searchParams.get("range") || "monthly";

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    let startDate: string;

    switch (range) {
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
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    if (town) {
      // Return detailed statistics for a specific town
      const businesses = await dbBusinesses.getAll();
      const townBusinesses = businesses.filter(b => b.town.toLowerCase() === town.toLowerCase());

      if (townBusinesses.length === 0) {
        return NextResponse.json({ error: "Town not found" }, { status: 404 });
      }

      // Get metrics for all businesses in this town
      const townMetrics = [];
      for (const business of townBusinesses) {
        const metrics = await dbMetrics.getBusinessMetrics(business.name, startDate, endDate);
        townMetrics.push({
          business: business.name,
          category: business.category,
          metrics: {
            clicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
            directions: metrics.reduce((sum, m) => sum + m.directions, 0),
            calls: metrics.reduce((sum, m) => sum + m.calls, 0),
            websites: metrics.reduce((sum, m) => sum + m.websites, 0),
            shares: metrics.reduce((sum, m) => sum + m.shares, 0),
            total: metrics.reduce((sum, m) => sum + m.clicks + m.directions + m.calls + m.websites + m.shares, 0)
          }
        });
      }

      // Aggregate town totals
      const townTotals = townMetrics.reduce((acc, business) => ({
        clicks: acc.clicks + business.metrics.clicks,
        directions: acc.directions + business.metrics.directions,
        calls: acc.calls + business.metrics.calls,
        websites: acc.websites + business.metrics.websites,
        shares: acc.shares + business.metrics.shares,
        totalInteractions: acc.totalInteractions + business.metrics.total
      }), {
        clicks: 0,
        directions: 0,
        calls: 0,
        websites: 0,
        shares: 0,
        totalInteractions: 0
      });

      return NextResponse.json({
        town,
        period: range,
        businesses: townMetrics,
        totals: townTotals,
        businessCount: townBusinesses.length
      });

    } else {
      // Return overview statistics for all towns
      const businesses = await dbBusinesses.getAll();

      // Get all unique towns
      const towns = [...new Set(businesses.map(b => b.town))];

      // Calculate statistics for each town
      const townStats = [];
      for (const townName of towns) {
        const townBusinesses = businesses.filter(b => b.town === townName);

        // Get metrics for this town's businesses
        let townClicks = 0;
        let townDirections = 0;
        let townCalls = 0;
        let townWebsites = 0;
        let townBlogReads = 0;

        for (const business of townBusinesses) {
          const metrics = await dbMetrics.getBusinessMetrics(business.name, startDate, endDate);
          townClicks += metrics.reduce((sum, m) => sum + m.clicks, 0);
          townDirections += metrics.reduce((sum, m) => sum + m.directions, 0);
          townCalls += metrics.reduce((sum, m) => sum + m.calls, 0);
          townWebsites += metrics.reduce((sum, m) => sum + m.websites, 0);
        }

        // Get blog reads for this town (blogs that mention this town or are related)
        const blogMetrics = await dbMetrics.getBlogMetrics(undefined, startDate, endDate);
        // For now, distribute blog reads evenly across towns as a simple approximation
        // In a real implementation, you'd associate blogs with specific towns
        townBlogReads = Math.floor(blogMetrics.reduce((sum, m) => sum + m.reads, 0) / towns.length);

        townStats.push({
          name: townName,
          clicks: townClicks,
          directions: townDirections,
          calls: townCalls,
          websites: townWebsites,
          blogReads: townBlogReads,
          businesses: townBusinesses.length
        });
      }

      // Calculate overall totals
      const allMetrics = await dbMetrics.getBusinessMetrics(undefined, startDate, endDate);
      const totals = allMetrics.reduce((acc, m) => ({
        clicks: acc.clicks + m.clicks,
        directions: acc.directions + m.directions,
        calls: acc.calls + m.calls,
        websites: acc.websites + m.websites,
        shares: acc.shares + m.shares,
      }), {
        clicks: 0,
        directions: 0,
        calls: 0,
        websites: 0,
        shares: 0,
      });

      return NextResponse.json({
        overview: {
          totalClicks: totals.clicks,
          totalDirections: totals.directions,
          totalCalls: totals.calls,
          totalShares: totals.shares,
          totalWebsites: totals.websites,
          totalInteractions: totals.clicks + totals.directions + totals.calls + totals.websites + totals.shares
        },
        towns: townStats,
        period: range
      });
    }

  } catch (error) {
    logError('Dashboard API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
