import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/logger';
import { POSTS } from '@/app/blogs/posts';

// In-memory store for editor changes (in production, use a database)
let editorPosts: any[] | null = null;

export async function GET() {
  try {
    // If we have editor changes, return those
    if (editorPosts) {
      return NextResponse.json({ posts: editorPosts });
    }

    // Otherwise, convert the static POSTS to editor format
    const posts = POSTS.map((post, index) => ({
      id: `post-${index}`,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      date: post.date,
      author: post.author,
      cover: post.cover,
      tags: post.tags,
      status: "Published",
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    logError('Error loading posts:', error);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts } = body;

    if (!Array.isArray(posts)) {
      return NextResponse.json(
        { error: 'Posts must be an array' },
        { status: 400 }
      );
    }

    // Store the editor changes
    editorPosts = posts;

    // Log the change for analytics (preserves history)
    logInfo(`[Editor] Blogs updated: ${posts.length} posts at ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Posts saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error saving posts:', error);
    return NextResponse.json(
      { error: 'Failed to save posts' },
      { status: 500 }
    );
  }
}
