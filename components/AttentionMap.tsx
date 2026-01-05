"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import type { FeatureCollection, Point } from "geojson";
import { categories, outcomeLookup } from "@/lib/defaults";
import { regionBounds } from "@/lib/attention";
import { Category, DefaultOutcome, ZoneState } from "@/lib/types";
import { filterBusinessesByQuery, getSearchSuggestions } from "@/lib/searchUtils";
import { Ripple } from "@/components/ui/ripple";
import { businessPoints as sharedBusinessPoints, getPhotoUrl } from "@/lib/businessData";
import { fetchBusinessPhotos, getCachedBusinessPhoto } from "@/hooks/useImagePreloader";
import LiveEditor from "@/components/LiveEditor";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import UserAuth from "@/components/UserAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { Session } from "next-auth";
import { logDebug, logError, logWarn } from "@/lib/logger";


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type LngLat = [number, number];

type Props = {
  zones: ZoneState[];
  defaults: DefaultOutcome[];
  displayTime: string;
};

type BusinessPoint = {
  category: string;
  subcategory?: string;
  name: string;
  phone?: string;
  meta?: string;
  coords: LngLat;
  googleMapsUrl?: string;
  placeId?: string;
  address?: string;
  rating?: number;
  photos?: string[];
  aiContent?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  email?: string;
};

type TownInfo = {
  id: string;
  name: string;
  description: string;
  image: string;
};

const buildSpotlightPublicUrl = (objectPath: string) => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base.replace(/\/$/, "")}/storage/v1/object/public/spotlight/${encodedPath}`;
};

const getTownSpotlightImageUrls = (townId: string, townName?: string) => {
  const knownFiles: Record<string, string> = {
    george: "george_aerial.jpg",
    knysna: "knysna.avif",
    mossel: "mosselbay.webp",
    oudtshoorn: "oudtshoorn.webp",
    plett: "plettenberg bay.jpg",
    sedgefield: "sedgefield.jpg",
    wilderness: "wilderness.jpg",
  };

  const aliases: Record<string, string> = {
    "plettenberg bay": "plett",
    "plettenberg": "plett",
    "plettenbergbay": "plett",
    "plettenberg_bay": "plett",
    "plettenberg-bay": "plett",
    "plett": "plett",
    "mossel bay": "mossel",
    "mosselbay": "mossel",
    "mossel_bay": "mossel",
    "mossel-bay": "mossel",
    "mossel": "mossel",
  };

  const rawId = (townId || "").trim().toLowerCase();
  const rawName = (townName || "").trim().toLowerCase();

  const normalize = (v: string) => v.trim().toLowerCase();
  const toSpaced = (v: string) => normalize(v).replace(/[\s_-]+/g, " ");
  const toUnderscore = (v: string) => normalize(v).replace(/[\s_-]+/g, "_");
  const toDash = (v: string) => normalize(v).replace(/[\s_-]+/g, "-");
  const toCompact = (v: string) => normalize(v).replace(/[\s_-]+/g, "");

  const resolveKey = () => {
    const tries = [
      rawId,
      toSpaced(rawId),
      toUnderscore(rawId),
      toDash(rawId),
      toCompact(rawId),
      rawName,
      toSpaced(rawName),
      toUnderscore(rawName),
      toDash(rawName),
      toCompact(rawName),
    ].filter(Boolean);

    for (const t of tries) {
      const k = aliases[t] || t;
      if (knownFiles[k]) return k;
    }
    for (const t of tries) {
      const k = aliases[t];
      if (k) return k;
    }
    return rawId;
  };

  const resolvedId = resolveKey();

  const exts = ["jpg", "png", "webp", "avif"] as const;
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (v: string) => {
    const value = v.trim();
    if (!value) return;
    if (seen.has(value)) return;
    seen.add(value);
    candidates.push(value);
  };

  const addBase = (base: string) => {
    const b = base.trim().toLowerCase();
    if (!b) return;
    exts.forEach((ext) => push(`${b}.${ext}`));
  };

  const addNameBases = (raw: string) => {
    const n = raw.trim().toLowerCase();
    if (!n) return;
    addBase(n);
    addBase(n.replace(/\s+/g, "_"));
    addBase(n.replace(/\s+/g, ""));
  };

  // Exact filenames from Supabase (preferred)
  const exact = knownFiles[resolvedId] || knownFiles[rawId] || "";
  push(exact);
  push(exact ? `spotlight/${exact}` : "");

  // If we have an explicit mapping, don't guess other filenames
  if (exact) {
    return candidates.map(buildSpotlightPublicUrl).filter(Boolean);
  }

  // Fallback candidates based on townName/townId
  addNameBases(townName || "");
  addBase(townId);

  return candidates.map(buildSpotlightPublicUrl).filter(Boolean);
};

// Category colors for badges
const categoryColors: Record<string, string> = {
  'Eat & Drink': '#f97316',
  'Stay': '#8b5cf6',
  'Adventure': '#22c55e',
  'Health & Essentials': '#ef4444',
  'Trades & Fixes': '#eab308',
  'Home & Living': '#06b6d4',
};

const lockBadge = (lock: DefaultOutcome["lock"]) =>
  lock === "locked" ? "default locked" : "default rotating";


// Town descriptions and images for hover tooltips - Garden Route specific images
// Using reliable Unsplash images representing each Garden Route town
const townInfo: Record<string, { description: string; image: string; highlights: string[] }> = {
  george: {
    description: "The heart of the Garden Route, George offers fine dining, family-friendly restaurants, cozy cafes, trusted trades, and essential services.",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=200&fit=crop&q=80",
    highlights: ["Fine Dining", "Family Restaurants", "Trades & Services", "Healthcare"]
  },
  wilderness: {
    description: "A tranquil coastal paradise with stunning beaches, nature reserves, and charming cafes perfect for relaxation.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop&q=80",
    highlights: ["Beaches", "Nature", "Cafes", "Relaxation"]
  },
  knysna: {
    description: "Famous for its lagoon and oysters, Knysna blends natural beauty with a vibrant food and art scene.",
    image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=200&fit=crop&q=80",
    highlights: ["Lagoon Views", "Seafood", "Art & Craft", "Boutique Shopping"]
  },
  plett: {
    description: "Plettenberg Bay offers pristine beaches, whale watching, and upscale dining in a stunning coastal setting.",
    image: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&h=200&fit=crop&q=80",
    highlights: ["Whale Watching", "Beaches", "Adventure", "Luxury Stays"]
  },
  mossel: {
    description: "A historic port town with rich maritime heritage, excellent seafood, and family-friendly attractions.",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=200&fit=crop&q=80",
    highlights: ["Maritime History", "Seafood", "Family Fun", "Water Sports"]
  },
  sedgefield: {
    description: "Known for its famous Saturday market, Sedgefield is a laid-back village with artisan goods and local charm.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80",
    highlights: ["Wild Oats Market", "Artisan Goods", "Slow Town", "Nature Walks"]
  },
  oudtshoorn: {
    description: "The ostrich capital of the world, Oudtshoorn offers unique farm experiences and access to the famous Cango Caves.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=200&fit=crop&q=80",
    highlights: ["Ostrich Farms", "Cango Caves", "Wine Routes", "Safari"]
  },
};

// This Week's Spotlight businesses for each town - Top 3 curated picks per location
const townSpotlights: Record<string, BusinessPoint[]> = {
  george: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "101 Meade Street", coords: [22.4612, -33.9589], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=101+Meade+Street+Restaurant+George" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "Fancourt Hotel", coords: [22.3856, -33.9178], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fancourt+Hotel+George" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Bayleaf Café", coords: [22.4612, -33.9584], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bayleaf+Cafe+George" },
  ],
  wilderness: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "Serendipity Restaurant", coords: [22.5801, -33.9941], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Serendipity+Restaurant+Wilderness" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "The Wilderness Hotel", coords: [22.5772, -33.9934], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Wilderness+Hotel" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Blind Tiger Coffee", coords: [22.5782, -33.9918], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Blind+Tiger+Coffee+Wilderness" },
  ],
  knysna: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "East Head Café", coords: [23.0605, -34.0766], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=East+Head+Cafe+Knysna" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "Pezula Resort Hotel & Spa", coords: [23.0834, -34.0623], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Pezula+Resort+Hotel+Spa+Knysna" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Île de Païn", coords: [23.0423, -34.0367], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ile+de+Pain+Knysna" },
  ],
  plett: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "The Table Restaurant", coords: [23.3698, -34.0528], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Table+Restaurant+Plettenberg+Bay" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "The Plettenberg", coords: [23.3745, -34.0567], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Plettenberg+Hotel" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Le Fournil de Plett", coords: [23.3678, -34.0512], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Le+Fournil+de+Plett" },
  ],
  mossel: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "Café Gannet", coords: [22.1425, -34.1800], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Gannet+Mossel+Bay" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "The Point Hotel", coords: [22.1456, -34.1823], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Point+Hotel+Mossel+Bay" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "The Blue Shed Coffee Roastery", coords: [22.1502, -34.1813], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Blue+Shed+Coffee+Roastery" },
  ],
  sedgefield: [
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Wild Oats Farmers Market", coords: [22.7889, -34.0256], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Wild+Oats+Farmers+Market+Sedgefield" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "Lake Pleasant Living", coords: [22.8234, -34.0312], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Lake+Pleasant+Living+Sedgefield" },
    { category: "Stay", subcategory: "Guesthouses & B&B", name: "Teniqua Treetops", coords: [22.8156, -34.0234], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Teniqua+Treetops+Sedgefield" },
  ],
  oudtshoorn: [
    { category: "Eat & Drink", subcategory: "Fine Dining", name: "Jemima's Restaurant", coords: [22.2012, -33.5889], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jemimas+Restaurant+Oudtshoorn" },
    { category: "Stay", subcategory: "Hotels & Resorts", name: "Rosenhof Country House", coords: [22.2078, -33.5956], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Rosenhof+Country+House" },
    { category: "Eat & Drink", subcategory: "Coffee & Breakfast", name: "Beans About Coffee", coords: [22.2067, -33.5934], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Beans+About+Coffee+Oudtshoorn" },
  ],
};

// Use shared business data from lib/businessData.ts
const businessPoints: Record<string, BusinessPoint[]> = Object.fromEntries(
  Object.entries(sharedBusinessPoints).map(([zone, businesses]) => [
    zone,
    businesses.map(b => ({
      category: b.category,
      subcategory: b.subcategory,
      name: b.name,
      phone: b.phone,
      meta: b.meta,
      coords: b.coords,
      googleMapsUrl: b.googleMapsUrl,
      placeId: b.placeId,
      address: b.address,
      rating: b.rating,
      photos: b.photos,
      aiContent: b.aiContent,
      instagram: b.instagram,
      facebook: b.facebook,
      website: b.website,
    }))
  ])
);

const CategoryPill = ({
  id,
  label,
  micro,
  active,
  onSelect,
}: {
  id: Category;
  label: string;
  micro: string;
  active: boolean;
  onSelect: (id: Category) => void;
}) => (
  <button
    onClick={() => onSelect(id)}
    className={clsx(
      "glass group relative inline-flex flex-col gap-1 rounded-xl px-3 py-2 text-left transition",
      active
        ? "!border-blue-500 !bg-blue-500/20 !text-blue-100 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
        : "border-white/5 hover:border-white/20 hover:bg-white/5",
    )}
  >
    <span className="text-xs uppercase tracking-[0.18em] text-white">
      {label}
    </span>
    <span className="text-[11px] text-white">{micro}</span>
  </button>
);

const TownButton = ({
  zone,
  active,
  onClick,
}: {
  zone: ZoneState;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "glass rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
      active
        ? "bg-white/15 text-white shadow-[0_0_30px_rgba(56,189,248,0.4)] border border-sky-400/40"
        : "bg-white/5 text-white hover:bg-white/10 hover:text-white border border-white/10",
    )}
  >
    {zone.name}
  </button>
);

const CategoryCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
  carouselPosition,
  setCarouselPosition,
  subcategories,
  selectedSubcategory,
  onSubcategorySelect,
  subcategoryBusinesses,
  onBusinessClick,
  selectedBusiness,
  onBack,
}: {
  categories: { id: string; label: string; micro: string }[];
  selectedCategory: string | null;
  onCategorySelect: (label: string | null) => void;
  carouselPosition: number;
  setCarouselPosition: (pos: number) => void;
  subcategories: string[];
  selectedSubcategory: string | null;
  onSubcategorySelect: (subcategory: string | null) => void;
  subcategoryBusinesses: BusinessPoint[];
  onBusinessClick: (business: BusinessPoint) => void;
  selectedBusiness: BusinessPoint | null;
  onBack: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Determine current view level: categories → subcategories → businesses
  const showingBusinesses = selectedSubcategory && subcategoryBusinesses.length > 0;
  const showingSubcategories = selectedCategory && subcategories.length > 0 && !showingBusinesses;
  
  // Measure container width
  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  // Calculate visible items based on container width
  const avgItemWidth = 100;
  const itemCount = showingSubcategories ? subcategories.length : categories.length;
  const visibleItems = Math.max(1, Math.floor(containerWidth / avgItemWidth));
  const SCROLL_AMOUNT = 4;
  const maxPosition = Math.max(0, itemCount - visibleItems);
  const canScrollLeft = carouselPosition > 0;
  const canScrollRight = carouselPosition < maxPosition;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCarouselPosition(Math.max(0, carouselPosition - SCROLL_AMOUNT));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCarouselPosition(Math.min(maxPosition, carouselPosition + SCROLL_AMOUNT));
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Main Content */}
      <div className="relative flex items-center justify-center w-full">
        {/* Content Container */}
        <div 
          ref={containerRef}
          className="overflow-hidden relative flex justify-center"
        >
          <AnimatePresence mode="wait">
            {showingBusinesses ? (
              /* Businesses View - 3rd tier - centered */
              <motion.div
                key="businesses"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={subcategoryBusinesses.length > 5 ? "flex gap-2 py-1 overflow-x-auto scrollbar-hide" : "flex flex-wrap justify-center gap-2 py-1"}
                style={subcategoryBusinesses.length > 5 ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}}
              >
                {/* Back button - inline with pills, same height */}
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 px-3 py-2 rounded-2xl flex items-center justify-center glass border border-white/10 text-white hover:bg-white/10 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                {/* Subcategory label */}
                <div className="flex-shrink-0 px-3 py-2 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-200">
                  <span className="text-xs font-bold whitespace-nowrap">{selectedSubcategory}</span>
                </div>
                {/* Business pills */}
                {subcategoryBusinesses.map((biz, index) => (
                  <motion.button
                    key={biz.name}
                    onClick={() => onBusinessClick(biz)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "flex-shrink-0 px-4 py-2 rounded-2xl text-center transition-all duration-300",
                      "backdrop-blur-xl border",
                      selectedBusiness?.name === biz.name
                        ? "bg-gradient-to-r from-amber-500/50 to-orange-500/50 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/30"
                        : "glass border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    <span className="text-xs font-semibold tracking-wide">
                      {biz.name}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            ) : showingSubcategories ? (
              /* Subcategories View - 2nd tier - centered */
              <motion.div
                key="subcategories"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={subcategories.length > 5 ? "flex gap-2 py-1 overflow-x-auto scrollbar-hide" : "flex flex-wrap justify-center gap-2 py-1"}
                style={subcategories.length > 5 ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}}
              >
                {/* Back button - inline with pills, same height */}
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 px-3 py-2 rounded-2xl flex items-center justify-center glass border border-white/10 text-white hover:bg-white/10 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                {/* Category label */}
                <div className="flex-shrink-0 px-3 py-2 rounded-2xl bg-sky-600/30 border border-sky-500/40 text-sky-200">
                  <span className="text-xs font-bold whitespace-nowrap">{selectedCategory}</span>
                </div>
                {/* Subcategory pills */}
                {subcategories.map((subcat, index) => (
                  <motion.button
                    key={subcat}
                    onClick={() => onSubcategorySelect(subcat)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0 px-4 py-2 rounded-2xl text-center transition-all duration-300 backdrop-blur-xl border glass border-white/10 text-white hover:bg-white/10 whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold tracking-wide">
                      {subcat}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              /* Parent Categories View - 1st tier - No carousel, centered flex wrap */
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-wrap justify-center gap-2 py-1"
              >
                {categories.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.label)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded-2xl text-center transition-all duration-300 backdrop-blur-xl border glass border-white/10 text-white hover:bg-white/10"
                  >
                    <span className="text-xs font-semibold tracking-wide">
                      {cat.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

// Image Gallery Modal with Auto-Slideshow
const ImageGalleryModal = ({
  isOpen,
  photos,
  currentIndex,
  businessName,
  onClose,
  onIndexChange,
}: {
  isOpen: boolean;
  photos: string[];
  currentIndex: number;
  businessName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) => {
  const [isPaused, setIsPaused] = useState(false);
  
  // Auto-slideshow every 5 seconds (can be paused)
  useEffect(() => {
    if (!isOpen || photos.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % photos.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isOpen, photos.length, currentIndex, onIndexChange, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onIndexChange((currentIndex - 1 + photos.length) % photos.length);
      } else if (e.key === 'ArrowRight') {
        onIndexChange((currentIndex + 1) % photos.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onIndexChange, onClose]);

  if (!isOpen || photos.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/98 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all hover:scale-105"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Business name header */}
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-white font-semibold text-lg">{businessName}</h3>
        <p className="text-white/60 text-sm">{currentIndex + 1} of {photos.length}</p>
      </div>
      
      {/* Navigation Arrows - Smaller */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((currentIndex - 1 + photos.length) % photos.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all hover:scale-110 group"
          >
            <svg className="w-5 h-5 text-white group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((currentIndex + 1) % photos.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all hover:scale-110 group"
          >
            <svg className="w-5 h-5 text-white group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Main Image - Click to pause/resume */}
      <motion.img
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={getPhotoUrl(photos[currentIndex], 1200)}
        alt={`${businessName} - Photo ${currentIndex + 1}`}
        className="max-w-[85vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(!isPaused);
        }}
      />
      
      {/* Dot Indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? "bg-sky-400 scale-125 shadow-lg shadow-sky-400/50" 
                  : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause indicator */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(!isPaused);
          }}
          className="absolute bottom-8 right-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors"
        >
          {isPaused ? (
            <>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-xs text-white/70">Paused</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs text-white/70">Auto-play</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

const BusinessCard = ({
  business,
  zone,
  expanded,
  onToggle,
}: {
  business: BusinessPoint | null;
  zone: ZoneState | null;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { data: session } = useSession();
  // Favorites hook
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = zone?.id && business?.name ? isFavorite(zone.id, business.name) : false;
  
  // State for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // State for all details fetched from Google Places API
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<{
    phone?: string;
    website?: string;
    address?: string;
    openingHours?: string[];
    reviews?: { text: string; rating: number; authorName: string }[];
    description?: string;
  } | null>(null);
  
  // Fetch all details when business changes - use placeId if available, otherwise search by name+location
  useEffect(() => {
    if (!business || !zone) return;

    const stateInitId = setTimeout(() => {
      setPhotosLoading(true);
      setAllPhotos([]);
      setPlaceDetails(null);
    }, 0);
    
    // Build API URL - use placeId if available, otherwise use name+location
    let apiUrl: string;
    if (business.placeId) {
      apiUrl = `/api/places/photos?placeId=${business.placeId}`;
    } else {
      // Get town name from zone for location context
      const townName = zone.id.charAt(0).toUpperCase() + zone.id.slice(1);
      const locationQuery = townName === 'Mossel' ? 'Mossel Bay' : 
                           townName === 'Plett' ? 'Plettenberg Bay' : 
                           townName + ', South Africa';
      apiUrl = `/api/places/photos?name=${encodeURIComponent(business.name)}&location=${encodeURIComponent(locationQuery)}`;
    }
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        // Set photos from Google Places
        if (data.photos && data.photos.length > 0) {
          setAllPhotos(data.photos);
        } else if (business.photos && business.photos.length > 0) {
          setAllPhotos(business.photos);
        }
        // Set other details from Google Places
        setPlaceDetails({
          phone: data.phone || business.phone,
          website: data.website || business.website,
          address: data.address || business.address,
          openingHours: data.openingHours,
          reviews: data.reviews,
          description: data.description
        });
      })
      .catch((err) => {
        logError('Failed to fetch place details:', err);
        if (business.photos) {
          setAllPhotos(business.photos);
        }
      })
      .finally(() => setPhotosLoading(false));

    return () => clearTimeout(stateInitId);
  }, [business?.name, business?.placeId, zone?.id]);

  if (!business || !zone) return null;
  
  // Use Google data or fallback to stored data
  const displayPhone = placeDetails?.phone || business.phone;
  const displayWebsite = placeDetails?.website || business.website;
  const displayAddress = placeDetails?.address || business.address;
  const displayHours = placeDetails?.openingHours;
  const displayReviews = placeDetails?.reviews;
  const displayDescription = placeDetails?.description;

  const [lng, lat] = business.coords;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Generate business-specific URL
  const generateBusinessUrl = (business: BusinessPoint, zoneId: string) => {
    const businessSlug = `${zoneId}-${business.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").trim()}`;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://spotlight.co.za";
    return `${baseUrl}/business/${businessSlug}`;
  };

  // Better share URLs
  const businessUrl = generateBusinessUrl(business, zone?.id || "");
  const shareText = `Check out ${business.name} in ${zone?.name || "the Garden Route"} - a top-rated business! 🗺️✨`;
  const fullShareText = `${shareText} ${businessUrl}`;

  // Improved social URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(businessUrl)}&quote=${encodeURIComponent(shareText)}&hashtag=%23GardenRoute`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}&hashtags=GardenRoute,Business`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(businessUrl)}`;

  // Function to get blog slug for business - maps to existing blog articles
  const getBusinessBlogSlug = (businessName: string): string | null => {
    const blogMappings: Record<string, string> = {
      // Default single-business blogs
      "Protea Hotel King George": "protea-hotel-king-george-default",
      "Avis George Airport": "avis-george-airport-default",
      "Avis Car Rental George Airport": "avis-george-airport-default",
      "The Wilderness Hotel": "wilderness-hotel-default",
      "Beacon Island Resort": "beacon-island-default",
      "The Foundry Roasters": "foundry-roasters-george-default",
      "The Foundry (Root Coffee)": "foundry-roasters-george-default",
      "George Dental Care": "george-dental-care-default",
      // Top 3 Restaurants George 2026
      "The Fat Fish George": "top-3-restaurants-george-2026",
      "Old Town Italy George": "top-3-restaurants-george-2026",
      "The Hussar Grill George": "top-3-restaurants-george-2026",
      // George Guest Houses Accommodation Guide
      "Oakhurst Hotel": "george-guest-houses-accommodation-guide",
      "Acorn Guest House": "george-guest-houses-accommodation-guide",
      "Caledon 23 Country House": "george-guest-houses-accommodation-guide",
    };
    return blogMappings[businessName] || null;
  };

  const handleShare = (platform: "facebook" | "twitter" | "linkedin" | "whatsapp" | "copy" | "native") => {
    // Track share action in background (non-blocking)
    fetch('/api/metrics/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: business.name,
        action: 'share'
      })
    }).catch(() => {});

    // Execute share immediately
    if (platform === "facebook") {
      window.open(facebookShareUrl, "_blank", "width=600,height=400");
    } else if (platform === "twitter") {
      window.open(twitterShareUrl, "_blank", "width=600,height=400");
    } else if (platform === "linkedin") {
      window.open(linkedinShareUrl, "_blank", "width=600,height=400");
    } else if (platform === "whatsapp") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
      window.open(whatsappUrl, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard?.writeText(businessUrl).then(() => {
        const notification = document.createElement('div');
        notification.textContent = 'Link copied!';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 9999;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 2000);
      });
    } else if (platform === "native" && navigator.share) {
      navigator.share({
        title: `${business.name} - Garden Route`,
        text: shareText,
        url: businessUrl,
      }).catch(() => {});
    }
  };

  // Helper to render meta text with clickable links if it looks like a website
  const renderMeta = (text: string) => {
    const urlPattern = /([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/g;
    const parts = text.split(urlPattern).filter(Boolean);

    if (text.match(urlPattern)) {
      return (
        <span className="text-slate-400">
          {text.split(" ").map((word, i) => {
            if (word.match(urlPattern)) {
              const url = word.startsWith("http") ? word : `https://${word}`;
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-sky-200 underline decoration-sky-300/30 underline-offset-2 transition pointer-events-auto"
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Track website click
                    try {
                      await fetch('/api/metrics/business', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          businessName: business.name,
                          action: 'website'
                        })
                      });
                    } catch (error) {
                      logError('Failed to track website:', error);
                    }
                  }}
                >
                  {word}
                </a>
              );
            }
            return word + (i < text.split(" ").length - 1 ? " " : "");
          })}
        </span>
      );
    }
    return <span className="text-slate-400">{text}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }
      }}
      exit={{
        opacity: 0,
        y: 10,
        scale: 0.95,
        transition: {
          duration: 0.25,
          ease: [0.4, 0, 1, 1],
        }
      }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-800/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto w-full max-w-sm overflow-hidden relative group"
      style={{
        display: "flex",
        flexDirection: "column",
        maxHeight: "70vh",
      }}
    >
      {/* Heart/Favorite Button - TOP LEFT - FIXED position */}
      <div className="absolute top-2 left-2 z-[60]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!session) {
              signIn("google");
              return;
            }
            if (zone?.id && business?.name) {
              toggleFavorite(zone.id, business.name);
            }
          }}
          className="p-2 rounded-full backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 bg-black/60 hover:bg-black/80 border-2 border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.5)] hover:shadow-[0_0_18px_rgba(56,189,248,0.7)]"
          style={{ pointerEvents: 'auto' }}
          aria-label={saved ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              saved ? "fill-sky-400 text-sky-400" : "text-sky-300 hover:text-sky-200"
            }`}
          />
        </button>
      </div>
      {/* Close Button - TOP RIGHT - FIXED position - Same size as heart */}
      <div className="absolute top-2 right-2 z-[60]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('closeBusinessCard');
              window.dispatchEvent(event);
            }
          }}
          className={`p-2 rounded-full backdrop-blur-sm transition pointer-events-auto ${
            allPhotos.length > 0 ? "bg-black/50 hover:bg-black/70" : "bg-slate-700/80 hover:bg-slate-600/80"
          }`}
          aria-label="Close"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Scrollable content wrapper - images and content scroll together */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Feature Image at Top - NOT clickable, only thumbnails open gallery */}
      {allPhotos.length > 0 && (
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
          <img
            src={getPhotoUrl(allPhotos[0], 400)}
            alt={business.name}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent pointer-events-none" />
          {business.rating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[10px] font-bold text-white">{business.rating}</span>
            </div>
          )}
          {/* Photo count indicator */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-bold text-white">{allPhotos.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Image Modal with Auto-Slideshow */}
      <ImageGalleryModal
        isOpen={showImageModal}
        photos={allPhotos}
        currentIndex={modalImageIndex}
        businessName={business.name}
        onClose={() => setShowImageModal(false)}
        onIndexChange={setModalImageIndex}
      />
      
      {/* Header - Compact */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30">
                <p className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">
                  {business.category}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {zone?.name}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {business.name}
            </h3>
            {/* Social Media Links - compact version */}
            <div onClick={(e) => e.stopPropagation()}>
              <SocialMediaLinks 
                businessName={business.name}
                website={business.website}
                compact 
              />
            </div>
          </div>
          <div className="flex items-start gap-1 flex-shrink-0">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-sky-500/30 to-blue-500/30 hover:from-sky-500/40 hover:to-blue-500/40 border border-sky-400/30 transition-all pointer-events-auto flex items-center gap-1"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await fetch('/api/metrics/business', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      businessName: business.name,
                      action: 'directions'
                    })
                  });
                } catch (error) {
                  logError('Failed to track directions:', error);
                }
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Directions
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggle && typeof onToggle === "function") {
                  onToggle();
                }
              }}
              className="glass rounded-lg p-1 hover:bg-white/10 transition pointer-events-auto"
              aria-label={expanded ? "Minimize" : "Expand"}
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {expanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Google Business Photos Slider - Skip first photo (shown as feature) */}
        {(allPhotos.length > 1 || photosLoading) && (
          <div className="mt-2 -mx-3">
            <div className="flex gap-2 overflow-x-auto px-3 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {photosLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, idx) => (
                  <div 
                    key={idx}
                    className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-700/50 animate-pulse"
                  />
                ))
              ) : (
                allPhotos.slice(1).map((photo, idx) => (
                  <div 
                    key={idx} 
                    className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all cursor-pointer group/photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex(idx + 1);
                      setShowImageModal(true);
                    }}
                  >
                    <img
                      src={getPhotoUrl(photo, 200)}
                      alt={`${business.name} photo ${idx + 2}`}
                      className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* Hover overlay with expand icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{
              height: "auto",
              opacity: 1,
              y: 0,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                },
                opacity: { duration: 0.25, delay: 0.05 },
                y: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              scale: 0.98,
              transition: {
                height: {
                  type: "tween",
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1],
                },
                opacity: { duration: 0.2, ease: "easeOut" },
                scale: { duration: 0.2, ease: "easeOut" },
              }
            }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3">
              <div className="space-y-4">
                {/* About Section - Detailed and unique per business */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">About</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-white leading-relaxed bg-slate-800/90 p-2.5 rounded">
                      {displayDescription ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: displayDescription.replace(
                            new RegExp(`(${business.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), 
                            '<span class="font-bold text-sky-300">$1</span>'
                          )
                        }} />
                      ) : business.meta ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: business.meta.replace(
                            new RegExp(`(${business.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), 
                            '<span class="font-bold text-sky-300">$1</span>'
                          )
                        }} />
                      ) : (
                        <>
                          <span className="font-bold text-sky-300">{business.name}</span> is a premier {business.category.toLowerCase()} establishment located in the heart of {zone.name}. As one of the top-rated businesses in the Garden Route, they offer exceptional service and quality that locals and visitors alike have come to trust. Whether you&apos;re a resident or exploring the beautiful Garden Route, {business.name} provides an outstanding experience in the {business.category.toLowerCase()} category.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Hours Section - From Google */}
                {displayHours && displayHours.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Hours</h3>
                    <div className="bg-slate-800/90 p-2.5 rounded space-y-1">
                      {displayHours.map((hours, idx) => (
                        <p key={idx} className="text-[10px] text-white">{hours}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Section - Only show if there's contact info */}
                {(displayAddress || displayPhone || displayWebsite) && (
                  <div>
                    <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Contact</h3>
                    <div className="space-y-2">
                      {displayAddress && (
                        <div className="p-2.5 rounded bg-slate-800/90">
                          <p className="text-xs text-white">{displayAddress}</p>
                        </div>
                      )}
                      {displayPhone && (
                        <div className="p-2.5 rounded bg-slate-800/90">
                          <a
                            href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                            className="text-xs font-bold text-sky-300 hover:text-sky-200 transition block pointer-events-auto"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await fetch('/api/metrics/business', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ businessName: business.name, action: 'call' })
                                });
                              } catch (error) {
                                logError('Failed to track call:', error);
                              }
                            }}
                          >
                            📞 {displayPhone}
                          </a>
                        </div>
                      )}
                      {displayWebsite && (
                        <a
                          href={displayWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2.5 rounded bg-slate-800/90 text-xs text-sky-300 hover:text-sky-200 transition pointer-events-auto truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🌐 Website: {displayWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-3">Share This Business</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("whatsapp"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-green-500/20 hover:border-green-400/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Share on WhatsApp"
                    >
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.766-1.653-2.063-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.072 1.758-.234 2.008-.463.25-.229.25-.462.175-.612-.075-.15-.277-.24-.574-.389zM12.008 21c-1.649 0-3.259-.441-4.677-1.272l-3.357.88 1.02-3.147c-.917-1.413-1.4-3.062-1.4-4.753 0-4.803 3.907-8.71 8.711-8.71 2.328 0 4.515.906 6.16 2.554a8.657 8.657 0 0 1 2.554 6.156c-.001 4.804-3.91 8.71-8.714 8.71zM20.52 3.449C18.248 1.203 15.232 0 12.007 0 5.462 0 .14 5.323.137 11.87c0 2.092.547 4.135 1.588 5.945L0 24l6.335-1.662c1.747.953 3.71 1.456 5.704 1.456h.006c6.544 0 11.869-5.324 11.873-11.87 0-3.172-1.234-6.155-3.472-8.401z" />
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("facebook"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-[#133656]/20 hover:border-[#133656]/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Share on Facebook"
                    >
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.37-4.669 1.235 0 2.528.22 2.528.22V7.78h-1.428c-1.49 0-1.95.925-1.95 1.874v2.251h3.144l-.502 3.47h-2.642V24c5.737-.9 10.125-5.864 10.125-11.927z" />
                      </svg>
                      Facebook
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("twitter"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-[#133656]/20 hover:border-[#133656]/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Share on Twitter"
                    >
                      <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      Twitter
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("copy"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-purple-500/20 hover:border-purple-400/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Copy link"
                    >
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* End scrollable content wrapper */}

      {/* View More Details Link - Links to blog if exists, otherwise shows coming soon */}
      <div className="px-3 pb-3 pt-2 border-t border-white/10">
        {getBusinessBlogSlug(business.name) ? (
          <a
            href={`/blogs/${getBusinessBlogSlug(business.name)}#${business.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").trim()}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 border border-sky-400/30 text-sky-300 hover:text-white text-xs font-semibold transition-all pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Read Full Article
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800/50 border border-white/5 text-slate-500 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More details coming soon
          </div>
        )}
      </div>

    </motion.div>
  );
};








const Spotlight = ({
  zone,
  onClose,
  onBusinessSelect,
}: {
  zone: ZoneState;
  onClose: () => void;
  onBusinessSelect?: (business: BusinessPoint) => void;
}) => {
  // Track spotlight view on mount
  useEffect(() => {
    const businesses = townSpotlights[zone.id] || [];
    businesses.forEach((business) => {
      fetch('/api/metrics/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name,
          location: zone.id,
          action: 'view'
        })
      }).catch(() => {});
    });
  }, [zone.id]);

  // Track click on business
  const handleBusinessClick = (business: BusinessPoint) => {
    fetch('/api/metrics/spotlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: business.name,
        location: zone.id,
        action: 'click'
      })
    }).catch(() => {});
    onBusinessSelect?.(business);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-800/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto w-full max-w-sm overflow-hidden relative flex flex-col group/card"
    >
      {/* Gradient accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      {/* Header with Close Button */}
      <div className="relative p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-2xl" />
              <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 flex items-center justify-center shadow-xl shadow-sky-900/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1.5">
                {zone.name} <span className="text-sky-400 font-light">Spotlight</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Top 3 • Curated</p>
              </div>
            </div>
          </div>
          {/* Close Button (X) */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-full hover:bg-white/10 transition-all text-white/60 hover:text-white"
            aria-label="Close spotlight"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - Horizontal Layout */}
      <div className="p-4">
        <div className="flex gap-2">
          {townSpotlights[zone.id]?.slice(0, 3).map((business, i) => (
            <motion.button
              key={business.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 } }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBusinessClick(business)}
              className="flex-1 relative p-3 rounded-xl border border-white/10 bg-black/30 hover:bg-black/50 hover:border-sky-500/40 transition-all duration-300 text-center group/item overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/0 to-sky-500/10 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-2 group-hover/item:border-sky-500/40 transition-all">
                  <span className="text-lg">
                    {business.category === 'Stay' ? '🏨' :
                      business.category === 'Eat' ? '🍴' :
                        business.category === 'Coffee' ? '☕' :
                          business.category === 'Dental' ? '🦷' :
                            business.category === 'Car Hire' ? '🚗' : '💎'}
                  </span>
                </div>
                <h4 className="text-[11px] font-bold text-white group-hover/item:text-sky-300 transition-colors line-clamp-2 leading-tight mb-1">
                  {business.name}
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium">
                  {business.category}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {(!townSpotlights[zone.id] || townSpotlights[zone.id].length === 0) && (
          <div className="text-center py-6 space-y-2 bg-slate-900/20 rounded-xl border border-dashed border-white/10">
            <div className="text-xl opacity-20">🔍</div>
            <p className="text-xs text-slate-500 font-medium">Curating highlights...</p>
          </div>
        )}
      </div>

      {/* Sponsored label */}
      <div className="px-4 pb-3">
        <p className="text-[8px] text-slate-500 text-center uppercase tracking-widest">Featured Businesses</p>
      </div>
    </motion.div>
  );
};

// ListViewBusinessCard - Individual business card with dynamic image loading
const ListViewBusinessCard = ({
  business,
  townId,
  isFavorite,
  toggleFavorite,
  onBusinessClick,
  getPhotoUrl,
  session,
}: {
  business: BusinessPoint;
  townId: string;
  isFavorite: (townId: string, businessName: string) => boolean;
  toggleFavorite: (townId: string, businessName: string) => void;
  onBusinessClick: (biz: BusinessPoint) => void;
  getPhotoUrl: (photoRef: string, maxWidth?: number) => string;
  session: Session | null;
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSaved = isFavorite(townId, business.name);

  // Fetch photo from Google Places API
  useEffect(() => {
    let mounted = true;

    const initId = setTimeout(() => {
      if (!mounted) return;
      setIsLoading(true);

      // Use static photos if available
      if (business.photos && business.photos.length > 0) {
        setPhotoUrl(getPhotoUrl(business.photos[0], 400));
        setIsLoading(false);
        return;
      }

      // Fetch from API
      fetchBusinessPhotos(business.name, townId)
        .then((photos) => {
          if (mounted && photos.length > 0) {
            setPhotoUrl(getPhotoUrl(photos[0], 400));
          }
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(initId);
    };
  }, [business.name, business.photos, townId, getPhotoUrl]);

  return (
    <div
      onClick={() => onBusinessClick(business)}
      className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer relative group"
    >
      {/* Heart Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!session) {
            signIn("google");
            return;
          }
          toggleFavorite(townId, business.name);
        }}
        className="absolute top-3 right-3 z-20 p-2 bg-slate-900/80 rounded-full backdrop-blur-sm border border-slate-700/50 hover:scale-110 hover:bg-slate-800 transition-all"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isSaved ? "fill-sky-400 text-sky-400" : "text-slate-400 group-hover:text-slate-300"
          }`}
        />
      </button>

      {/* Image Section - Top */}
      <div className="relative h-36 w-full bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt={business.name}
              loading="eager"
              onLoad={() => setIsLoading(false)}
              className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? "opacity-0 scale-110" : "opacity-100 scale-100 group-hover:scale-105"}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                setIsLoading(false);
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 animate-pulse flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        {/* Rating badge on image */}
        {business.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-white">{business.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content Section - Bottom */}
      <div className="p-3">
        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
          {business.category}
        </span>
        <h3 className="font-semibold text-white text-sm mt-0.5 line-clamp-1 group-hover:text-emerald-300 transition-colors">
          {business.name}
        </h3>
        {business.address && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            {business.address}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/50">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          {business.googleMapsUrl && (
            <a
              href={business.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ListView Component for list mode - Dark theme design
const ListView = ({
  activeZoneId,
  activeZoneName,
  availableCategories,
  availableSubcategories,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  businessPoints,
  getCategoryBusinesses,
  getPhotoUrl,
  onBusinessClick,
  session,
}: {
  activeZoneId: string;
  activeZoneName: string;
  availableCategories: { id: string; label: string; micro: string }[];
  availableSubcategories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedSubcategory: string | null;
  setSelectedSubcategory: (subcat: string | null) => void;
  businessPoints: Record<string, BusinessPoint[]>;
  getCategoryBusinesses: (zoneId: string | null, category: string | null, subcategory?: string | null) => BusinessPoint[];
  getPhotoUrl: (photoRef: string, maxWidth?: number) => string;
  onBusinessClick: (biz: BusinessPoint) => void;
  session: Session | null;
}) => {
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [debouncedListSearchQuery, setDebouncedListSearchQuery] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();

  // Debounce list search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedListSearchQuery(listSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [listSearchQuery]);

  // Filter businesses based on search, category and subcategory
  const filteredBusinesses = useMemo(() => {
    let businesses = getCategoryBusinesses(activeZoneId, selectedCategory, selectedSubcategory);

    if (debouncedListSearchQuery.trim()) {
      const query = debouncedListSearchQuery.toLowerCase();
      businesses = businesses.filter(
        (biz) =>
          biz.name.toLowerCase().includes(query) ||
          biz.category.toLowerCase().includes(query) ||
          biz.subcategory?.toLowerCase().includes(query) ||
          biz.address?.toLowerCase().includes(query)
      );
    }

    return businesses;
  }, [activeZoneId, selectedCategory, selectedSubcategory, debouncedListSearchQuery, getCategoryBusinesses]);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 z-40 overflow-hidden flex flex-col pt-6">
      {/* Search Bar - Matching Map View Style */}
      <div className="w-full max-w-md mx-auto px-4 mb-4">
        <div className="glass rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-3 shadow-xl">
          <svg
            className="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search businesses..."
            value={listSearchQuery}
            onChange={(e) => setListSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 flex-1 min-w-0"
          />
          {listSearchQuery && (
            <button
              onClick={() => setListSearchQuery("")}
              className="text-white hover:text-white/80 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills - Matching Map View Style */}
      <div className="w-full px-6 flex justify-center mb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              !selectedCategory
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-lg shadow-sky-500/10"
                : "glass text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const newCat = selectedCategory === cat.label ? null : cat.label;
                setSelectedCategory(newCat);
                setSelectedSubcategory(null);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.label
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-lg shadow-sky-500/10"
                  : "glass text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Pills - Show when category is selected */}
      {selectedCategory && availableSubcategories.length > 0 && (
        <div className="w-full px-6 flex justify-center mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {availableSubcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => setSelectedSubcategory(selectedSubcategory === subcat ? null : subcat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedSubcategory === subcat
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/10"
                    : "glass text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">{activeZoneName}</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
          {selectedSubcategory ? ` in ${selectedSubcategory}` : selectedCategory ? ` in ${selectedCategory}` : ''}
        </p>
      </div>

      {/* Scrollable Business List - 3 Column Grid */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-white font-medium text-lg">No businesses found</p>
              <p className="text-sm text-slate-500 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBusinesses.map((biz, idx) => (
                <ListViewBusinessCard
                  key={`${biz.name}-${idx}`}
                  business={biz}
                  townId={activeZoneId}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                  onBusinessClick={onBusinessClick}
                  getPhotoUrl={getPhotoUrl}
                  session={session}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AttentionMap = ({ zones, defaults, displayTime }: Props) => {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [fallback, setFallback] = useState(false);
  const [category, setCategory] = useState<Category>("eat-drink");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessPoint | null>(null);
  const selectedBusinessRef = useRef<BusinessPoint | null>(null);
  const activeZoneIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedBusinessRef.current = selectedBusiness;
  }, [selectedBusiness]);
  useEffect(() => {
    activeZoneIdRef.current = activeZoneId;
  }, [activeZoneId]);

  const [expanded, setExpanded] = useState(false);
  const [defaultCardExpanded, setDefaultCardExpanded] = useState(true);
  const [businessIndex, setBusinessIndex] = useState(0); // Track current business index in category
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering businesses
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false); // Show autocomplete suggestions
  const [carouselPositions, setCarouselPositions] = useState<Record<number, number>>({}); // Track carousel positions for each row
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [localSpotlights, setLocalSpotlights] = useState(townSpotlights);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Debounce search query to prevent excessive marker updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if editor mode is enabled via URL (only from editor dashboard iframe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const adminSession = document.cookie.includes("admin-session=true");
      // Only enable editor mode when accessed via ?editor=true AND user is admin
      if (params.get("editor") === "true" && adminSession) {
        setIsEditorMode(true);
        setShowLiveEditor(true);
      }
    }
  }, []);

  // Listen for closeBusinessCard event from the X button
  useEffect(() => {
    const handleCloseBusinessCard = () => {
      setSelectedBusiness(null);
      setExpanded(false);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    };
    window.addEventListener('closeBusinessCard', handleCloseBusinessCard);
    return () => window.removeEventListener('closeBusinessCard', handleCloseBusinessCard);
  }, []);

  // Dispatch event when town becomes active/inactive to hide BottomNav
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('townActiveChange', { detail: { active: !!activeZoneId } });
      window.dispatchEvent(event);
    }
  }, [activeZoneId]);

  // Check sessionStorage for business selection from My Trip page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('selectedBusiness');
      if (stored) {
        try {
          const { townId, businessName } = JSON.parse(stored);
          sessionStorage.removeItem('selectedBusiness'); // Clear after reading
          
          // Find the business in the data
          const townBusinesses = businessPoints[townId];
          if (townBusinesses) {
            const business = townBusinesses.find(b => b.name === businessName);
            if (business) {
              // Activate the town first
              setActiveZoneId(townId);
              setExpanded(true);
              
              // Small delay to let the map fly to town, then select business
              setTimeout(() => {
                setSelectedBusiness(business);
                setSelectedCategory(business.category);
                
                // Fly to the business location if map is ready
                if (mapRef.current && business.coords) {
                  mapRef.current.flyTo({
                    center: business.coords,
                    zoom: 16,
                    duration: 1200,
                    pitch: 60,
                  });
                }
              }, 800);
            }
          }
        } catch (e) {
          logError('Failed to parse selectedBusiness from sessionStorage:', e);
        }
      }
    }
  }, []);

  // Get available categories for active zone
  const availableCategories = useMemo(() => {
    if (!activeZoneId) return [];
    const biz = businessPoints[activeZoneId] ?? [];
    const labels = new Set(biz.map((b) => b.category));
    return categories.filter(c => labels.has(c.label));
  }, [activeZoneId]);

  // Get available subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!activeZoneId || !selectedCategory) return [];
    const biz = businessPoints[activeZoneId] ?? [];
    const subcats = new Set(
      biz
        .filter((b) => b.category === selectedCategory && b.subcategory)
        .map((b) => b.subcategory as string)
    );
    return Array.from(subcats).sort();
  }, [activeZoneId, selectedCategory]);

  // Compute search suggestions based on query using advanced semantic search
  const searchSuggestions = useMemo(() => {
    if (!activeZoneId || !debouncedSearchQuery.trim()) return [];

    // Get businesses for the active zone
    const biz = businessPoints[activeZoneId] ?? [];
    
    // Use the advanced search utilities for semantic matching
    return getSearchSuggestions(debouncedSearchQuery, biz, 8);
  }, [activeZoneId, debouncedSearchQuery]);

  const outcomeMap = useMemo(() => outcomeLookup(defaults), [defaults]);

  const activeZone = useMemo(() => zones.find((z) => z.id === activeZoneId) ?? null, [zones, activeZoneId]);

  // Helper function to get businesses by category and optionally subcategory
  const getCategoryBusinesses = useCallback((zoneId: string | null, category: string | null, subcategory: string | null = null): BusinessPoint[] => {
    if (!zoneId) return [];
    const biz = businessPoints[zoneId] ?? [];
    
    // If subcategory is selected, filter by subcategory only
    if (subcategory) {
      return biz.filter((b) => b.subcategory === subcategory);
    }
    
    // If only category is selected, filter by category
    if (category) {
      return biz.filter((b) => b.category === category);
    }
    
    // No filter - return all
    return biz;
  }, []);

  // Track if business marker handlers have been set up
  const businessHandlersSetRef = useRef(false);
  const hoveredIdRef = useRef<string | null>(null);

  const updateBusinessMarkers = useCallback(
    (zoneId: string | null, categoryFilter: string | null = null, subcategoryFilter: string | null = null, searchFilter: string = "") => {
      logDebug(`[updateBusinessMarkers] zoneId=${zoneId}, categoryFilter=${categoryFilter}, subcategoryFilter=${subcategoryFilter}, searchFilter=${searchFilter}`);
      
      let biz = businessPoints[zoneId ?? ""] ?? [];
      logDebug(`[updateBusinessMarkers] Found ${biz.length} businesses for zone ${zoneId}`);

      // Filter by subcategory if selected (most specific)
      if (subcategoryFilter) {
        biz = biz.filter((b) => b.subcategory === subcategoryFilter);
        logDebug(`[updateBusinessMarkers] After subcategory filter: ${biz.length} businesses`);
      } else if (categoryFilter) {
        // Filter by category if selected (parent level)
        biz = biz.filter((b) => b.category === categoryFilter);
        logDebug(`[updateBusinessMarkers] After category filter: ${biz.length} businesses`);
      }

      // Filter by search query if provided (using semantic search)
      if (searchFilter.trim()) {
        biz = filterBusinessesByQuery(biz, searchFilter);
      }

      logDebug(`[updateBusinessMarkers] mapRef.current=${!!mapRef.current}, fallback=${fallback}`);
      
      if (mapRef.current && !fallback) {
        const map = mapRef.current;
        const sourceId = "business-points";
        
        // Check if source exists - if it does, we can update regardless of isStyleLoaded()
        // isStyleLoaded() can return false during 3D terrain rendering even after init
        const existingSource = map.getSource(sourceId);
        const styleLoaded = map.isStyleLoaded();
        logDebug(`[updateBusinessMarkers] Style loaded: ${styleLoaded}, Source exists: ${!!existingSource}`);
        
        // If source doesn't exist AND style isn't loaded, wait for idle event (more reliable than style.load)
        if (!existingSource && !styleLoaded) {
          logDebug(`[updateBusinessMarkers] No source and style not loaded - waiting for idle...`);
          const waitForReady = () => {
            const checkSource = map.getSource(sourceId);
            if (checkSource || map.isStyleLoaded()) {
              logDebug(`[updateBusinessMarkers] Map ready, retrying`);
              updateBusinessMarkers(zoneId, categoryFilter, subcategoryFilter, searchFilter);
            } else {
              // Try both idle and a timeout as fallback
              const timeout = setTimeout(() => {
                logDebug(`[updateBusinessMarkers] Timeout fallback, retrying`);
                updateBusinessMarkers(zoneId, categoryFilter, subcategoryFilter, searchFilter);
              }, 500);
              map.once('idle', () => {
                clearTimeout(timeout);
                logDebug(`[updateBusinessMarkers] idle event fired, retrying`);
                updateBusinessMarkers(zoneId, categoryFilter, subcategoryFilter, searchFilter);
              });
            }
          };
          waitForReady();
          return;
        }
        const glowLayerId = "business-points-glow";
        const mainLayerId = "business-points-main";
        const centerLayerId = "business-points-center";
        
        // Use original coordinates - Mapbox clustering handles overlapping points
        const featureCollection: FeatureCollection<Point, { id: string; label: string; meta: string; category: string; phone: string; businessData: string; realCoords: string }> = {
          type: "FeatureCollection",
          features: biz.map((b) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: b.coords },
            properties: {
              id: `${zoneId}-${b.name}`,
              label: b.name,
              meta: b.meta || "",
              category: b.category,
              phone: b.phone || "",
              businessData: JSON.stringify(b),
              realCoords: JSON.stringify(b.coords),
            },
          })),
        };

        // Source and layers are pre-initialized in map load handler
        // Just update the data - with retry logic if source not ready
        let retryCount = 0;
        const maxRetries = 30;
        const retryDelay = 150;
        
        const updateSource = () => {
          retryCount++;
          const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
          const hasLayers = map.getLayer(glowLayerId) && map.getLayer(mainLayerId);
          
          logDebug(`[updateBusinessMarkers] Attempt ${retryCount}: source=${!!source}, hasLayers=${hasLayers}, features=${featureCollection.features.length}`);
          
          if (source && hasLayers) {
            logDebug(`[updateBusinessMarkers] ✅ Source and layers found! Setting ${featureCollection.features.length} features`);
            if (featureCollection.features.length > 0) {
              logDebug(`[updateBusinessMarkers] First feature coords:`, featureCollection.features[0]?.geometry?.coordinates);
            } else {
              logDebug(`[updateBusinessMarkers] ⚠️ No features to display!`);
            }
            
            try {
              source.setData(featureCollection);
              
              // Ensure all business layers are on top and visible
              const allBusinessLayers = [
                glowLayerId,
                mainLayerId,
                centerLayerId
              ];
              allBusinessLayers.forEach(layerId => {
                const layer = map.getLayer(layerId);
                if (layer) {
                  map.moveLayer(layerId); // Move to top
                  map.setLayoutProperty(layerId, 'visibility', 'visible');
                  logDebug(`[updateBusinessMarkers] Layer ${layerId}: visible=true`);
                }
              });
              
              // Force a repaint
              map.triggerRepaint();
            } catch (err) {
              logError(`[updateBusinessMarkers] Error setting data:`, err);
              if (retryCount < maxRetries) {
                setTimeout(updateSource, retryDelay);
              }
            }
          } else if (retryCount < maxRetries) {
            logDebug(`[updateBusinessMarkers] Source/layers not ready, retry ${retryCount}/${maxRetries}...`);
            setTimeout(updateSource, retryDelay);
          } else {
            logDebug(`[updateBusinessMarkers] FAILED: Source never became ready after ${maxRetries} attempts`);
            // Last resort: trigger a map idle event to force re-render
            map.once('idle', () => {
              logDebug(`[updateBusinessMarkers] Attempting final retry after idle`);
              const finalSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
              if (finalSource) {
                finalSource.setData(featureCollection);
                map.triggerRepaint();
              }
            });
          }
        };
        updateSource();

        // Set up event handlers only once
        if (!businessHandlersSetRef.current) {
          businessHandlersSetRef.current = true;
          
          // Popup for markers - store in ref so it can be removed when navigating away
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: "business-popup",
            maxWidth: "300px",
            anchor: "bottom",
            offset: [0, -10],
          });
          popupRef.current = popup;

          map.on("mouseenter", mainLayerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (!props) return;
            
            const businessId = props.id as string;
            if (hoveredIdRef.current === businessId) return;
            hoveredIdRef.current = businessId;
            
            const coords = (feature.geometry as GeoJSON.Point).coordinates as LngLat;
            map.getCanvas().style.cursor = "pointer";
            const businessName = props.label as string;
            
            // Category badge color
            const badgeColor = categoryColors[props.category as string] || '#0ea5e9';
            
            // PRE-GENERATE HTML string to avoid overhead during hover
            const popupHtml = `
              <div style="color: #fff; font-family: system-ui, -apple-system, sans-serif; min-width: 180px;">
                <div style="display: inline-block; padding: 3px 8px; background: ${badgeColor}20; border: 1px solid ${badgeColor}50; border-radius: 6px; margin-bottom: 8px;">
                  <span style="font-size: 10px; font-weight: 600; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 0.5px;">${props.category}</span>
                </div>
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; line-height: 1.3;">${businessName}</div>
                ${props.phone ? `<div style="font-size: 12px; color: #94a3b8;">${props.phone}</div>` : ''}
              </div>
            `;

            // Show popup immediately - no async fetch to avoid lag
            popup
              .setLngLat(coords)
              .setHTML(popupHtml)
              .addTo(map);
          });

          map.on("mouseleave", mainLayerId, () => {
            hoveredIdRef.current = null;
            map.getCanvas().style.cursor = "";
            popup.remove();
          });

          // Click handler for markers
          map.on("click", mainLayerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (!props || !props.businessData) return;

            try {
              const business = JSON.parse(props.businessData as string) as BusinessPoint;
              setSelectedBusiness(business);
              setExpanded(true);
            } catch (err) {
              logError("Failed to parse business data", err);
            }
          });

          // Selected business layer handlers
          map.on("mouseenter", "selected-business-layer", () => {
            const business = selectedBusinessRef.current;
            if (!business) return;
            map.getCanvas().style.cursor = "pointer";

            popup
              .setLngLat(business.coords)
              .setHTML(`
              <div style="color: #fff; font-family: system-ui, -apple-system, sans-serif;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${business.name}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">${business.category}</div>
                <div style="font-size: 12px; color: #cbd5e1;">${business.phone}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${business.meta}</div>
              </div>
            `)
              .addTo(map);
          });
          map.on("mouseleave", "selected-business-layer", () => {
            map.getCanvas().style.cursor = "";
            popup.remove();
          });
          map.on("click", "selected-business-layer", () => {
            setExpanded(true);
          });
        }
      }
    },
    [fallback],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    // Wait for container to have dimensions
    const checkContainer = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(checkContainer, 100);
        return;
      }
      initializeMap();
    };

    const initializeMap = () => {
      if (!containerRef.current || mapRef.current) return;

      if (!mapboxgl.supported()) {
        logWarn("WebGL not supported");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFallback(true);
        return;
      }

      if (!mapboxgl.accessToken) {
        logWarn("Mapbox token not set. Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
        logWarn("Get a free token at: https://account.mapbox.com/access-tokens/");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFallback(true);
        return;
      }

      try {
        const fit = new mapboxgl.LngLatBounds(regionBounds.sw, regionBounds.ne);
        
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [23.0, -34.0],
          zoom: 9.2,
          pitch: 25,
          bearing: 0,
          maxPitch: 85,
          attributionControl: false,
          cooperativeGestures: true,
          maxBounds: fit,
        });

        // Add error handler for map loading failures
        map.on('error', (e) => {
          logError('Mapbox error:', e);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFallback(true);
        });

        map.once("load", () => {
          // Add terrain source
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });

          // Set terrain with reduced exaggeration to prevent tile loading issues
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

          // Add atmosphere and sky
          map.setFog({
            range: [-1, 15],
            color: "white",
            "horizon-blend": 0.1,
            "high-color": "#245cdf",
            "space-color": "#000000",
            "star-intensity": 0.15
          });

          // Add 3D buildings layer
          map.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#ffffff",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.9,
            },
          });

          map.fitBounds(fit, { padding: 120, duration: 0, pitch: 25, bearing: 0 });
          map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

          // Add pulsing dot image for selected business
          const size = 150;
          const pulsingDot: mapboxgl.StyleImageInterface & { context: CanvasRenderingContext2D | null } = {
            width: size,
            height: size,
            data: new Uint8ClampedArray(size * size * 4),
            context: null,

            onAdd: function () {
              const canvas = document.createElement("canvas");
              canvas.width = this.width;
              canvas.height = this.height;
              this.context = canvas.getContext("2d");
            },

            render: function () {
              const duration = 1500;
              const t = (performance.now() % duration) / duration;

              const radius = (size / 2) * 0.3;
              const outerRadius = (size / 2) * 0.7 * t + radius;
              const context = this.context;

              if (!context) return false;

              // Draw the outer circle.
              context.clearRect(0, 0, this.width, this.height);
              context.beginPath();
              context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
              context.fillStyle = `rgba(19, 54, 86, ${1 - t})`;
              context.fill();

              // Draw the inner circle.
              context.beginPath();
              context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
              context.fillStyle = "#133656";
              context.strokeStyle = "white";
              context.lineWidth = 2 + 4 * (1 - t);
              context.fill();
              context.stroke();

              // Update this image's data with data from the canvas.
              this.data = context.getImageData(0, 0, this.width, this.height).data;

              // Continuously repaint the map
              map.triggerRepaint();

              return true;
            },
          };

          map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

          // Add source for selected business animation
          map.addSource("selected-business", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: "selected-business-layer",
            type: "symbol",
            source: "selected-business",
            layout: {
              "icon-image": "pulsing-dot",
              "icon-allow-overlap": true,
            },
          });

          // Hide place labels for towns not in our list
          const placeLabelLayers = [
            "place-city-lg-n", "place-city-lg-s", "place-city-md-n", "place-city-md-s",
            "place-city-sm", "place-town", "place-village", "place-hamlet"
          ];

          placeLabelLayers.forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, "visibility", "none");
            }
          });

          // Hide all default POI and label layers so only our businesses show
          const style = map.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer) => {
              const id = layer.id.toLowerCase();
              if (
                id.includes("poi") ||
                id.includes("landmark") ||
                id.includes("medical") ||
                id.includes("education") ||
                id.includes("park") ||
                id.includes("label")
              ) {
                if (map.getLayer(layer.id)) {
                  map.setLayoutProperty(layer.id, "visibility", "none");
                }
              }
            });
          }

          // Map is now customized and ready - use idle to ensure everything is painted
          map.once('idle', () => {
            setIsMapLoading(false);
          });

          // Add town markers for clickable towns
          const townMarkers: FeatureCollection<Point, { id: string; name: string }> = {
            type: "FeatureCollection",
            features: zones.map((zone) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: zone.coordinates,
              },
              properties: {
                id: zone.id,
                name: zone.name,
              },
            })),
          };

          map.addSource("town-markers", {
            type: "geojson",
            data: townMarkers,
          });

          // Add town outer glow layer (subtle) - Sky blue theme
          map.addLayer({
            id: "town-markers-pulse",
            type: "circle",
            source: "town-markers",
            paint: {
              "circle-radius": 16,
              "circle-color": "#0ea5e9",
              "circle-opacity": 0.3,
              "circle-blur": 0.8,
            },
          });

          // Add town main marker layer - Sky blue theme
          map.addLayer({
            id: "town-markers-layer",
            type: "circle",
            source: "town-markers",
            paint: {
              "circle-radius": 8,
              "circle-color": "#0ea5e9",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 1,
            },
          });

          // Add town center dot (hidden - no white center)
          map.addLayer({
            id: "town-markers-center",
            type: "circle",
            source: "town-markers",
            paint: {
              "circle-radius": 0,
              "circle-color": "#ffffff",
              "circle-opacity": 0,
            },
          });

          // Add town labels
          map.addLayer({
            id: "town-labels-layer",
            type: "symbol",
            source: "town-markers",
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-size": 14,
              "text-offset": [0, 1.5],
              "text-anchor": "top",
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 2,
              "text-halo-blur": 1,
            },
          });

          // Make town markers clickable
          map.on("click", "town-markers-layer", (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (props && props.id) {
              setActiveZoneId(props.id as string);
            }
          });

          // Change cursor on hover and show tooltip
          let townTooltip: mapboxgl.Popup | null = null;
          
          map.on("mouseenter", "town-markers-layer", (e) => {
            map.getCanvas().style.cursor = "pointer";
            
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            const townId = props?.id as string;
            const townName = props?.name as string;
            const info = townInfo[townId];
            
            if (info && feature.geometry.type === 'Point') {
              const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

              const [primaryImage, secondaryImage] = getTownSpotlightImageUrls(townId, townName);
              const fallbackImage = info.image;

              const imgSrc = primaryImage || fallbackImage;
              const onError = primaryImage
                ? `this.onerror=null;this.src='${secondaryImage || fallbackImage}';this.onerror=function(){this.onerror=null;this.src='${fallbackImage}';};`
                : "";
              
              // Create tooltip HTML with town info
              const tooltipHTML = `
                <div style="
                  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95));
                  border-radius: 16px;
                  overflow: hidden;
                  width: 280px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                  border: 1px solid rgba(255,255,255,0.1);
                ">
                  <img src="${imgSrc}" alt="${townName}" style="width: 100%; height: 100px; object-fit: cover;" ${onError ? `onerror="${onError}"` : ""} />
                  <div style="padding: 12px;">
                    <div style="font-weight: 700; font-size: 16px; color: #fff; margin-bottom: 6px;">${townName}</div>
                    <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 10px;">${info.description}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${info.highlights.map(h => `<span style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; font-size: 10px; padding: 3px 8px; border-radius: 100px; border: 1px solid rgba(14, 165, 233, 0.3);">${h}</span>`).join('')}
                    </div>
                  </div>
                </div>
              `;
              
              townTooltip = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
                className: 'town-tooltip-popup'
              })
                .setLngLat(coordinates)
                .setHTML(tooltipHTML)
                .addTo(map);
            }
          });

          map.on("mouseleave", "town-markers-layer", () => {
            map.getCanvas().style.cursor = "";
            if (townTooltip) {
              townTooltip.remove();
              townTooltip = null;
            }
          });

          // Pre-initialize business-points source WITHOUT clustering - show individual dots
          logDebug('[MAP INIT] Adding business-points source (no clustering)');
          map.addSource("business-points", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Layer 1: White circle base with blue outline
          map.addLayer({
            id: "business-points-main",
            type: "circle",
            source: "business-points",
            paint: {
              "circle-radius": 6,
              "circle-color": "#ffffff",
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#0ea5e9",
              "circle-opacity": 1,
              "circle-pitch-alignment": "viewport",
              "circle-pitch-scale": "viewport",
            },
          });

          // Layer 2: Enhanced glow effect around the white circle
          map.addLayer({
            id: "business-points-glow",
            type: "circle",
            source: "business-points",
            paint: {
              "circle-radius": 14,
              "circle-color": "#ffffff",
              "circle-opacity": 0.4,
              "circle-blur": 1,
              "circle-pitch-alignment": "viewport",
              "circle-pitch-scale": "viewport",
            },
          });

          // Layer 3: Center dot removed - white dots only with blue outline
          map.addLayer({
            id: "business-points-center",
            type: "circle",
            source: "business-points",
            paint: {
              "circle-radius": 0,
              "circle-color": "#0ea5e9",
              "circle-opacity": 0,
              "circle-pitch-alignment": "viewport",
              "circle-pitch-scale": "viewport",
            },
          });

          logDebug('[MAP INIT] ✅ All business layers added (no clustering)');
          logDebug('[MAP INIT] Layers check:', {
            glow: !!map.getLayer('business-points-glow'),
            main: !!map.getLayer('business-points-main'),
            center: !!map.getLayer('business-points-center'),
          });

          // DEBUG: Add a test marker to verify layers work
          const testSource = map.getSource("business-points") as mapboxgl.GeoJSONSource;
          if (testSource) {
            const testData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                geometry: { type: "Point", coordinates: [22.458933, -33.961204] }, // George center
                properties: { id: "test", label: "Test Marker", category: "Test" }
              }]
            };
            testSource.setData(testData);
            logDebug("[Map Init] Test marker added to verify layers");
          }

          // Click on empty area to deselect business and reset to town default
          map.on("click", (e) => {
            // Check if click was on any interactive layer
            const interactiveLayers = [
              "business-points-main",
              "business-points-glow",
              "business-points-center",
              "selected-business-layer",
              "town-markers-layer",
            ];
            const features = map.queryRenderedFeatures(e.point, { layers: interactiveLayers.filter(l => map.getLayer(l)) });
            
            // If no features were clicked, deselect business and reset category
            if (features.length === 0) {
              setSelectedBusiness(null);
              setExpanded(false);
              setSelectedCategory(null);
              // Return to town default view if a town is active
              const currentZoneId = activeZoneIdRef.current;
              if (currentZoneId) {
                const zone = zones.find(z => z.id === currentZoneId);
                if (zone) {
                  map.flyTo({
                    center: zone.coordinates,
                    zoom: 13.5,
                    duration: 800,
                    pitch: 60,
                    bearing: -10,
                  });
                }
              }
            }
          });
        });

        map.on("error", (e) => {
          logError("Mapbox error:", e);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFallback(true);
        });

        mapRef.current = map;
      } catch (error) {
        logError("Mapbox initialization failed:", error);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFallback(true);
      }
    };

    checkContainer();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Reset category and business when town changes
  useEffect(() => {
    if (activeZoneId) {
      // Reset selections when switching towns
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSubcategory(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBusiness(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusinessIndex(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery("");
      // Show spotlight card when zone is selected
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultCardExpanded(true);
    }
  }, [activeZoneId]);

  // fly to location and show markers when town is selected
  useEffect(() => {
    logDebug(`[TOWN SELECT] useEffect triggered - activeZoneId: ${activeZoneId}, fallback: ${fallback}, mapRef: ${!!mapRef.current}`);
    
    // If no map yet or fallback mode, still allow state changes (UI will update)
    if (fallback) {
      logDebug('[TOWN SELECT] Fallback mode - skipping map update');
      return;
    }
    
    // If map isn't ready yet, queue the update for when it is
    if (!mapRef.current) {
      logDebug('[TOWN SELECT] Map not ready yet - skipping');
      return;
    }
    
    const map = mapRef.current;
    logDebug(`[TOWN SELECT] Map ready, isStyleLoaded: ${map.isStyleLoaded()}`);
    
    const doUpdate = () => {
      logDebug(`[TOWN SELECT] doUpdate called for activeZoneId: ${activeZoneId}`);
      // Show/hide town markers based on selection
      const visibility = activeZoneId ? "none" : "visible";
      logDebug(`[TOWN SELECT] Setting town markers visibility to: ${visibility}`);
      const townLayers = [
        "town-markers-layer",
        "town-markers-glow",
        "town-markers-pulse",
        "town-markers-ring",
        "town-markers-center",
        "town-labels-layer"
      ];
      let layersUpdated = 0;
      townLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visibility);
          layersUpdated++;
        }
      });
      logDebug(`[TOWN SELECT] Updated ${layersUpdated}/${townLayers.length} town layers to ${visibility}`);

      if (activeZoneId) {
        const zone = zones.find((z) => z.id === activeZoneId);
        logDebug(`[TOWN SELECT] Zone found: ${zone?.name}, coords: ${zone?.coordinates}`);
        if (zone) {
          // Only zoom to zone if no category is selected (category zoom will handle it)
          if (!selectedCategory && !searchQuery) {
            logDebug(`[TOWN SELECT] Flying to zone: ${zone.name}`);
            map.flyTo({ center: zone.coordinates, zoom: 13.5, duration: 1200, pitch: 60, bearing: -10 });
          }
          // Show business markers immediately - the source should be ready
          logDebug(`[TOWN SELECT] Calling updateBusinessMarkers for ${activeZoneId}`);
          updateBusinessMarkers(activeZoneId, selectedCategory, selectedSubcategory, searchQuery);
          // Also update after flyTo completes to ensure markers are visible
          map.once('moveend', () => {
            logDebug(`[TOWN SELECT] moveend event - updating markers again`);
            updateBusinessMarkers(activeZoneId, selectedCategory, selectedSubcategory, debouncedSearchQuery);
          });
        } else {
          logError(`[TOWN SELECT] Zone not found for id: ${activeZoneId}`);
        }
      } else {
        logDebug('[TOWN SELECT] No activeZoneId - clearing business markers');
        // Show full Garden Route view when no town selected (Tilted slightly)
        const fit = new mapboxgl.LngLatBounds(regionBounds.sw, regionBounds.ne);
        map.fitBounds(fit, { padding: 120, duration: 800, pitch: 25, bearing: 0 });
        // Clear business markers immediately
        const sourceId = "business-points";
        const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          const emptyCollection: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };
          source.setData(emptyCollection);
        }
        // Also clear selected business layer
        const selectedSource = map.getSource("selected-business") as mapboxgl.GeoJSONSource;
        if (selectedSource) {
          selectedSource.setData({ type: "FeatureCollection", features: [] });
        }
      }
    };

    // Run update - use idle event if style reports not loaded (more reliable than style.load)
    // The state change happens immediately, map update follows when ready
    const styleLoaded = map.isStyleLoaded();
    const hasSource = !!map.getSource('town-markers');
    logDebug(`[TOWN SELECT] Checking map ready: styleLoaded=${styleLoaded}, hasSource=${hasSource}`);
    
    if (styleLoaded || hasSource) {
      doUpdate();
    } else {
      logDebug('[TOWN SELECT] Waiting for idle event...');
      map.once('idle', doUpdate);
    }
  }, [activeZoneId, fallback, zones, updateBusinessMarkers, selectedCategory, debouncedSearchQuery]);

  // Update markers and zoom when category or search changes
  useEffect(() => {
    if (activeZoneId && mapRef.current && !fallback) {
      updateBusinessMarkers(activeZoneId, selectedCategory, selectedSubcategory, debouncedSearchQuery);

      // Zoom in on businesses of selected category/subcategory or search results
      if (selectedCategory || selectedSubcategory || debouncedSearchQuery.trim()) {
        const biz = businessPoints[activeZoneId] ?? [];
        let filteredBiz = biz;

        // Filter by subcategory (most specific) or category
        if (selectedSubcategory) {
          filteredBiz = filteredBiz.filter((b) => b.subcategory === selectedSubcategory);
        } else if (selectedCategory) {
          filteredBiz = filteredBiz.filter((b) => b.category === selectedCategory);
        }

        if (debouncedSearchQuery.trim()) {
          filteredBiz = filterBusinessesByQuery(filteredBiz, debouncedSearchQuery);
        }

        if (filteredBiz.length > 0) {
          // Calculate bounds of filtered businesses
          const lngs = filteredBiz.map((b) => b.coords[0]);
          const lats = filteredBiz.map((b) => b.coords[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);

          const bounds = new mapboxgl.LngLatBounds(
            [minLng, minLat],
            [maxLng, maxLat]
          );

          mapRef.current.fitBounds(bounds, {
            padding: 100,
            duration: 1200,
            maxZoom: 15,
            pitch: 60,
            bearing: -10,
          });
        }
      } else {
        // Zoom back to zone center if no category selected
        const zone = zones.find((z) => z.id === activeZoneId);
        if (zone) {
          mapRef.current.flyTo({
            center: zone.coordinates,
            zoom: 13.5,
            duration: 1200,
            pitch: 60,
            bearing: -10,
          });
        }
      }
    }
  }, [selectedCategory, selectedSubcategory, activeZoneId, fallback, zones, updateBusinessMarkers, debouncedSearchQuery]);

  // Zoom to selected business when it changes
  useEffect(() => {
    if (mapRef.current && !fallback) {
      const map = mapRef.current;
      const source = map.getSource("selected-business") as mapboxgl.GeoJSONSource;
      
      // Layer IDs for the business markers (no clustering)
      const businessLayers = [
        "business-points-main",
        "business-points-glow",
        "business-points-center"
      ];

      if (selectedBusiness) {
        // Update pulsing dot position
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: selectedBusiness.coords },
                properties: {},
              },
            ],
          });
        }

        // Hide ALL business markers when one is selected (only show pulsing dot)
        businessLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });

        // Fly to business
        map.flyTo({
          center: selectedBusiness.coords,
          zoom: 17,
          duration: 1200,
          pitch: 60,
          bearing: -10,
        });
      } else {
        // Clear pulsing dot and restore all static markers
        if (source) {
          source.setData({ type: "FeatureCollection", features: [] });
        }
        // Show all business markers again
        businessLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            map.setFilter(layerId, null);
          }
        });
      }
    }
  }, [selectedBusiness, fallback, activeZoneId]);

  const outcome = activeZone
    ? outcomeMap.get(`${activeZone.id}-${category}`) ?? null
    : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-xl">
        <div className="glow-ring left-1/3 top-1/4 h-64 w-64 bg-sky-400/20" />
        <div className="glow-ring right-1/4 top-1/3 h-72 w-72 bg-amber-500/15" />
        <div className="glow-ring left-1/2 top-2/3 h-80 w-80 -translate-x-1/2 bg-violet-500/12" />
      </div>

      {/* Top Right - User Profile */}
      <div 
        className="absolute right-16 top-6 z-[100]" 
        style={{ pointerEvents: 'auto' }}
      >
        <UserAuth />
      </div>

      {/* Loading Overlay - Top Level */}
      <AnimatePresence>
        {isMapLoading && !fallback && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950"
          >
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
            
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/10 border-t-sky-500 animate-spin" />
                <div className="absolute inset-4 rounded-full border-4 border-indigo-500/10 border-b-indigo-500 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-sky-400 fill-sky-400/20 animate-pulse" />
                </div>
              </div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white tracking-tight mb-2"
              >
                Garden Route
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm font-medium tracking-widest uppercase"
              >
                Preparing your map...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Left - Branding & Back Button - HIGHEST z-index to always be clickable */}
      <div 
        className="absolute left-6 top-6 z-[100] flex items-center gap-3" 
        style={{ pointerEvents: 'auto' }}
        onMouseEnter={() => logDebug('[BACK BUTTON] Mouse entered container, activeZoneId:', activeZoneId)}
      >
        <AnimatePresence mode="wait">
          {activeZoneId ? (
            <motion.button
              key="back-button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={(e) => {
                logDebug('[BACK BUTTON] Click event triggered');
                logDebug('[BACK BUTTON] Current activeZoneId:', activeZoneId);
                e.stopPropagation();
                e.preventDefault();
                // Remove any open popup immediately
                if (popupRef.current) {
                  popupRef.current.remove();
                }
                logDebug('[BACK BUTTON] Setting activeZoneId to null');
                setActiveZoneId(null);
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedBusiness(null);
                setSearchQuery("");
                setExpanded(false);
                setDefaultCardExpanded(false);
                // Reset business handlers ref so they can be set up again for next town
                businessHandlersSetRef.current = false;
                logDebug('[BACK BUTTON] All state reset complete');
              }}
              style={{ pointerEvents: 'auto' }}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition border border-white/10 cursor-pointer z-50"
            >
              ← Back to Towns
            </motion.button>
          ) : (
            <motion.div
              key="branding"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-200/80"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.25)]" />
              <span>Spotlight</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Left Side - Intro Story (Only on main overview) */}
      {!activeZoneId && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute left-4 top-[55%] -translate-y-1/2 z-20 max-w-[280px] hidden md:block"
        >
          <div className="rounded-2xl p-6 bg-slate-900/30 backdrop-blur-[2px] border border-white/5">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Skip the Search.<br />
              <span className="text-sky-400">We Did It For You.</span>
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-5">
              No endless scrolling. No generic results. We&apos;ve explored every corner of the Garden Route to handpick only the spots worth your time—from hidden gems to local favourites.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] flex-shrink-0 mt-0.5"></span>
                <span>500+ Curated<br />Businesses</span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></span>
                7 Towns
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Center - Search Bar */}
      {activeZoneId && activeZone && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <div className="relative">
            <div className="glass rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-3 shadow-xl">
              <svg
                className="w-5 h-5 text-white flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelectedCategory(null); // Clear category when searching
                  setSelectedBusiness(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search businesses... (e.g., dog friendly restaurant)"
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 flex-1 min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBusiness(null);
                    setShowSuggestions(false);
                  }}
                  className="text-white hover:text-white/80 transition"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar"
              >
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={`${suggestion.type}-${suggestion.name}-${idx}`}
                    onClick={() => {
                      if (suggestion.type === "category") {
                        setSelectedCategory(suggestion.name);
                        setSearchQuery("");
                        setShowSuggestions(false);
                        // Show first business in that category
                        const categoryBiz = getCategoryBusinesses(activeZoneId, suggestion.name);
                        if (categoryBiz.length > 0) {
                          setSelectedBusiness(categoryBiz[0]);
                          setBusinessIndex(0);
                          setExpanded(true);
                        }
                      } else {
                        // Find and select the business
                        const biz = businessPoints[activeZoneId] ?? [];
                        const business = biz.find(b => b.name === suggestion.name);
                        if (business) {
                          setSelectedBusiness(business);
                          setSearchQuery(business.name);
                          setShowSuggestions(false);
                          setExpanded(true);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center gap-3 border-b border-white/5 last:border-b-0"
                  >
                    <div className={clsx(
                      "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                      suggestion.type === "category"
                        ? "bg-[#133656]/20 border border-[#133656]/30"
                        : "bg-slate-700/50 border border-white/10"
                    )}>
                      {suggestion.type === "category" ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{suggestion.name}</div>
                      {suggestion.type === "business" && suggestion.category && (
                        <div className="text-xs text-white mt-0.5">{suggestion.category}</div>
                      )}
                      {suggestion.type === "category" && (
                        <div className="text-xs text-white mt-0.5">Category</div>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* No results message */}
            {showSuggestions && searchQuery.trim() && searchSuggestions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 px-4 py-3"
              >
                <div className="text-sm text-white">No businesses found matching &quot;{searchQuery}&quot;</div>
                <div className="text-xs text-white mt-1">Try searching for a category like &quot;restaurant&quot; or &quot;hotel&quot;</div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Centered - Town/Category Buttons */}
      <div className="absolute left-1/2 top-[88px] -translate-x-1/2 z-20 w-full px-6 flex justify-center">
        {activeZoneId ? (
          <div className="w-full max-w-4xl flex justify-center">
            <CategoryCarousel
              categories={availableCategories}
              selectedCategory={selectedCategory}
              onCategorySelect={(cat) => {
                setSelectedCategory(cat);
                setSelectedSubcategory(null);
                setSelectedBusiness(null);
                setBusinessIndex(0);
                setExpanded(false);
              }}
              carouselPosition={carouselPositions[0] || 0}
              setCarouselPosition={(pos) => setCarouselPositions({ 0: pos })}
              subcategories={availableSubcategories}
              selectedSubcategory={selectedSubcategory}
              onSubcategorySelect={(subcat) => {
                setSelectedSubcategory(subcat);
                setSelectedBusiness(null);
                setBusinessIndex(0);
                setExpanded(false);
              }}
              subcategoryBusinesses={selectedSubcategory ? getCategoryBusinesses(activeZoneId, selectedCategory, selectedSubcategory) : []}
              selectedBusiness={selectedBusiness}
              onBusinessClick={(biz) => {
                setSelectedBusiness(biz);
                setExpanded(true);
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: biz.coords,
                    zoom: 15.5,
                    duration: 1200,
                    pitch: 60,
                    bearing: -10,
                  });
                }
              }}
              onBack={() => {
                // Go back one level: businesses → subcategories → categories
                if (selectedSubcategory) {
                  setSelectedSubcategory(null);
                  setSelectedBusiness(null);
                  setExpanded(false);
                } else if (selectedCategory) {
                  setSelectedCategory(null);
                  setSelectedBusiness(null);
                  setExpanded(false);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {zones.map((zone) => (
              <TownButton
                key={zone.id}
                zone={zone}
                active={zone.id === activeZoneId}
                onClick={() => setActiveZoneId(zone.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Map/List Toggle - Only show when a town is active */}
      {activeZoneId && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1 rounded-full shadow-lg flex">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                viewMode === 'map' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map
              </span>
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedCategory(null); // Always start list view with "All" categories
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                viewMode === 'list' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </span>
            </button>
          </div>
        </div>
      )}

      {/* LIST VIEW - Shows when list mode is active */}
      {activeZoneId && viewMode === 'list' && (
        <ListView
          activeZoneId={activeZoneId}
          activeZoneName={activeZone?.name || ''}
          availableCategories={availableCategories}
          availableSubcategories={availableSubcategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          businessPoints={businessPoints}
          getCategoryBusinesses={getCategoryBusinesses}
          getPhotoUrl={getPhotoUrl}
          session={session}
          onBusinessClick={(biz) => {
            setSelectedBusiness(biz);
            setExpanded(true);
            setViewMode('map');
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: biz.coords,
                zoom: 15.5,
                duration: 1200,
                pitch: 60,
                bearing: -10,
              });
            }
          }}
        />
      )}

      <div className={`absolute inset-0 z-10 ${viewMode === 'list' && activeZoneId ? 'hidden' : 'block'}`}>
        <div className="relative h-full w-full overflow-hidden">
          <div
            ref={containerRef}
            className={`absolute inset-0 overflow-hidden rounded-[28px] w-full h-full transition-opacity duration-1000 ${isMapLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ minHeight: "100%" }}
          />
          {fallback ? <div className="absolute inset-0 rounded-[28px] map-fallback" /> : null}

          {/* Admin Edit Button - only shows when accessed via editor dashboard */}
          {isEditorMode && activeZoneId && (
            <button
              onClick={() => setShowLiveEditor(!showLiveEditor)}
              className={`absolute left-4 top-4 z-30 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                showLiveEditor
                  ? "bg-violet-500/20 border-violet-400/50 text-violet-300"
                  : "bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              } backdrop-blur-xl`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs font-medium">{showLiveEditor ? "Close Editor" : "Edit"}</span>
            </button>
          )}

          {/* Live Editor Panel - only shows when accessed via editor dashboard */}
          {isEditorMode && (
            <LiveEditor
              isOpen={showLiveEditor}
              onClose={() => setShowLiveEditor(false)}
              activeZoneId={activeZoneId}
              activeZoneName={activeZone?.name || ""}
              spotlights={activeZoneId ? (localSpotlights[activeZoneId] || []).map((s, i) => ({ ...s, id: `spotlight-${activeZoneId}-${i}` })) : []}
              businesses={activeZoneId ? (businessPoints[activeZoneId] || []).map((b, i) => ({ ...b, id: `${activeZoneId}-${i}` })) : []}
              onUpdateSpotlights={(newSpotlights) => {
                if (activeZoneId) {
                  setLocalSpotlights(prev => ({ ...prev, [activeZoneId]: newSpotlights }));
                }
              }}
              onUpdateBusinesses={() => {}}
              onSelectBusiness={(business) => {
                setSelectedBusiness(business as BusinessPoint);
                setExpanded(true);
              }}
            />
          )}

          <motion.div
            className="pointer-events-none absolute right-4 bottom-4 z-20 w-full max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <AnimatePresence mode="wait">
              {selectedBusiness && activeZone ? (
                <BusinessCard
                  key="business"
                  business={selectedBusiness}
                  zone={activeZone}
                  expanded={expanded}
                  onToggle={() => setExpanded(!expanded)}
                />
              ) : activeZone && defaultCardExpanded ? (
                <Spotlight
                  key="spotlight"
                  zone={activeZone}
                  onClose={() => setDefaultCardExpanded(false)}
                  onBusinessSelect={(business: BusinessPoint) => {
                    setSelectedBusiness(business);
                    setBusinessIndex(0);
                    setExpanded(true);
                  }}
                />
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AttentionMap;
