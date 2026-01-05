"use client";

import { useState, useEffect, useCallback } from "react";
import { logError } from "@/lib/logger";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Loader2, ImageOff } from "lucide-react";
import { getSocialMediaInfo } from "@/lib/socialMediaData";

type SocialMediaSliderProps = {
  website?: string;
  businessName?: string; // Used to lookup preloaded social media data
  compact?: boolean;
};

type SocialData = {
  instagram?: string;
  facebook?: string;
};

type ImageData = {
  images: string[];
  source: "instagram" | "facebook" | "placeholder";
};

// Image component with loading state and error handling
function SocialImage({ 
  src, 
  alt, 
  className,
  onError 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  onError?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div className={`bg-slate-700/50 flex items-center justify-center ${className}`}>
        <ImageOff className="text-slate-500" size={20} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center animate-pulse">
          <Loader2 className="text-slate-400 animate-spin" size={16} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          onError?.();
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function SocialMediaSlider({ website, businessName, compact = false }: SocialMediaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Step 1: Check preloaded data first, then scrape website as fallback
  useEffect(() => {
    // First, check if we have preloaded social media data for this business
    if (businessName) {
      const preloadedData = getSocialMediaInfo(businessName);
      if (preloadedData && (preloadedData.instagram || preloadedData.facebook)) {
        setSocialData(preloadedData);
        return; // Use preloaded data, no need to scrape
      }
    }

    // Fallback: scrape website for social media handles
    if (!website) return;

    const fetchSocialLinks = async () => {
      setIsLoadingSocial(true);
      setHasError(false);
      
      try {
        const response = await fetch(`/api/scrape-social?website=${encodeURIComponent(website)}`);
        if (response.ok) {
          const data = await response.json();
          setSocialData(data);
        } else {
          setHasError(true);
        }
      } catch (error) {
        logError("Failed to fetch social links:", error);
        setHasError(true);
      } finally {
        setIsLoadingSocial(false);
      }
    };

    fetchSocialLinks();
  }, [website, businessName]);

  // Step 2: Fetch images once we have social handles
  useEffect(() => {
    if (!socialData?.instagram && !socialData?.facebook) return;

    const fetchImages = async () => {
      setIsLoadingImages(true);
      
      try {
        const params = new URLSearchParams();
        if (socialData.instagram) params.set("instagram", socialData.instagram);
        if (socialData.facebook) params.set("facebook", socialData.facebook);
        
        const response = await fetch(`/api/social-images?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setImageData(data);
        }
      } catch (error) {
        logError("Failed to fetch social images:", error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchImages();
  }, [socialData]);

  // Navigation handlers
  const visibleCount = compact ? 3 : 4;
  const images = imageData?.images || [];
  const maxIndex = Math.max(0, images.length - visibleCount);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  // Loading state
  if (isLoadingSocial || isLoadingImages) {
    return (
      <div className={`${compact ? 'mt-3' : 'my-8'} flex items-center gap-2 text-slate-400`}>
        <Loader2 className="animate-spin" size={compact ? 14 : 18} />
        <span className={compact ? 'text-xs' : 'text-sm'}>
          {isLoadingSocial ? 'Finding social media...' : 'Loading images...'}
        </span>
      </div>
    );
  }

  // No social media found
  if (!socialData?.instagram && !socialData?.facebook) {
    return null;
  }

  // No images available - just show the social link without slider
  if (images.length === 0) {
    const isInstagram = !!socialData.instagram;
    const socialUrl = isInstagram 
      ? `https://instagram.com/${socialData.instagram}` 
      : `https://facebook.com/${socialData.facebook}`;
    
    return (
      <div className={compact ? "mt-3" : "my-8"}>
        <a
          href={socialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} ${
            isInstagram ? 'text-pink-400 hover:text-pink-300' : 'text-blue-400 hover:text-blue-300'
          } transition`}
        >
          {isInstagram ? <Instagram size={compact ? 14 : 18} /> : <Facebook size={compact ? 14 : 18} />}
          <span className={compact ? '' : 'font-medium'}>
            {isInstagram ? `@${socialData.instagram}` : socialData.facebook}
          </span>
          {!compact && (
            <span className="text-slate-500">• View on {isInstagram ? 'Instagram' : 'Facebook'}</span>
          )}
        </a>
      </div>
    );
  }

  // Determine platform info
  const isInstagram = imageData?.source === "instagram" || !!socialData.instagram;
  const handle = socialData.instagram || socialData.facebook || "";
  const socialUrl = isInstagram 
    ? `https://instagram.com/${socialData.instagram}` 
    : `https://facebook.com/${socialData.facebook}`;

  // Compact version for business cards
  if (compact) {
    return (
      <div className="mt-3">
        <a
          href={socialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-xs ${
            isInstagram ? 'text-pink-400 hover:text-pink-300' : 'text-blue-400 hover:text-blue-300'
          } transition mb-2`}
        >
          {isInstagram ? <Instagram size={14} /> : <Facebook size={14} />}
          <span className="truncate max-w-[120px]">
            {isInstagram ? `@${socialData.instagram}` : socialData.facebook}
          </span>
        </a>
        
        <div className="relative">
          <div className="flex gap-1.5 overflow-hidden rounded-lg">
            {images.slice(currentIndex, currentIndex + visibleCount).map((img, idx) => (
              <motion.div
                key={`${img}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-800"
              >
                <SocialImage
                  src={img}
                  alt={`${handle} post ${currentIndex + idx + 1}`}
                  className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
          
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-slate-800/90 hover:bg-slate-700 rounded-full p-1 shadow-lg transition z-10"
              aria-label="Previous images"
            >
              <ChevronLeft size={12} className="text-white" />
            </button>
          )}
          
          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-slate-800/90 hover:bg-slate-700 rounded-full p-1 shadow-lg transition z-10"
              aria-label="Next images"
            >
              <ChevronRight size={12} className="text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full version for blog posts
  return (
    <div className="my-8">
      <a
        href={socialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-sm ${
          isInstagram ? 'text-pink-400 hover:text-pink-300' : 'text-blue-400 hover:text-blue-300'
        } transition mb-4`}
      >
        {isInstagram ? <Instagram size={18} /> : <Facebook size={18} />}
        <span className="font-medium">
          {isInstagram ? `@${socialData.instagram}` : socialData.facebook}
        </span>
        <span className="text-slate-500">• View on {isInstagram ? 'Instagram' : 'Facebook'}</span>
      </a>
      
      <div className="relative">
        <div className="flex gap-3 overflow-hidden rounded-xl">
          {images.slice(currentIndex, currentIndex + visibleCount).map((img, idx) => (
            <motion.div
              key={`${img}-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative aspect-square flex-1 min-w-0 overflow-hidden rounded-lg group bg-slate-800"
            >
              <SocialImage
                src={img}
                alt={`${handle} post ${currentIndex + idx + 1}`}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition z-10"
            aria-label="Previous images"
          >
            <ChevronLeft size={20} className="text-slate-800" />
          </button>
        )}
        
        {currentIndex < maxIndex && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition z-10"
            aria-label="Next images"
          >
            <ChevronRight size={20} className="text-slate-800" />
          </button>
        )}
        
        {/* Dots indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? `${isInstagram ? "bg-pink-500" : "bg-blue-500"} w-4`
                    : "bg-slate-600 hover:bg-slate-500 w-2"
                }`}
                aria-label={`Go to image set ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
