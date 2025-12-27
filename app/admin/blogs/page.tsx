"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { BlogPost } from "@/app/blogs/posts";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [featuredSlug, setFeaturedSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Newest");

  const featuredPost = useMemo(() => {
    if (!Array.isArray(blogs)) return null;
    return blogs.find((p) => p.slug === featuredSlug) || null;
  }, [blogs, featuredSlug]);

  useEffect(() => {
    fetchBlogs();
    fetchFeatured();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/admin/blogs');
      if (response.ok) {
        const data = await response.json();
        const blogsArray = data.blogs || [];
        setBlogs(Array.isArray(blogsArray) ? blogsArray : []);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      setBlogs([]);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await fetch('/api/admin/blogs/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedSlug(data.slug || "");
      }
    } catch (error) {
      console.error('Failed to fetch featured:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFeatured = async (slug: string) => {
    try {
      const response = await fetch('/api/admin/blogs/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (response.ok) {
        setFeaturedSlug(slug);
      }
    } catch (error) {
      console.error('Failed to set featured:', error);
    }
  };

  const handleDeleteBlog = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch('/api/admin/blogs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (response.ok) {
        setBlogs(blogs.filter(b => b.slug !== slug));
        if (featuredSlug === slug) {
          setFeaturedSlug(blogs.find(b => b.slug !== slug)?.slug || "");
        }
      }
    } catch (error) {
      console.error('Failed to delete blog:', error);
    }
  };

  const filteredBlogs = useMemo(() => {
    let filtered = blogs;

    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === "Newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "Oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }, [blogs, searchTerm, selectedCategory, sortBy]);

  const categories = useMemo(() => {
    return [...new Set(blogs.map(b => b.category))];
  }, [blogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading blogs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Blogs</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Manage Blogs</h2>
          <p className="text-sm text-slate-400">Create, edit, and schedule posts.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Draft from Template
          </button>
          <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            New Post
          </button>
        </div>
      </div>

      {/* Featured selector */}
      <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Featured Blog</h3>
            <p className="text-sm text-slate-400">Choose which blog shows as the hero on the public blog page.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={featuredSlug}
              onChange={(e) => handleSetFeatured(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              {blogs.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            <Link
              href={featuredPost ? `/blogs/${featuredPost.slug}` : "#"}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10 transition"
            >
              Edit Post
            </Link>
            <button className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold border border-sky-400/50 transition shadow-[0_0_12px_rgba(56,189,248,0.35)]">
              Set as Featured
            </button>
          </div>
        </div>
        {featuredPost && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div className="font-semibold text-white">{featuredPost.title}</div>
            <div className="text-xs text-slate-500">{featuredPost.date} • {featuredPost.category}</div>
            <p className="text-slate-300 mt-2 line-clamp-2">{featuredPost.excerpt}</p>
          </div>
        )}
      </div>

      <div className="glass border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            <input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option>All Categories</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs focus:outline-none"
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Title A-Z</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-5 bg-white/5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 px-4 py-3">
            <span>Title</span>
            <span>Category</span>
            <span>Status</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {filteredBlogs.map((post) => (
              <div
                key={post.slug}
                className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition items-center"
              >
                <span className="font-semibold text-white">{post.title}</span>
                <span>{post.category}</span>
                <span className="text-emerald-300">{post.status ?? "Published"}</span>
                <span className="text-slate-400">{post.date}</span>
                <div className="flex gap-2 text-xs">
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/blogs/edit/${post.slug}`}
                    className="px-2 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-white hover:bg-sky-500/30 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteBlog(post.slug)}
                    className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-400/40 text-rose-100 hover:bg-rose-500/25 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

