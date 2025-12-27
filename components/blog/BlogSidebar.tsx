"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

type BlogPost = {
  title: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  excerpt: string;
  tags: string[];
  cover?: string;
  comingSoon?: boolean;
};

type BusinessDetails = {
  name: string;
  tagline: string;
  phone: string;
  hours: string;
  location: string;
  website: string;
  features: string[];
};

type Props = {
  posts: BlogPost[];
  currentSlug?: string;
  currentCategory?: string;
  businessDetails?: BusinessDetails;
};

export const BlogSidebar = ({ posts, currentSlug, currentCategory, businessDetails }: Props) => {
  const published = useMemo(() => posts.filter((p) => !p.comingSoon), [posts]);
  const recent = useMemo(() => published.slice(0, 5), [published]);

  const related = useMemo(() => {
    if (!currentCategory) return [];
    return published
      .filter((p) => p.slug !== currentSlug && p.category === currentCategory)
      .slice(0, 3);
  }, [published, currentSlug, currentCategory]);

  const categoryCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    published.forEach((p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
    });
    return acc;
  }, [published]);

  return (
    <aside className="space-y-6 sticky top-10">
      {/* Business Details */}
      {businessDetails && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4 bg-gradient-to-br from-blue-500/5 to-sky-500/5">
          <div className="text-xs uppercase tracking-[0.18em] text-blue-300 font-bold">Featured Business</div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">{businessDetails.name}</h3>
              <p className="text-sm text-blue-200">{businessDetails.tagline}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">📞</div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Phone</div>
                  <a href={`tel:${businessDetails.phone}`} className="text-white hover:text-blue-300 transition-colors">
                    {businessDetails.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">🕐</div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Hours</div>
                  <div className="text-white text-sm">{businessDetails.hours}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">📍</div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Location</div>
                  <div className="text-white text-sm">{businessDetails.location}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">🌐</div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Website</div>
                  <a href={`https://${businessDetails.website}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300 transition-colors">
                    {businessDetails.website}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">✨ Key Features</div>
              <div className="flex flex-wrap gap-1.5">
                {businessDetails.features.map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-400/30">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Recent Posts</div>
        <div className="space-y-4">
          {recent.map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="group flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10">
                {post.cover ? (
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{post.date}</p>
                <p className="text-sm font-semibold text-white truncate group-hover:text-sky-300 transition-colors">{post.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Categories</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <span
              key={cat}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-200"
            >
              {cat} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Related</div>
          <div className="space-y-3">
            {related.map((post) => (
              <Link key={post.slug} href={`/blogs/${post.slug}`} className="block group">
                <p className="text-xs text-slate-500">{post.date}</p>
                <p className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">{post.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter / CTA */}
      <div className="glass rounded-2xl border border-white/10 p-5 space-y-3 bg-sky-500/5">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-300 font-bold">Stay Updated</div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Get weekly attention insights, default shifts, and town-by-town breakdowns.
        </p>
        <button className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl transition shadow-[0_0_20px_rgba(56,189,248,0.25)]">
          Subscribe
        </button>
      </div>
    </aside>
  );
};

