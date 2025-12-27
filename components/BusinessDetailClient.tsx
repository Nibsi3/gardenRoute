"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type BusinessPoint = {
  category: string;
  name: string;
  phone: string;
  meta: string;
  coords: [number, number];
};

type Props = {
  business: BusinessPoint;
  zoneId: string;
};

export default function BusinessDetailClient({ business, zoneId }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to fetch content:", error);
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
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-transparent">
            <div className="inline-block px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/30 mb-4">
              <p className="text-xs uppercase tracking-wider text-sky-300 font-semibold">
                {business.category}
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">{business.name}</h1>
            <p className="text-lg text-slate-300 mb-2">{zoneNames[zoneId] || zoneId}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <a 
                href={`tel:${business.phone.replace(/\s+/g, "")}`} 
                className="text-sky-300 hover:text-sky-200 transition font-medium"
              >
                {business.phone}
              </a>
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

