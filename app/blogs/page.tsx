"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { POSTS } from "./posts";

// Extract locations from tags (first tag that matches a known location)
const knownLocations = ["George", "Wilderness", "Sedgefield", "Knysna", "Plett", "Mossel Bay", "Oudtshoorn"];
const getPostLocation = (post: typeof POSTS[0]): string => {
  for (const tag of post.tags) {
    if (knownLocations.includes(tag)) return tag;
  }
  return "All Areas"; // Changed from "Garden Route" - posts without specific location
};

// Only show actual town locations, not "All Areas"
const locations = knownLocations;
const POSTS_PER_PAGE = 12;

export default function BlogsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const published = POSTS;

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
    if (location) {
      list = list.filter((p) => getPostLocation(p) === location);
    }
    list.sort((a, b) =>
      sortNewest
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return list;
  }, [published, search, location, sortNewest]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginatedPosts = filtered.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const featured = currentPage === 1 ? paginatedPosts[0] : null;
  const others = currentPage === 1 
    ? paginatedPosts.filter((p) => p.slug !== featured?.slug)
    : paginatedPosts;

  // Reset to page 1 when filters change
  const handleLocationChange = (loc: string | null) => {
    setLocation(loc);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 pb-28 flex flex-col items-center">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.08),transparent_30%)]" />
      </div>
      <div className="max-w-6xl w-full z-10 py-12 space-y-10">
        <header className="space-y-8 text-center relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/45 to-slate-900/70 px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.14),transparent_36%)]" />
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center text-sky-300 hover:text-white transition gap-2 text-sm font-semibold"
            >
              ← Back to Map
            </Link>
            <div className="text-xs text-slate-400">
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
              {location ? ` in ${location}` : ""}
            </div>
          </div>

          <div className="relative text-center space-y-5 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm font-semibold shadow-lg">
              <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Curated guides across the Garden Route
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(56,189,248,0.25)]">
              Spotlight Blog
            </h1>
            <p className="text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-3xl mx-auto">
              In-depth guides to the top businesses across the Garden Route. Search by keyword, then filter by town to find the best in your area.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Search Bar */}
          <div className="glass border border-white/10 rounded-3xl p-4 md:p-6 space-y-5 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_75%_10%,rgba(236,72,153,0.08),transparent_35%)]" />
            <div className="relative space-y-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search articles by title, excerpts, or tags..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 transition"
                />
              </div>

              <button
                onClick={() => {
                  setSortNewest(!sortNewest);
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                {sortNewest ? "Newest First" : "Oldest First"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Filter by town</div>
              {(location || search.trim()) && (
                <button
                  onClick={() => {
                    handleSearchChange("");
                    handleLocationChange(null);
                  }}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto coming-soon-scroll pb-1">
              <button
                onClick={() => handleLocationChange(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  !location
                    ? "bg-sky-500/20 border-sky-400/50 text-white shadow-lg shadow-sky-500/10"
                    : "bg-slate-800/80 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/80"
                }`}
              >
                All Locations
              </button>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc === location ? null : loc)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${loc === location
                    ? "bg-sky-500/20 border-sky-400/50 text-white shadow-lg shadow-sky-500/10"
                    : "bg-slate-800/80 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/80"
                    }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Featured */}
          {featured && (
            <Link
              href={`/blogs/${featured.slug}`}
              className="glass border border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.45)] block group relative bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70"
            >
              <div className="bg-gradient-to-r from-sky-500/25 via-transparent to-purple-500/25 p-[1px]">
                <div className="bg-slate-950/70 rounded-3xl overflow-hidden grid md:grid-cols-2 gap-0 relative">
                  {/* Image Side */}
                  <div className="relative h-64 md:h-auto min-h-[350px] overflow-hidden">
                    {featured.cover && (
                      <img
                        src={featured.cover}
                        alt={featured.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-950/90 mix-blend-multiply opacity-50" />
                  </div>

                  {/* Content Side */}
                  <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-sky-300 font-bold">
                      <span>{featured.date}</span>
                      <span className="h-1 w-1 rounded-full bg-sky-300/60" />
                      <span>{featured.author}</span>
                    </div>
                    {featured.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {featured.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-sky-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <h2 className="text-3xl md:text-5xl font-bold text-white group-hover:text-sky-300 transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-lg text-slate-300 leading-relaxed">{featured.excerpt}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sky-400 font-bold group-hover:gap-3 transition-all">
                      Read Full Analysis <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <div className="glass rounded-3xl border border-white/10 p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">No articles found</h2>
              <p className="text-slate-400 mt-2 max-w-md mx-auto">
                Try a different search term or clear your filters to see all articles.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    handleSearchChange("");
                    handleLocationChange(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
                >
                  Clear filters
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                >
                  Back to Map
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {others.map((post, i) => (
                <Link
                  key={i}
                  href={`/blogs/${post.slug}`}
                  className="group block glass p-0 rounded-3xl border border-white/10 hover:border-sky-400/30 transition cursor-pointer h-full overflow-hidden flex flex-col bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70"
                >
                  {/* Image */}
                  <div className="relative h-56 w-full overflow-hidden">
                    {post.cover && (
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/80 text-white uppercase tracking-wider">
                        {getPostLocation(post)}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs uppercase tracking-[0.18em] text-sky-400 font-bold">{post.date}</span>
                      <span className="text-xs text-slate-500">By {post.author}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-sky-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-6 line-clamp-3 flex-1">{post.excerpt}</p>
                    <div className="mt-auto inline-flex items-center gap-2 text-sm text-sky-400 font-bold">
                      Read Full Analysis →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  currentPage === 1
                    ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold border transition ${
                      page === currentPage
                        ? "bg-sky-500/20 border-sky-400/50 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  currentPage === totalPages
                    ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                Next →
              </button>
            </div>
          )}

          {/* Results count */}
          {filtered.length > 0 && (
            <div className="text-center text-sm text-slate-500">
              Showing {paginatedPosts.length} of {filtered.length} articles
              {location && ` in ${location}`}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl border border-white/20 p-8 md:p-12 bg-gradient-to-r from-sky-500/12 via-slate-900/30 to-purple-500/12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_30%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.12),transparent_38%)]" />
          <div className="relative">
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
        {/* end CTA container */}
      </div>
    </main>
  );
}