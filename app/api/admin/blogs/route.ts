import { NextResponse } from "next/server";
import { dbBlogs } from "@/lib/database";

export async function GET() {
  try {
    const blogs = await dbBlogs.getAll();
    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await dbBlogs.create(body);
    return NextResponse.json({ blog: created });
  } catch (e: any) {
    console.error('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { slug, ...patch } = body;
    if (!slug) throw new Error("slug required");
    const updated = await dbBlogs.update(slug, patch);
    if (!updated) throw new Error("Blog not found");
    return NextResponse.json({ blog: updated });
  } catch (e: any) {
    console.error('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) throw new Error("slug required");
    const ok = await dbBlogs.delete(slug);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Database error:', e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

