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
    <aside className="space-y-8 sticky top-24">
      {/* Business Details Card - Premium Design */}
      {businessDetails && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120] shadow-2xl shadow-sky-900/20 group hover:border-sky-500/30 transition-all duration-500">
          <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-white mb-1 relative z-10">{businessDetails.name}</h3>
            <p className="text-sky-100/90 text-sm font-medium relative z-10">{businessDetails.tagline}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-5">
              {/* Phone */}
              <div className="flex items-start gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover/item:bg-sky-500/20 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Phone</div>
                  <a href={`tel:${businessDetails.phone.replace(/\s/g, '')}`} className="text-slate-200 font-bold hover:text-sky-400 transition-colors">
                    {businessDetails.phone}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover/item:bg-sky-500/20 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Hours</div>
                  <div className="text-slate-200 font-medium">{businessDetails.hours}</div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover/item:bg-sky-500/20 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Location</div>
                  <div className="text-slate-200 font-medium leading-tight">{businessDetails.location}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <a
                href={`https://${businessDetails.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center mx-auto w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sky-400 font-bold transition-all shadow-lg hover:shadow-sky-500/10 active:scale-[0.98] group/btn"
              >
                <span>Visit Website</span>
                <svg className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>

            {/* Features */}
            {businessDetails.features && businessDetails.features.length > 0 && (
              <div className="pt-4 border-t border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Key Features</div>
                <div className="flex flex-wrap gap-2">
                  {businessDetails.features.map((feature, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/10">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="glass rounded-2xl border border-white/5 p-6 space-y-5 bg-[#080c14]/40">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Recent Posts</div>
        </div>
        <div className="space-y-5">
          {recent.map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="group flex gap-4 items-start">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-md transform group-hover:scale-95 transition-all">
                {post.cover ? (
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <span className="text-xs">IMG</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-sky-400/80 bg-sky-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{post.category}</span>
                  <span className="text-[10px] text-slate-500">{post.date}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-sky-300 transition-colors">
                  {post.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="glass rounded-2xl border border-white/5 p-6 space-y-4 bg-[#080c14]/40">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Categories</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <span
              key={cat}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all cursor-default flex items-center gap-2"
            >
              {cat}
              <span className="bg-white/10 text-slate-400 px-1.5 py-0.5 rounded text-[9px] min-w-[16px] text-center">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

