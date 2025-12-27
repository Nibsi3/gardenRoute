import { NextResponse } from "next/server";
import { dbFeatured, dbBlogs } from "@/lib/database";

export async function GET() {
  try {
    const featured = await dbFeatured.get();
    return NextResponse.json({ featured });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch featured blog" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug } = body;
    if (!slug) throw new Error("slug required");

    // Verify the blog exists
    const blog = await dbBlogs.getBySlug(slug);
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });

    await dbFeatured.set(slug);
    return NextResponse.json({ featured: slug });
  } catch (e: any) {
    console.error('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

