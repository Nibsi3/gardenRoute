"use client";

import { use, useMemo, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { POSTS } from "../posts";
import { BlogSidebar } from "@/components/blog/BlogSidebar";

type BusinessDetails = {
  name: string;
  tagline: string;
  phone: string;
  hours: string;
  location: string;
  website: string;
  features: string[];
};

const extractBusinessDetails = (content: string) => {
  // Parse business details from HTML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  const businessCard = doc.querySelector('.business-details-card');
  if (!businessCard) return null;

  const name = businessCard.querySelector('.business-name')?.textContent || '';
  const tagline = businessCard.querySelector('.business-tagline')?.textContent || '';

  // Extract contact info
  const phone = businessCard.querySelector('.contact-link')?.textContent || '';

  // Find hours by looking through info-items
  let hours = '';
  let hoursNote = '';
  const infoItems = businessCard.querySelectorAll('.info-item');
  infoItems.forEach(item => {
    const label = item.querySelector('.info-label');
    if (label?.textContent?.toLowerCase().includes('hours')) {
      hours = item.querySelector('.info-value')?.textContent || '';
      hoursNote = item.querySelector('.info-note')?.textContent || '';
    }
  });

  // Find location
  let location = '';
  let locationNote = '';
  infoItems.forEach(item => {
    const label = item.querySelector('.info-label');
    if (label?.textContent?.toLowerCase().includes('location')) {
      location = item.querySelector('.info-value')?.textContent || '';
      locationNote = item.querySelector('.info-note')?.textContent || '';
    }
  });

  const websiteElement = businessCard.querySelector('.website-link');
  const website = websiteElement?.textContent || '';

  // Extract key features
  const features: string[] = [];
  const featureElements = businessCard.querySelectorAll('.feature-tag');
  featureElements.forEach(feature => {
    features.push(feature.textContent || '');
  });

  return {
    name,
    tagline,
    phone,
    hours: hoursNote ? `${hours} ${hoursNote}` : hours,
    location: locationNote ? `${location} ${locationNote}` : location,
    website,
    features
  };
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = useMemo(() => POSTS.find((p) => p.slug === slug), [slug]);
  if (!post) return notFound();

  // Track blog read
  useEffect(() => {
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
        console.error('Failed to track blog read:', error);
      }
    };

    // Track read after a short delay to ensure user is actually reading
    const timer = setTimeout(trackRead, 2000);
    return () => clearTimeout(timer);
  }, [slug]);

  const published = POSTS.filter((p) => p.status !== 'draft');
  const related = published.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);

  // Extract business details from the current post (client-side only)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);

  useEffect(() => {
    // Only run on client side where DOMParser is available
    if (typeof window !== 'undefined') {
      const details = extractBusinessDetails(post.content);
      setBusinessDetails(details);
    }
  }, [post.content]);

  // Add click tracking to business contact links
  useEffect(() => {
    const attachTracking = () => {
      // Add click tracking to contact links
      const contactLinks = document.querySelectorAll('.contact-link');
      contactLinks.forEach((link) => {
        if (!link.hasAttribute('data-tracking-attached')) {
          link.setAttribute('data-tracking-attached', 'true');
          link.addEventListener('click', async (e) => {
            try {
              // Extract business name from the card
              const card = link.closest('.business-details-card');
              const businessName = card?.querySelector('.business-name')?.textContent;

              if (businessName) {
                await fetch('/api/metrics/business', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessName: businessName,
                    action: 'call'
                  })
                });
              }
            } catch (error) {
              console.error('Failed to track call:', error);
            }
          });
        }
      });

      // Add click tracking to website links
      const websiteLinks = document.querySelectorAll('.website-link');
      websiteLinks.forEach((link) => {
        if (!link.hasAttribute('data-tracking-attached')) {
          link.setAttribute('data-tracking-attached', 'true');
          link.addEventListener('click', async (e) => {
            try {
              // Extract business name from the card
              const card = link.closest('.business-details-card');
              const businessName = card?.querySelector('.business-name')?.textContent;

              if (businessName) {
                await fetch('/api/metrics/business', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessName: businessName,
                    action: 'websites'
                  })
                });
              }
            } catch (error) {
              console.error('Failed to track website click:', error);
            }
          });
        }
      });

      // Add click tracking to location links
      const locationLinks = document.querySelectorAll('.location-link');
      locationLinks.forEach((link) => {
        if (!link.hasAttribute('data-tracking-attached')) {
          link.setAttribute('data-tracking-attached', 'true');
          link.addEventListener('click', async (e) => {
            try {
              // Extract business name from the card
              const card = link.closest('.business-details-card');
              const businessName = card?.querySelector('.business-name')?.textContent;

              if (businessName) {
                await fetch('/api/metrics/business', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessName: businessName,
                    action: 'directions'
                  })
                });
              }
            } catch (error) {
              console.error('Failed to track directions:', error);
            }
          });
        }
      });
    };

    // Attach tracking after a short delay to ensure DOM is ready
    const timer = setTimeout(attachTracking, 100);
    return () => clearTimeout(timer);
  }, [post.slug]); // Re-run when post changes

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 flex flex-col items-center">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/3 top-1/4 h-80 w-80 bg-sky-400/10" />
        <div className="glow-ring right-1/3 top-1/3 h-96 w-96 bg-violet-500/10" />
      </div>

      <div className="max-w-6xl w-full z-10 py-12 space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/blogs" className="inline-flex items-center justify-center text-sky-400 hover:text-white transition gap-2 text-sm font-semibold">
              ← Back to Blogs
            </Link>
            <Link href="/" className="glass inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-sky-500/25 transform hover:scale-105">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7a2 2 0 012-2h.5a2 2 0 002-2V3a2 2 0 00-2-2h-5a6 6 0 00-5.5 3.5" />
              </svg>
              Explore Map
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-sky-300 font-bold">
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
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />

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

          <BlogSidebar posts={POSTS} currentSlug={post.slug} currentCategory={post.category} businessDetails={businessDetails || undefined} />
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
}

