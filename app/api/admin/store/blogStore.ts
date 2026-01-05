import { POSTS, BlogPost } from '@/app/blogs/posts';
import { dbBlogs, dbFeatured } from '@/lib/database';
import { logError } from '@/lib/logger';

// Cache for performance (optional - can remove if you want real-time data)
let blogsCache: BlogPost[] | null = null;
let featuredCache: string | null = null;

export const getBlogs = async (): Promise<BlogPost[]> => {
  try {
    return await dbBlogs.getAll();
  } catch (error) {
    logError('Database error, falling back to static data:', error);
    return [...POSTS];
  }
};

export const getBlogBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    return await dbBlogs.getBySlug(slug);
  } catch (error) {
    logError('Database error:', error);
    return POSTS.find(p => p.slug === slug) || null;
  }
};

export const getFeatured = async (): Promise<string> => {
  try {
    const featured = await dbFeatured.get();
    return featured || (await getBlogs())[0]?.slug || "";
  } catch (error) {
    logError('Database error:', error);
    return POSTS[0]?.slug || "";
  }
};

export const setFeatured = async (slug: string): Promise<boolean> => {
  try {
    // Verify the blog exists
    const blog = await dbBlogs.getBySlug(slug);
    if (!blog) return false;

    await dbFeatured.set(slug);
    return true;
  } catch (error) {
    logError('Database error:', error);
    return false;
  }
};

export const createBlog = async (blog: Omit<BlogPost, 'id'>): Promise<BlogPost> => {
  try {
    // Check if slug already exists
    const existing = await dbBlogs.getBySlug(blog.slug);
    if (existing) throw new Error("Slug already exists");

    return await dbBlogs.create(blog);
  } catch (error) {
    logError('Database error:', error);
    throw error;
  }
};

export const updateBlog = async (slug: string, patch: Partial<BlogPost>): Promise<BlogPost> => {
  try {
    const updated = await dbBlogs.update(slug, patch);
    if (!updated) throw new Error("Blog not found");
    return updated;
  } catch (error) {
    logError('Database error:', error);
    throw error;
  }
};

export const deleteBlog = async (slug: string): Promise<boolean> => {
  try {
    // If this blog is featured, clear the featured status
    const featured = await getFeatured();
    if (featured === slug) {
      // Get all blogs to find a new featured one
      const blogs = await dbBlogs.getAll();
      const newFeatured = blogs.find(b => b.slug !== slug)?.slug;
      if (newFeatured) {
        await dbFeatured.set(newFeatured);
      }
    }

    return await dbBlogs.delete(slug);
  } catch (error) {
    logError('Database error:', error);
    return false;
  }
};

