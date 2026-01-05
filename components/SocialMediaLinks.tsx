"use client";

import { useState, useEffect } from "react";
import { Instagram, Facebook, Loader2 } from "lucide-react";
import { getSocialMediaInfo } from "@/lib/socialMediaData";
import { logError } from "@/lib/logger";

type SocialMediaLinksProps = {
  website?: string;
  businessName?: string;
  compact?: boolean;
};

type SocialData = {
  instagram?: string;
  facebook?: string;
};

export default function SocialMediaLinks({ website, businessName, compact = false }: SocialMediaLinksProps) {
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // First, check if we have preloaded social media data for this business
    if (businessName) {
      const preloadedData = getSocialMediaInfo(businessName);
      if (preloadedData && (preloadedData.instagram || preloadedData.facebook)) {
        setSocialData(preloadedData);
        return;
      }
    }

    // Fallback: scrape website for social media handles
    if (!website) return;

    const fetchSocialLinks = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/scrape-social?website=${encodeURIComponent(website)}`);
        if (response.ok) {
          const data = await response.json();
          setSocialData(data);
        }
      } catch (error) {
        logError("Failed to fetch social links:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialLinks();
  }, [website, businessName]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${compact ? 'mt-2' : 'my-4'} flex items-center gap-2 text-slate-400`}>
        <Loader2 className="animate-spin" size={compact ? 12 : 14} />
        <span className={compact ? 'text-xs' : 'text-sm'}>Finding social media...</span>
      </div>
    );
  }

  // No social media found
  if (!socialData?.instagram && !socialData?.facebook) {
    return null;
  }

  const instagramUrl = socialData.instagram ? `https://instagram.com/${socialData.instagram}` : null;
  const facebookUrl = socialData.facebook ? `https://facebook.com/${socialData.facebook}` : null;

  // Compact version for business cards
  if (compact) {
    return (
      <div className="mt-2 flex items-center gap-3">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition"
          >
            <Instagram size={14} />
            <span className="truncate max-w-[100px]">@{socialData.instagram}</span>
          </a>
        )}
        {facebookUrl && (
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <Facebook size={14} />
            <span className="truncate max-w-[100px]">{socialData.facebook}</span>
          </a>
        )}
      </div>
    );
  }

  // Full version for blog posts
  return (
    <div className="my-6 flex flex-wrap items-center gap-4">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 hover:text-pink-300 hover:border-pink-400/50 transition"
        >
          <Instagram size={18} />
          <span className="font-medium">@{socialData.instagram}</span>
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-400/50 transition"
        >
          <Facebook size={18} />
          <span className="font-medium">{socialData.facebook}</span>
        </a>
      )}
    </div>
  );
}
