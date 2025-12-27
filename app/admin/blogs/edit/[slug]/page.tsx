"use client";

import Link from "next/link";
import { useMemo } from "react";
import { POSTS } from "@/app/blogs/posts";
import { notFound } from "next/navigation";

export default function AdminBlogEdit({ params }: { params: { slug: string } }) {
  const post = useMemo(() => POSTS.find((p) => p.slug === params.slug), [params.slug]);
  if (!post) return notFound();

  return (
    <div className="space-y-6">
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Edit Blog</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{post.title}</h2>
          <p className="text-sm text-slate-400">Slug: {post.slug}</p>
        </div>
        <Link href="/admin/blogs" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
          Back to Blogs
        </Link>
      </div>

      <div className="glass border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Title
            <input
              defaultValue={post.title}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Category
            <input
              defaultValue={post.category}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Date
            <input
              defaultValue={post.date}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Status
            <input
              defaultValue={post.status ?? "Published"}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Excerpt
          <textarea
            defaultValue={post.excerpt}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 min-h-[80px]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Cover Image URL
          <input
            defaultValue={post.cover}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Tags (comma separated)
          <input
            defaultValue={post.tags.join(", ")}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Content (HTML)
          <textarea
            defaultValue={post.content}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 min-h-[200px]"
          />
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition">
            Save Draft
          </button>
          <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

