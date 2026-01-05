import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { dbFeatured, dbBlogs } from "@/lib/database";

export async function GET() {
  try {
    const featured = await dbFeatured.get();
    return NextResponse.json({ featured });
  } catch (error) {
    logError('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch featured blog" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;
    if (!slug) throw new Error("slug required");

    // Verify the blog exists
    const blog = await dbBlogs.getBySlug(slug);
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });

    await dbFeatured.set(slug);
    return NextResponse.json({ featured: slug });
  } catch (e: any) {
    logError('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}
