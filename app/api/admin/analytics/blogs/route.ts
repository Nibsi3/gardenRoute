import { NextRequest, NextResponse } from "next/server";
import { getBlogMetrics } from "../../store/metricsStore";
import { getBlogs } from "../../store/blogStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "daily";

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

  const blogs = getBlogs();
  const posts = blogs.map(blog => {
    const metrics = getBlogMetrics(blog.slug, startDate, endDate);
    const totalReads = metrics.reduce((sum, m) => sum + m.reads, 0);
    const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);
    const lastReadDate = metrics.length > 0 ? metrics[metrics.length - 1].date : blog.date;

    return {
      title: blog.title,
      slug: blog.slug,
      reads: totalReads,
      shares: totalShares,
      date: new Date(lastReadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  }).sort((a, b) => b.reads - a.reads);

  return NextResponse.json({ posts });
}

