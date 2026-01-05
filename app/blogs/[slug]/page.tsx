"use client";

import { use, useMemo, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { POSTS, Top3Business } from "../posts";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import { Instagram, Phone, Clock, MapPin, Globe, Star, Map, ExternalLink } from "lucide-react";
import { getPhotoUrl } from "@/lib/businessData";
import { logError } from "@/lib/logger";

// Component for Google Business photos
const BusinessPhotos = ({ businessName, townId }: { businessName: string; townId: string }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Fetch directly from API to bypass any stale cache
        const townName = townId.charAt(0).toUpperCase() + townId.slice(1);
        const locationQuery = townName === 'Mossel' ? 'Mossel Bay' : 
                             townName === 'Plett' ? 'Plettenberg Bay' : 
                             townName + ', South Africa';
        
        const apiUrl = `/api/places/photos?name=${encodeURIComponent(businessName)}&location=${encodeURIComponent(locationQuery)}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          const fetchedPhotos = data.photos || [];
          // API returns photo references (or sometimes full URLs from older caches).
          // Keep a small set and let getPhotoUrl handle conversion.
          const validPhotos = fetchedPhotos
            .filter((ref: string) => typeof ref === 'string' && ref.trim().length > 0)
            .slice(0, 4);
          setPhotos(validPhotos);
        }
      } catch (error) {
        logError('Failed to fetch business photos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, [businessName, townId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-900/50">
      {photos.map((photo, index) => (
        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
          <Image
            src={getPhotoUrl(photo, 800)}
            alt={`${businessName} photo ${index + 1}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      ))}
    </div>
  );
};

// Component for rendering a single business in Top 3 format
const Top3BusinessCard = ({ business, index, townId }: { business: Top3Business; index: number; townId?: string }) => {
  const contentParagraphs = business.content.split('</p>').filter(p => p.trim());
  
  return (
    <div id={business.name.toLowerCase().replace(/\s+/g, '-')} className="glass rounded-2xl border border-white/10 overflow-hidden mb-8 scroll-mt-24">
      {/* Business Header - Title, Subtitle, View on Map */}
      <div className="bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-purple-500/20 p-6 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-sm">
                {index + 1}
              </span>
              <span className="text-xs uppercase tracking-wider text-sky-300 font-semibold">
                #{index + 1} Pick
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{business.name}</h3>
            <p className="text-sky-300 text-sm mb-3">{business.tagline}</p>
            
            {/* View on Map - Under title/subtitle */}
            <button 
              onClick={() => {
                sessionStorage.setItem('selectedBusiness', JSON.stringify({
                  townId: townId || 'george',
                  businessName: business.name
                }));
                window.location.href = '/';
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/20 border border-sky-400/30 text-sky-300 hover:bg-sky-500/30 transition cursor-pointer"
            >
              <Map size={12} />
              View on Map
            </button>
          </div>
          
          {/* Business Details Card */}
          <div className="hidden md:block glass rounded-xl p-4 min-w-[220px] border border-white/10">
            <div className="space-y-2 text-sm">
              <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slate-300 hover:text-sky-300 transition">
                <Phone size={14} className="text-sky-400" />
                {business.phone}
              </a>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={14} className="text-sky-400" />
                {business.hours}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={14} className="text-sky-400" />
                {business.location}
              </div>
              <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-sky-300 transition">
                <Globe size={14} className="text-sky-400" />
                {business.website}
              </a>
            </div>
          </div>
        </div>
        
        {/* Features/Categories */}
        <div className="flex flex-wrap gap-2 mt-4">
          {business.features.map((feature, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-slate-200">
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      {/* Google Business Photos - Under categories */}
      {townId && <BusinessPhotos businessName={business.name} townId={townId} />}
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* All paragraphs */}
        {contentParagraphs.map((p, i) => (
          <div key={i} className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: p + '</p>' }} />
        ))}
        
        {/* Social Media Links - At bottom, smaller */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Follow</span>
            <div className="flex items-center gap-2">
              {business.instagram && (
                <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-pink-400 hover:text-pink-300 transition">
                  <Instagram size={14} />
                </a>
              )}
              {business.website && (
                <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400 hover:text-sky-300 transition">
                  <Globe size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Business Details */}
        <div className="md:hidden glass rounded-xl p-4 border border-white/10 mt-4">
          <h4 className="text-sm font-semibold text-white mb-3">Contact Details</h4>
          <div className="space-y-2 text-sm">
            <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slate-300 hover:text-sky-300 transition">
              <Phone size={14} className="text-sky-400" />
              {business.phone}
            </a>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock size={14} className="text-sky-400" />
              {business.hours}
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin size={14} className="text-sky-400" />
              {business.location}
            </div>
            <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-sky-300 transition">
              <Globe size={14} className="text-sky-400" />
              {business.website}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogPostPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const post = useMemo(() => POSTS.find((p) => p.slug === slug), [slug]);

  // Track blog read
  useEffect(() => {
    if (!post) return;
    const trackRead = async () => {
      try {
        await fetch('/api/metrics/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blogSlug: slug,
            action: 'read'
          })
        });
      } catch (error) {
        logError('Failed to track blog read:', error);
      }
    };

    // Track read after a short delay to ensure user is actually reading
    const timer = setTimeout(trackRead, 2000);
    return () => clearTimeout(timer);
  }, [slug, post]);

  if (!post) return notFound();

  const published = POSTS.filter((p) => p.status !== 'draft');
  const related = published.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);


  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 pb-28 flex flex-col items-center">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/3 top-1/4 h-80 w-80 bg-sky-400/10" />
        <div className="glow-ring right-1/3 top-1/3 h-96 w-96 bg-violet-500/10" />
      </div>

      <div className="max-w-6xl w-full z-10 py-12 space-y-10">
        <header className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/blogs"
              className="inline-flex items-center justify-center text-sky-400 hover:text-white transition gap-2 text-sm font-semibold"
            >
              ← Back to Blogs
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition text-sm"
              >
                Contact
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-sky-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7a2 2 0 012-2h.5a2 2 0 002-2V3a2 2 0 00-2-2h-5a6 6 0 00-5.5 3.5" />
                </svg>
                Explore Map
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-sky-300 font-bold">
            <span>{post.date}</span>
            <span className="h-1 w-1 rounded-full bg-sky-300/60" />
            <span>{post.author}</span>
            <span className="h-1 w-1 rounded-full bg-sky-300/60" />
            <span>{post.category}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">{post.title}</h1>

          {post.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-sky-100">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid lg:grid-cols-[3fr_1fr] gap-8 items-start">
          <article className="space-y-6">
            {post.cover && (
              <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-white/10 glass">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 900px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            {/* Top 3 Format - Render businesses with Instagram sliders */}
            {post.isTop3 && post.businesses && post.businesses.length > 0 ? (
              <div className="space-y-8">
                {/* Intro content */}
                <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content.split('<h2>Planning')[0] || '' }} />
                
                {/* Business Cards */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Star className="text-amber-400" size={24} />
                    Our Top 3 Picks
                  </h2>
                  {post.businesses.map((business, index) => (
                    <Top3BusinessCard key={business.name} business={business} index={index} townId={post.town} />
                  ))}
                </div>
                
                {/* Closing content */}
                {post.content.includes('<h2>Planning') && (
                  <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: '<h2>Planning' + post.content.split('<h2>Planning')[1] }} />
                )}
              </div>
            ) : (
              /* Standard blog format */
              <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            )}

            {related.length > 0 && (
              <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
                <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">Related</h3>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link key={rel.slug} href={`/blogs/${rel.slug}`} className="block group">
                      <p className="text-xs text-slate-500">{rel.date}</p>
                      <p className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
                        {rel.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <BlogSidebar posts={POSTS} currentSlug={post.slug} currentCategory={post.category} businessDetails={post.businessDetails} />
        </div>

        {/* Map CTA Section - Full Width */}
        <div className="glass rounded-2xl border border-white/20 p-8 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-purple-500/10 mt-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Ready to Explore?</h3>
            <p className="text-slate-300 leading-relaxed max-w-md mx-auto">
              Discover all the amazing businesses across the Garden Route. Find dining, stays, services, and more with our interactive map experience.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-sky-500/25 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Explore Garden Route Map
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogPostPage;

