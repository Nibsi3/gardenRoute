import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { dbBlogs } from '@/lib/database';

export async function GET() {
  try {
    const blogs = await dbBlogs.getAll();
    return NextResponse.json({ blogs });
  } catch (error) {
    logError('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await dbBlogs.create(body);
    return NextResponse.json({ blog: created });
  } catch (e: any) {
    logError('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, ...data } = body;
    const updated = await dbBlogs.update(slug, data);
    if (!updated) throw new Error("Blog not found");
    return NextResponse.json({ blog: updated });
  } catch (e: any) {
    logError('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const ok = await dbBlogs.delete(slug);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    logError('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}
