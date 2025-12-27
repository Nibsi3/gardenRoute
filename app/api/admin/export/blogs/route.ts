import { NextRequest, NextResponse } from "next/server";
import { getBlogMetrics } from "../../store/metricsStore";
import { getBlogs } from "../../store/blogStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "weekly";

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

  const blogs = getBlogs();
  const allMetrics = blogs.flatMap(blog => {
    const metrics = getBlogMetrics(blog.slug, startDate, endDate);
    return metrics.map(m => ({
      title: blog.title,
      slug: blog.slug,
      date: m.date,
      reads: m.reads,
      shares: m.shares,
    }));
  });

  // Generate CSV content
  const csvHeaders = "Blog Title,Slug,Date,Reads,Shares\n";
  const csvRows = allMetrics.map(m =>
    `"${m.title}","${m.slug}",${m.date},${m.reads},${m.shares}`
  ).join('\n');

  const csvContent = csvHeaders + csvRows;

  // Return CSV file
  const response = new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="blogs_${range}_report.csv"`,
    },
  });

  return response;
}
