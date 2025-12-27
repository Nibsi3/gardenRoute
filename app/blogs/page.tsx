"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { POSTS } from "./posts";

const categories = Array.from(new Set(POSTS.map((p) => p.category)));

export default function BlogsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);

  const published = POSTS; // all five published posts

  const filtered = useMemo(() => {
    let list = [...published];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    list.sort((a, b) =>
      sortNewest
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return list;
  }, [published, search, category, sortNewest]);

  const featured = filtered[0] ?? published[0];
  const others = filtered.filter((p) => p.slug !== featured.slug);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 flex flex-col items-center">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/3 top-1/4 h-80 w-80 bg-sky-400/10" />
        <div className="glow-ring right-1/3 top-1/3 h-96 w-96 bg-violet-500/10" />
      </div>

      <div className="max-w-6xl w-full z-10 py-12 space-y-10">
        <header className="space-y-6 text-center">
          <Link href="/" className="inline-flex items-center justify-center text-sky-400 hover:text-white transition gap-2 text-sm font-semibold">
            ← Back to Map
          </Link>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Insights & Analysis</h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
            A Caps Tutor–style reading experience: fast filters, frosted glass, glowing accents, and rich prose.
          </p>
        </header>

        <div className="space-y-10">
          {/* Filters */}
          <div className="glass border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border ${!category ? "bg-sky-500/20 border-sky-400/50 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:text-white"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? null : cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                    cat === category
                      ? "bg-sky-500/20 border-sky-400/50 text-white"
                      : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortNewest(!sortNewest)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border bg-white/5 border-white/10 text-slate-300 hover:text-white"
            >
              {sortNewest ? "Newest → Oldest" : "Oldest → Newest"}
            </button>
          </div>

          {/* Featured */}
          {featured && (
            <div className="glass border border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="bg-gradient-to-r from-sky-500/20 via-transparent to-purple-500/20 p-[1px]">
                <div className="bg-slate-950/70 rounded-3xl p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-sky-300 font-bold">
                    <span>{featured.date}</span>
                    <span className="h-1 w-1 rounded-full bg-sky-300/60" />
                    <span>{featured.author}</span>
                  </div>
                  {featured.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {featured.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-sky-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{featured.title}</h2>
                  <article
                    className="prose prose-lg dark:prose-invert max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: featured.content }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {others.map((post, i) => (
              <Link
                key={i}
                href={`/blogs/${post.slug}`}
                className="group block glass p-7 rounded-3xl border border-white/10 hover:border-sky-400/30 transition cursor-pointer h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-sky-400 font-bold">{post.date}</span>
                  <span className="text-xs text-slate-500">By {post.author}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">{post.title}</h3>
                <p className="text-slate-400 leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-sky-400 font-bold">
                  Read Full Analysis →
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/20 p-8 md:p-12 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-purple-500/10">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7a2 2 0 012-2h.5a2 2 0 002-2V3a2 2 0 00-2-2h-5a6 6 0 00-5.5 3.5" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Discover the Garden Route</h2>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Beyond the insights, explore our comprehensive business directory. Find restaurants, accommodations, services, and more across the beautiful Garden Route with our interactive map.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-xl hover:shadow-sky-500/25 transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Explore Interactive Map
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}