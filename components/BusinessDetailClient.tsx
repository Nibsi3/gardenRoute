"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPhotoUrl } from "@/lib/businessData";
import { logError } from "@/lib/logger";
import { Heart, ArrowLeft } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import UserAuth from "@/components/UserAuth";

type BusinessPoint = {
  category: string;
  name: string;
  phone?: string;
  meta?: string;
  coords: [number, number];
  googleMapsUrl?: string;
  placeId?: string;
  address?: string;
  rating?: number;
  photos?: string[];
  email?: string;
  website?: string;
  aiContent?: string;
  instagram?: string;
  facebook?: string;
};

type Props = {
  business: BusinessPoint;
  zoneId: string;
};

export default function BusinessDetailClient({ business, zoneId }: Props) {
  const { data: session } = useSession();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isSaved = isFavorite(zoneId, business.name);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: business.name,
            category: business.category,
            zone: zoneId,
            phone: business.phone,
            meta: business.meta,
          }),
        });

        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        logError("Failed to fetch content:", error);
        setContent("Content generation failed. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [business, zoneId]);

  const zoneNames: Record<string, string> = {
    george: "George Central",
    wilderness: "Wilderness",
    sedgefield: "Sedgefield",
    knysna: "Knysna",
    plett: "Plettenberg Bay",
    mossel: "Mossel Bay",
    oudtshoorn: "Oudtshoorn",
  };

  const [lng, lat] = business.coords;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const facebookUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(business.name)}`;
  const instagramUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(business.name.replace(/\s+/g, ""))}/`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="noise-overlay" />
      
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 right-16 z-50 flex items-center justify-between pointer-events-none">
        <Link 
          href="/" 
          className="p-2 rounded-full bg-slate-900/80 border border-white/10 text-white hover:bg-slate-800 transition-all pointer-events-auto"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="pointer-events-auto">
          <UserAuth />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          {/* Google Business Photo */}
          {business.photos && business.photos.length > 0 && (
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={getPhotoUrl(business.photos[0], 800)}
                alt={business.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              {business.rating && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-bold text-white">{business.rating}</span>
                  <span className="text-sm text-slate-300">Google Rating</span>
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div className="p-8 md:p-10 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-transparent relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!session) {
                  signIn("google");
                  return;
                }
                toggleFavorite(zoneId, business.name);
              }}
              className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:scale-110 hover:bg-slate-800 transition-all z-20"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isSaved ? "fill-sky-400 text-sky-400" : "text-slate-400"
                }`}
              />
            </button>
            <div className="inline-block px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/30 mb-4">
              <p className="text-xs uppercase tracking-wider text-sky-300 font-semibold">
                {business.category}
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">{business.name}</h1>
            <p className="text-lg text-slate-300 mb-2">{zoneNames[zoneId] || zoneId}</p>
            {business.address && (
              <p className="text-sm text-slate-400 mb-2">{business.address}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {business.phone && (
                <a 
                  href={`tel:${business.phone.replace(/\s+/g, "")}`} 
                  className="text-sky-300 hover:text-sky-200 transition font-medium"
                >
                  {business.phone}
                </a>
              )}
              {business.meta && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{business.meta}</span>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-sky-400 border-t-transparent mb-4"></div>
                <p className="text-slate-400">Generating content...</p>
              </div>
            ) : content ? (
              <div
                className="prose prose-invert prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: content
                    .split("\n")
                    .map((line) => {
                      if (line.startsWith("# ")) {
                        return `<h1 class="text-3xl md:text-4xl font-bold mt-10 mb-6 text-white border-b border-white/10 pb-4">${line.slice(2)}</h1>`;
                      }
                      if (line.startsWith("## ")) {
                        return `<h2 class="text-2xl md:text-3xl font-semibold mt-8 mb-4 text-sky-300">${line.slice(3)}</h2>`;
                      }
                      if (line.startsWith("### ")) {
                        return `<h3 class="text-xl md:text-2xl font-semibold mt-6 mb-3 text-slate-200">${line.slice(4)}</h3>`;
                      }
                      if (line.trim() === "") {
                        return "<br />";
                      }
                      return `<p class="text-slate-200 mb-5 leading-relaxed text-base md:text-lg">${line}</p>`;
                    })
                    .join(""),
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">Failed to load content.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="glass rounded-lg px-6 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 md:p-10 pt-6 border-t border-white/10 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
              <h2 className="text-xl font-semibold text-white">Connect & Follow</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl px-6 py-4 hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center"
              >
                <div className="text-2xl mb-2">🗺️</div>
                <div className="text-sm font-medium text-white">Google Maps</div>
                <div className="text-xs text-slate-400 mt-1">View Location</div>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl px-6 py-4 hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center"
              >
                <div className="text-2xl mb-2">📘</div>
                <div className="text-sm font-medium text-white">Facebook</div>
                <div className="text-xs text-slate-400 mt-1">Reviews & Updates</div>
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl px-6 py-4 hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center"
              >
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm font-medium text-white">Instagram</div>
                <div className="text-xs text-slate-400 mt-1">Photos & Stories</div>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

