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
import CategoryDisplay from "./CategoryDisplay";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type LngLat = [number, number];

type Props = {
  zones: ZoneState[];
  defaults: DefaultOutcome[];
  displayTime: string;
};

type BusinessPoint = {
  category: string;
  name: string;
  phone: string;
  meta: string;
  coords: LngLat;
  aiContent?: string; // Pre-generated AI content
};

const lockBadge = (lock: DefaultOutcome["lock"]) =>
  lock === "locked" ? "default locked" : "default rotating";


// This Week's Spotlight businesses for each town
const townSpotlights: Record<string, BusinessPoint[]> = {
  george: [
    { category: "Stay", name: "Protea Hotel King George", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] },
    { category: "Car Hire", name: "Avis George Airport", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] },
    { category: "Eat", name: "The Fat Fish George", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] },
  ],
  wilderness: [
    { category: "Stay", name: "The Wilderness Hotel", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] },
    { category: "Eat", name: "Mujo Bar & Restaurant", phone: "044 889 5000", meta: "12:00-22:00", coords: [22.4359, -33.9715] },
    { category: "Coffee", name: "Bootlegger Coffee Company", phone: "044 004 0231", meta: "06:30-18:00", coords: [22.4537, -33.9610] },
  ],
  knysna: [
    { category: "Stay", name: "Oubaai Hotel", phone: "044 851 1234", meta: "oubaaihotel.co.za", coords: [22.3985, -34.0252] },
    { category: "Eat", name: "101 Meade", phone: "044 874 0343", meta: "08:00-22:00", coords: [22.4548, -33.9623] },
    { category: "Dental", name: "York Street Dental", phone: "044 873 0005", meta: "08:00-17:00", coords: [22.4560, -33.9641] },
  ],
  plett: [
    { category: "Stay", name: "Beacon Island Resort", phone: "044 533 1120", meta: "24/7", coords: [23.3712, -34.0534] },
    { category: "Coffee", name: "The Foundry Roasters", phone: "044 873 3444", meta: "07:00-16:30", coords: [22.4545, -33.9578] },
    { category: "Kids", name: "George Little Stars", phone: "044 874 1140", meta: "07:00-17:30", coords: [22.4578, -33.9591] },
  ],
  mossel: [
    { category: "Dental", name: "Garden Route Dental Studio", phone: "044 873 4964", meta: "08:00-17:00", coords: [22.4532, -33.9605] },
    { category: "Optometrist", name: "George Optometrist", phone: "044 873 3444", meta: "08:30-17:30", coords: [22.4545, -33.9578] },
    { category: "Spa", name: "George Spa & Wellness", phone: "044 873 2220", meta: "09:00-18:00", coords: [22.4589, -33.9645] },
  ],
  sedgefield: [
    { category: "Optometrist", name: "Spec-Savers George", phone: "044 874 5999", meta: "specsavers.co.za", coords: [22.4567, -33.9618] },
    { category: "Kids", name: "Playways Pre-Primary", phone: "044 873 3123", meta: "07:00-17:30", coords: [22.4538, -33.9559] },
    { category: "Spa", name: "Fancourt Spa", phone: "044 804 0198", meta: "fancourt.com/spa", coords: [22.4157, -33.9593] },
  ],
  oudtshoorn: [
    { category: "Car Hire", name: "Budget Car Rental George", phone: "044 876 9200", meta: "budget.co.za", coords: [22.3788, -34.0005] },
    { category: "Optometrist", name: "Torga Optical George", phone: "044 873 2550", meta: "torgaoptical.co.za", coords: [22.4540, -33.9599] },
    { category: "Kids", name: "Little Ambassadors", phone: "044 873 5555", meta: "07:00-17:30", coords: [22.4595, -33.9627] },
  ],
};

// Real business coordinates provided
const businessPoints: Record<string, BusinessPoint[]> = {
  george: [
    { category: "Stay", name: "Protea Hotel King George", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] },
    { category: "Car Hire", name: "Avis George Airport", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] },
    { category: "Car Hire", name: "Hertz George", phone: "044 876 9314", meta: "07:00-19:00", coords: [22.3820, -34.0015] },
    { category: "Car Hire", name: "Europcar George", phone: "044 876 9314", meta: "06:00-22:00", coords: [22.3835, -34.0028] },
    { category: "Eat", name: "The Fat Fish George", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] },
    { category: "Coffee", name: "The Foundry Roasters", phone: "044 873 3444", meta: "07:00-16:30", coords: [22.4545, -33.9578] },
    { category: "Dental", name: "George Dental Care", phone: "044 874 4455", meta: "08:00-17:00", coords: [22.4589, -33.9612] },
    { category: "Optometrist", name: "George Optometrist", phone: "044 873 3444", meta: "08:30-17:30", coords: [22.4545, -33.9578] },
    { category: "Kids", name: "George Little Stars", phone: "044 874 1140", meta: "07:00-17:30", coords: [22.4578, -33.9591] },
    { category: "Spa", name: "George Spa & Wellness", phone: "044 873 2220", meta: "09:00-18:00", coords: [22.4589, -33.9645] },
    { category: "Blinds", name: "George Blinds & Curtains", phone: "082 554 9112", meta: "georgeblinds.co.za", coords: [22.4912, -33.9841] },
    { category: "Blinds", name: "Classic Blinds George", phone: "044 874 1234", meta: "classicblinds.co.za", coords: [22.4560, -33.9585] },
    { category: "Blinds", name: "Modern Window Coverings", phone: "044 874 5678", meta: "modernwindows.co.za", coords: [22.4575, -33.9598] },
    { category: "Waste", name: "George Waste Management", phone: "044 801 9111", meta: "Municipal & Private", coords: [22.4597, -33.9587] },
    { category: "Storage", name: "George Storage Solutions", phone: "044 874 4117", meta: "georgestorage.co.za", coords: [22.4912, -33.9841] },
    { category: "estate", name: "George Estate Agents", phone: "044 874 2000", meta: "properties for sale", coords: [22.4550, -33.9600] },
    { category: "accommodation", name: "George Guest House", phone: "044 874 3000", meta: "luxury rooms", coords: [22.4560, -33.9610] },
    { category: "service", name: "George Handyman Services", phone: "044 874 4000", meta: "repairs & maintenance", coords: [22.4570, -33.9620] },
    { category: "test", name: "Test Company Ltd", phone: "044 123 4567", meta: "testcompany.co.za", coords: [22.4600, -33.9600] },
  ],
  wilderness: [
    { category: "Stay", name: "The Wilderness Hotel", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] },
    { category: "Car Hire", name: "Garden Route Shuttles", phone: "082 494 5433", meta: "24/7 bookings", coords: [22.5768, -33.9921] },
    { category: "Eat", name: "Salina's Beach Restaurant", phone: "044 877 0001", meta: "09:00-21:00", coords: [22.5743, -33.9956] },
    { category: "Coffee", name: "Wilderness Cafe", phone: "044 877 0550", meta: "08:00-17:00", coords: [22.5769, -33.9912] },
    { category: "Dental", name: "Wilderness Dental", phone: "044 877 0466", meta: "08:00-16:00", coords: [22.5772, -33.9934] },
    { category: "Optometrist", name: "Wilderness Eye Care", phone: "082 342 6673", meta: "09:00-17:00", coords: [22.5769, -33.9912] },
    { category: "Kids", name: "Wilderness Kids Academy", phone: "083 454 1109", meta: "07:30-17:00", coords: [22.5784, -33.9928] },
    { category: "Interiors", name: "Wilderness Interiors", phone: "082 453 1109", meta: "wildinteriors@mweb.co.za", coords: [22.5768, -33.9921] },
    { category: "Tours", name: "Wilderness Tours", phone: "082 494 5433", meta: "08:00-18:00", coords: [22.5743, -33.9956] },
    { category: "Waste", name: "Wilderness Waste Services", phone: "044 877 1316", meta: "Refuse & Garden", coords: [22.5756, -33.9915] },
    { category: "Storage", name: "Wilderness Self Storage", phone: "082 896 5520", meta: "Secure Units", coords: [22.5801, -33.9941] },
    { category: "test", name: "Wilderness Test Labs", phone: "044 877 9999", meta: "wildernesstests.co.za", coords: [22.5770, -33.9920] },
  ],
  sedgefield: [
    { category: "Stay", name: "Sedgefield Arms", phone: "044 343 1417", meta: "07:00-22:00", coords: [22.8034, -34.0178] },
    { category: "Car Hire", name: "Eden Shuttles", phone: "083 454 1109", meta: "08:00-18:00", coords: [22.8012, -34.0165] },
    { category: "Eat", name: "Sedgefield Deli", phone: "044 343 1417", meta: "08:00-17:00", coords: [22.8034, -34.0178] },
    { category: "Coffee", name: "Sedgefield Coffee Hub", phone: "044 343 2110", meta: "07:30-16:00", coords: [22.8021, -34.0189] },
    { category: "Dental", name: "Sedgefield Dental", phone: "044 343 1117", meta: "08:00-16:30", coords: [22.8034, -34.0178] },
    { category: "Optometrist", name: "Sedgefield Optometry", phone: "044 343 1628", meta: "08:30-17:00", coords: [22.8032, -34.0189] },
    { category: "Interiors", name: "Sedgefield Tiles & Floors", phone: "044 343 1321", meta: "tiles & floors", coords: [22.8012, -34.0165] },
    { category: "Kids", name: "Sedgefield Early Learning", phone: "044 343 2110", meta: "07:00-17:00", coords: [22.8021, -34.0189] },
    { category: "Craft", name: "Sedgefield Craft Shop", phone: "044 343 1417", meta: "09:00-16:00", coords: [22.8034, -34.0178] },
    { category: "Waste", name: "Sedgefield Waste Removal", phone: "044 343 1321", meta: "Skip Hire", coords: [22.8012, -34.0165] },
    { category: "Storage", name: "Sedgefield Storage Units", phone: "044 343 1117", meta: "CBD Lockers", coords: [22.8056, -34.0201] },
  ],
  knysna: [
    { category: "Stay", name: "The Lofts Boutique Hotel", phone: "044 302 5710", meta: "24/7", coords: [23.0498, -34.0394] },
    { category: "Car Hire", name: "First Car Rental", phone: "044 382 1083", meta: "08:00-17:00", coords: [23.0465, -34.0356] },
    { category: "Eat", name: "34 South Knysna", phone: "044 382 7331", meta: "08:30-21:30", coords: [23.0443, -34.0412] },
    { category: "Coffee", name: "Cafe Neo Knysna", phone: "044 382 0454", meta: "08:00-17:00", coords: [23.0465, -34.0356] },
    { category: "Dental", name: "Knysna Dental Practice", phone: "044 382 1149", meta: "08:00-17:00", coords: [23.0498, -34.0394] },
    { category: "Optometrist", name: "Knysna Optometrists", phone: "044 382 0454", meta: "08:30-17:30", coords: [23.0465, -34.0356] },
    { category: "Kids", name: "Knysna Kids Academy", phone: "044 302 5710", meta: "07:30-17:30", coords: [23.0645, -34.0487] },
    { category: "Kitchen", name: "Knysna Kitchen & Bath", phone: "044 382 5589", meta: "knysnakitchen.co.za", coords: [23.0512, -34.0412] },
    { category: "Blinds", name: "Knysna Window Treatments", phone: "044 382 1038", meta: "knysnablinds@cx.co.za", coords: [23.0489, -34.0378] },
    { category: "Tours", name: "Knysna Lagoon Tours", phone: "044 382 7331", meta: "08:00-17:00", coords: [23.0443, -34.0412] },
    { category: "Waste", name: "Knysna Rubbish Removal", phone: "044 382 5919", meta: "Private Collection", coords: [23.0612, -34.0456] },
    { category: "Storage", name: "Knysna Storage Solutions", phone: "044 302 4700", meta: "knysnastorage.co.za", coords: [23.0612, -34.0456] },
    { category: "test", name: "Knysna Test Centre", phone: "044 382 9999", meta: "knysnatest.co.za", coords: [23.0478, -34.0389] },
  ],
  plett: [
    { category: "Stay", name: "Beacon Island Resort", phone: "044 533 1120", meta: "24/7", coords: [23.3712, -34.0534] },
    { category: "Car Hire", name: "Woodford Car Hire", phone: "044 533 0215", meta: "08:00-17:00", coords: [23.3698, -34.0528] },
    { category: "Eat", name: "The Lookout Deck", phone: "044 533 1379", meta: "09:00-22:00", coords: [23.3612, -34.0512] },
    { category: "Coffee", name: "Bean There Plett", phone: "044 533 1140", meta: "07:00-16:00", coords: [23.3712, -34.0534] },
    { category: "Dental", name: "Plett Dental Studio", phone: "044 533 0836", meta: "08:00-17:00", coords: [23.3612, -34.0512] },
    { category: "Optometrist", name: "Plett Vision Centre", phone: "044 533 1140", meta: "08:30-17:00", coords: [23.3712, -34.0534] },
    { category: "Kids", name: "Plett Little Ones", phone: "044 533 1120", meta: "07:00-17:00", coords: [23.3712, -34.0534] },
    { category: "Kitchen", name: "Plett Kitchen Services", phone: "044 533 6740", meta: "plettkitchens@mweb.co.za", coords: [23.3689, -34.0567] },
    { category: "Blinds", name: "Plett Blinds & Curtains", phone: "044 533 1944", meta: "plettblinds.co.za", coords: [23.3698, -34.0528] },
    { category: "Tours", name: "Plett Adventure Tours", phone: "044 533 1379", meta: "08:00-17:00", coords: [23.3789, -34.0612] },
    { category: "Waste", name: "Plett Waste Solutions", phone: "044 533 2103", meta: "Eco Waste Mgmt", coords: [23.3743, -34.0589] },
    { category: "Storage", name: "Plett Self Storage", phone: "044 533 3371", meta: "plettstorage.co.za", coords: [23.3612, -34.0512] },
  ],
  mossel: [
    { category: "Stay", name: "Protea Hotel Mossel Bay", phone: "044 691 3738", meta: "24/7", coords: [22.1445, -34.1812] },
    { category: "Car Hire", name: "Bidvest Car Rental", phone: "044 695 2404", meta: "08:00-17:00", coords: [22.1189, -34.1712] },
    { category: "Eat", name: "Cafe Gannet", phone: "044 691 1885", meta: "07:00-22:00", coords: [22.1456, -34.1812] },
    { category: "Coffee", name: "Bay Coffee Co", phone: "044 695 0880", meta: "08:00-17:00", coords: [22.1189, -34.1712] },
    { category: "Dental", name: "Bay Dental Clinic", phone: "044 691 3724", meta: "08:00-17:00", coords: [22.1445, -34.1812] },
    { category: "Optometrist", name: "Bay Eye Care", phone: "044 695 0880", meta: "08:30-17:30", coords: [22.1189, -34.1712] },
    { category: "Kids", name: "Bay Children's Centre", phone: "044 691 3738", meta: "07:00-17:30", coords: [22.1412, -34.1801] },
    { category: "Kitchen", name: "Mossel Bay Kitchens", phone: "044 691 3111", meta: "mbkitchens@gmail.com", coords: [22.1012, -34.1645] },
    { category: "Flooring", name: "Mossel Bay Flooring", phone: "044 690 6715", meta: "mbflooring.co.za", coords: [22.1089, -34.1512] },
    { category: "Tours", name: "Mossel Bay Tours", phone: "044 691 1885", meta: "08:00-18:00", coords: [22.1456, -34.1812] },
    { category: "Waste", name: "Mossel Bay Waste Services", phone: "044 691 1133", meta: "Industrial Refuse", coords: [22.1012, -34.1567] },
    { category: "Storage", name: "Mossel Bay Storage", phone: "044 601 2240", meta: "mbstorage.co.za", coords: [22.1012, -34.1567] },
  ],
  oudtshoorn: [
    { category: "Stay", name: "Buffelsdrift Game Lodge", phone: "044 272 0000", meta: "24/7", coords: [22.2034, -33.5912] },
    { category: "Car Hire", name: "Klein Karoo Car Hire", phone: "044 272 0288", meta: "08:00-17:00", coords: [22.2034, -33.5912] },
    { category: "Eat", name: "Buffelsdrift Restaurant", phone: "044 272 0000", meta: "07:00-21:00", coords: [22.2034, -33.5912] },
    { category: "Coffee", name: "Oudtshoorn Coffee House", phone: "044 272 0111", meta: "07:30-17:00", coords: [22.2034, -33.5912] },
    { category: "Dental", name: "Oudtshoorn Dental Care", phone: "044 272 0111", meta: "08:00-17:00", coords: [22.2034, -33.5912] },
    { category: "Optometrist", name: "Oudtshoorn Optometrists", phone: "044 272 6023", meta: "08:30-17:00", coords: [22.2032, -33.5891] },
    { category: "Kids", name: "Oudtshoorn Kids Academy", phone: "044 272 0000", meta: "07:30-17:00", coords: [22.2034, -33.5912] },
    { category: "Kitchen", name: "Oudtshoorn Kitchens", phone: "044 272 5622", meta: "oudtkitchens.co.za", coords: [22.2089, -33.5945] },
    { category: "Blinds", name: "Oudtshoorn Blinds", phone: "071 411 5098", meta: "oudtblinds@gmail.com", coords: [22.2089, -33.5912] },
    { category: "Spa", name: "Buffelsdrift Spa", phone: "044 272 0000", meta: "09:00-18:00", coords: [22.2167, -33.4834] },
    { category: "Waste", name: "Oudtshoorn Waste", phone: "044 272 4115", meta: "Municipal", coords: [22.2089, -33.5956] },
    { category: "Storage", name: "Oudtshoorn Storage Units", phone: "044 272 2241", meta: "Klein Karoo Storage", coords: [22.2089, -33.5912] },
  ],
};

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

const BusinessCard = ({
  business,
  zone,
  expanded,
  onToggle,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: {
  business: BusinessPoint | null;
  zone: ZoneState | null;
  expanded: boolean;
  onToggle: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}) => {
  // Use pre-generated AI content from business data
  const aiContent = business?.aiContent || null;

  if (!business || !zone) return null;

  const [lng, lat] = business.coords;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Generate business-specific URL
  const generateBusinessUrl = (business: BusinessPoint, zoneId: string) => {
    const businessSlug = `${zoneId}-${business.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-\s]/g, "").trim()}`;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://garden-route-defaults.vercel.app";
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
  
  // Function to get blog slug for business
  const getBusinessBlogSlug = (businessName: string): string | null => {
    const blogMappings: Record<string, string> = {
      "Protea Hotel King George": "protea-hotel-king-george-default",
      "Avis George Airport": "avis-george-airport-default",
      "The Fat Fish George": "fat-fish-george-default",
      "The Wilderness Hotel": "wilderness-hotel-default",
      "Beacon Island Resort": "beacon-island-default",
      "The Foundry Roasters": "foundry-roasters-george-default",
      "George Dental Care": "george-dental-care-default"
    };
    return blogMappings[businessName] || null;
  };

  const handleShare = async (platform: "facebook" | "twitter" | "linkedin" | "whatsapp" | "copy" | "native") => {
    // Track share action
    try {
      await fetch('/api/metrics/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name,
          action: 'share'
        })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }

    try {
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
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(fullShareText);
          // Simple feedback
          const notification = document.createElement('div');
          notification.textContent = 'Link copied to clipboard!';
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
          setTimeout(() => document.body.removeChild(notification), 3000);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = fullShareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copied to clipboard!');
        }
      } else if (platform === "native" && navigator.share) {
        try {
          await navigator.share({
            title: `${business.name} - Garden Route Business`,
            text: shareText,
            url: businessUrl,
          });
        } catch (err) {
          const error = err as Error;
          if (error.name !== 'AbortError') {
            console.error("Native share failed:", error.message);
            // Fallback to copy
            handleShare("copy");
          }
        }
      }
    } catch (error) {
      console.error(`Share failed for ${platform}:`, error);
      // Fallback to copy link
      handleShare("copy");
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
                      console.error('Failed to track website:', error);
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

  // Extract first paragraph from AI content
  const aiPreview = aiContent
    ? aiContent.split("\n\n")[0]?.substring(0, 200) + "..."
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }
      }}
      exit={{ 
        opacity: 0, 
        y: 8, 
        scale: 0.96,
        transition: {
          duration: 0.2,
          ease: [0.4, 0, 1, 1],
        }
      }}
      className="glass rounded-2xl border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-xl pointer-events-auto w-full max-w-sm overflow-hidden relative group"
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navigation Arrows - Show on hover */}
      {canGoPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 glass rounded-full p-2 hover:bg-white/20 transition opacity-0 group-hover:opacity-100 pointer-events-auto"
          aria-label="Previous business"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canGoNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 glass rounded-full p-2 hover:bg-white/20 transition opacity-0 group-hover:opacity-100 pointer-events-auto"
          aria-label="Next business"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {/* Header - Fixed */}
      <div className="p-4 border-b border-white/20 bg-slate-900/98">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-block px-2 py-0.5 rounded bg-[#133656]/20 border border-[#133656]/30">
                <p className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold">
                  {business.category}
                </p>
              </div>
              <span className="text-xs text-slate-300 font-medium">
                • {zone?.name}
              </span>
            </div>
            <Link
              href={businessUrl}
              className="text-lg font-bold text-white leading-tight hover:text-[#133656] transition-colors block"
              onClick={(e) => e.stopPropagation()}
            >
              {business.name}
            </Link>
          </div>
          <div className="flex items-start gap-1.5 flex-shrink-0">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-[#133656]/20 hover:bg-[#133656]/30 border border-[#133656]/30 transition pointer-events-auto flex items-center gap-1.5"
              onClick={async (e) => {
                e.stopPropagation();
                // Track directions click
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
                  console.error('Failed to track directions:', error);
                }
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="glass rounded-lg p-1.5 hover:bg-white/10 transition pointer-events-auto"
              aria-label={expanded ? "Minimize" : "Expand"}
            >
              <svg
                className="w-4 h-4 text-white"
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
              y: -5,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 500,
                  damping: 40,
                },
                opacity: { duration: 0.15 },
                y: { duration: 0.2 },
              }
            }}
            className="overflow-hidden"
          >
            <div className="overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: "40vh" }}>
              <div className="space-y-4">
                {/* About Section */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">About</h3>
                  {aiPreview ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-white leading-relaxed bg-slate-800/90 p-2.5 rounded border border-white/20 shadow-inner">{aiPreview}</p>
                      <p className="text-[10px] text-sky-300 font-medium">
                        Full story available →
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-white leading-relaxed bg-slate-800/90 p-2.5 rounded border border-white/20 shadow-inner">
                        Located in {zone.name}, <span className="text-sky-300 font-semibold">{business.name}</span> is a premier {business.category.toLowerCase()} 
                        establishment serving the Garden Route community. With a commitment to excellence and customer satisfaction, 
                        they provide top-quality services tailored to meet the needs of both locals and visitors.
                      </p>
                    </div>
                  )}
                </div>

                {/* Services Section */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Services</h3>
                  <div className="space-y-1.5">
                    {[
                      `Full range of ${business.category.toLowerCase()} services`,
                      "Professional consultation and support",
                      "Local expertise in the Garden Route region",
                      "Customer-focused approach",
                    ].map((service, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-slate-800/90 border border-white/20 shadow-inner">
                        <div className="mt-1 h-1 w-1 rounded-full bg-sky-400 flex-shrink-0"></div>
                        <span className="text-xs text-white leading-relaxed font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location & Contact */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Contact</h3>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-800/90 border border-white/20 shadow-inner">
                      <p className="text-xs font-bold text-white mb-0.5">{zone.name}</p>
                      <p className="text-[10px] text-slate-200">Garden Route, Western Cape, South Africa</p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-800/90 border border-white/20 shadow-inner">
                      <a
                        href={`tel:${business.phone.replace(/\s+/g, "")}`}
                        className="text-xs font-bold text-sky-300 hover:text-sky-200 transition block pointer-events-auto whitespace-nowrap"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Track call click
                          try {
                            await fetch('/api/metrics/business', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                businessName: business.name,
                                action: 'call'
                              })
                            });
                          } catch (error) {
                            console.error('Failed to track call:', error);
                          }
                        }}
                      >
                        {business.phone}
                      </a>
                      <p className="text-[10px] text-slate-200 mt-0.5">Call for inquiries</p>
                    </div>
                    {business.meta && (
                      <div className="p-2.5 rounded bg-slate-800/90 border border-white/20 shadow-inner">
                        {renderMeta(business.meta)}
                        {business.meta && /\d{1,2}:\d{2}/.test(business.meta) && (
                          <p className="text-[10px] text-slate-200 mt-0.5">Operating hours</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

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
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.766-1.653-2.063-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.072 1.758-.234 2.008-.463.25-.229.25-.462.175-.612-.075-.15-.277-.24-.574-.389zM12.008 21c-1.649 0-3.259-.441-4.677-1.272l-3.357.88 1.02-3.147c-.917-1.413-1.4-3.062-1.4-4.753 0-4.803 3.907-8.71 8.711-8.71 2.328 0 4.515.906 6.16 2.554a8.657 8.657 0 0 1 2.554 6.156c-.001 4.804-3.91 8.71-8.714 8.71zM20.52 3.449C18.248 1.203 15.232 0 12.007 0 5.462 0 .14 5.323.137 11.87c0 2.092.547 4.135 1.588 5.945L0 24l6.335-1.662c1.747.953 3.71 1.456 5.704 1.456h.006c6.544 0 11.869-5.324 11.873-11.87 0-3.172-1.234-6.155-3.472-8.401z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("facebook"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-[#133656]/20 hover:border-[#133656]/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Share on Facebook"
                    >
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.37-4.669 1.235 0 2.528.22 2.528.22V7.78h-1.428c-1.49 0-1.95.925-1.95 1.874v2.251h3.144l-.502 3.47h-2.642V24c5.737-.9 10.125-5.864 10.125-11.927z"/>
                      </svg>
                      Facebook
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("twitter"); }}
                      className="glass rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-[#133656]/20 hover:border-[#133656]/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="Share on Twitter"
                    >
                      <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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

                  {/* Native share for mobile */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare("native"); }}
                      className="glass w-full mt-2 rounded-lg px-3 py-2.5 text-[11px] font-medium text-white hover:bg-slate-500/20 hover:border-slate-400/40 border border-white/10 transition-all flex items-center justify-center gap-2 pointer-events-auto"
                      title="More sharing options"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      More Options
                    </button>
                  )}
                </div>

                {/* Social Links Original */}
                <div>
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Connect</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass rounded-lg px-2 py-2 text-[10px] font-medium text-white hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Maps
                    </a>
                    <a
                      href={facebookShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass rounded-lg px-2 py-2 text-[10px] font-medium text-white hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Facebook
                    </a>
                    <a
                      href={twitterShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass rounded-lg px-2 py-2 text-[10px] font-medium text-white hover:bg-white/10 hover:border-sky-400/40 border border-white/10 transition-all text-center pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Twitter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Fixed */}
      {expanded && (
        <div className="p-4 pt-3 border-t border-white/20 bg-slate-900/98 space-y-2">
          {/* Blog Details Link */}
          {(() => {
            const blogSlug = getBusinessBlogSlug(business.name);
            return blogSlug ? (
          <Link
                href={`/blogs/${blogSlug}`}
                className="glass inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 w-full text-xs font-bold text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 transition pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
                <span>View More Details</span>
          </Link>
            ) : (
              <div className="glass inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 w-full text-xs font-bold text-slate-400 bg-slate-500/20 border border-slate-400/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Details Coming Soon</span>
              </div>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
};

// CategoryDisplay imported directly above

const OverlayCard = ({
  zone,
  outcome,
  category,
  setCategory,
  displayTime,
  expanded,
  onToggle,
  onBusinessSelect,
  availableCategories,
  carouselPositions,
  setCarouselPositions,
}: {
  zone: ZoneState;
  outcome: DefaultOutcome;
  category: Category;
  setCategory: (category: Category) => void;
  displayTime: string;
  expanded: boolean;
  onToggle: () => void;
  onBusinessSelect?: (business: BusinessPoint) => void;
  availableCategories: string[];
  carouselPositions: Record<number, number>;
  setCarouselPositions: (positions: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.96 }}
    animate={{ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }
    }}
    exit={{ 
      opacity: 0, 
      y: 8, 
      scale: 0.96,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1],
      }
    }}
    className="rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl pointer-events-auto w-full max-w-sm overflow-hidden relative p-5"
    style={{ display: "flex", flexDirection: "column", maxHeight: expanded ? "65vh" : "auto" }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-xs uppercase tracking-[0.22em] text-white">
          Garden Route Defaults
        </p>
        <p className="text-lg font-bold text-white">{zone.name}</p>
        {expanded && <p className="text-xs text-white">{zone.narrative}</p>}
      </div>
      <div className="flex items-start gap-2 flex-shrink-0">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-right text-xs text-white overflow-hidden"
            >
              <div className="text-white font-medium">{displayTime}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggle && typeof onToggle === "function") {
              onToggle();
            }
          }}
          className="glass rounded-lg p-2 hover:bg-white/10 transition pointer-events-auto"
          aria-label={expanded ? "Minimize" : "Expand"}
        >
          <svg
            className="w-5 h-5 text-white"
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

    <AnimatePresence initial={false} mode="wait">
      {expanded ? (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
      <CategoryDisplay
        availableCategories={availableCategories}
        category={category}
        setCategory={setCategory}
        carouselPositions={carouselPositions}
        setCarouselPositions={setCarouselPositions}
      />

    {/* This Week's Spotlight Section - MAIN FEATURE */}
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
        <h3 className="text-lg font-bold text-white bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
          ⭐ This Week's Spotlight
        </h3>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3 mb-3 border border-yellow-500/20">
        <p className="text-xs text-yellow-200/90 leading-relaxed">
          Discover our carefully curated selection of the best businesses in {zone.name} this week.
          These spotlight features represent excellence and reliability in their categories.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {townSpotlights[zone.id]?.map((business, index) => (
          <motion.div
            key={business.name}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                delay: index * 0.15,
                duration: 0.4,
                type: "spring",
                stiffness: 300
              }
            }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            {/* Spotlight badge */}
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                ⭐ SPOTLIGHT
              </div>
            </div>

            <button
              onClick={() => {
                if (onBusinessSelect) {
                  onBusinessSelect(business);
                }
              }}
              className="w-full glass rounded-xl p-4 text-left hover:bg-gradient-to-r hover:from-white/15 hover:to-yellow-500/10 transition-all duration-300 border border-white/20 hover:border-yellow-400/50 shadow-lg hover:shadow-yellow-500/20 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <div>
                      <div className="font-bold text-white text-base group-hover:text-yellow-200 transition-colors">{business.name}</div>
                      <div className="text-sm text-white font-medium">{business.category}</div>
                    </div>
                  </div>

                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sky-400 font-medium whitespace-nowrap">{business.phone}</span>
                    </div>
                  )}
                </div>

                <div className="ml-3 flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#133656] to-[#0f2a3d] rounded-lg flex items-center justify-center group-hover:from-yellow-400 group-hover:to-orange-500 transition-all duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )) || (
          <div className="text-sm text-white text-center py-4 bg-slate-800/50 rounded-lg">
            No spotlight businesses available this week
          </div>
        )}
      </div>
    </div>

          <div className="mt-5 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-white">
        When attention converts here, this is who captures it by default.
      </p>
      <div className="flex items-center gap-3">
        <div
          className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-xl border border-white/20",
                  outcome.lock === "locked" ? "bg-sky-500/30" : "bg-amber-500/30",
          )}
        >
                <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.3)]" />
        </div>
        <div>
                <div className="text-xl font-bold leading-tight text-white">
            {outcome.winner.name}
          </div>
                <div className="text-xs uppercase tracking-[0.18em] text-white">
            {lockBadge(outcome.lock)}
          </div>
        </div>
      </div>
            <p className="text-xs text-white">{outcome.rationale}</p>
    </div>
  </motion.div>
      ) : (
    <motion.div
          key="collapsed"
          initial={{ opacity: 0, height: 0, y: -5 }}
      animate={{
            opacity: 1, 
            height: "auto",
            y: 0,
            transition: {
              height: {
                type: "spring",
                stiffness: 400,
                damping: 35,
              },
              opacity: { duration: 0.2 },
              y: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }
          }}
          exit={{ 
            opacity: 0, 
            height: 0,
            y: -5,
            transition: {
              height: {
                type: "spring",
                stiffness: 500,
                damping: 40,
              },
              opacity: { duration: 0.15 },
              y: { duration: 0.15 },
            }
          }}
          className="overflow-hidden"
        >
          <div className="mt-3 flex items-center gap-3">
      <div
        className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 flex-shrink-0",
                outcome.lock === "locked" ? "bg-sky-500/30" : "bg-amber-500/30",
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{outcome.winner.name}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white">{lockBadge(outcome.lock)}</div>
            </div>
      </div>
    </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence initial={false}>
      {expanded && (
    <motion.div
          key="expanded-details"
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
                delay: 0.05,
              },
              opacity: { duration: 0.25, delay: 0.1 },
              y: { duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.05 },
            }
          }}
          exit={{ 
            height: 0, 
            opacity: 0,
            y: -5,
            transition: {
              height: {
                type: "spring",
                stiffness: 500,
                damping: 40,
              },
              opacity: { duration: 0.15 },
              y: { duration: 0.2 },
            }
          }}
          className="mt-4 space-y-4 overflow-hidden overflow-y-auto custom-scrollbar"
          style={{ maxHeight: "40vh" }}
        >
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-[0.1em]">Default Analysis</h3>
              <p className="text-sm text-white leading-relaxed">
                {outcome.winner.name} has established itself as the default choice in {zone.name} for {category} services.
                Their position is {outcome.lock === "locked" ? "locked in" : "currently rotating"}, meaning they have
                {outcome.lock === "locked" ? " maintained" : " recently gained"} the lowest-friction position when attention
                converts to action in this zone.
              </p>
      </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-[0.1em]">Why They Win</h3>
              <p className="text-sm text-white leading-relaxed">
                {outcome.rationale}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-[0.1em]">Zone Context</h3>
              <p className="text-sm text-white leading-relaxed">
                {zone.narrative}
              </p>
          </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
    </motion.div>
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

const CategoryButton = ({
  category,
  active,
  onClick,
  businesses = [],
  onBusinessClick,
  selectedBusinessName,
}: {
  category: string;
  active: boolean;
  onClick: () => void;
  businesses?: BusinessPoint[];
  onBusinessClick?: (business: BusinessPoint) => void;
  selectedBusinessName?: string;
}) => {
  // Reorder businesses to put the first (main/featured) one in the middle
  const displayedBusinesses = useMemo(() => {
    if (businesses.length === 3) {
      return [businesses[1], businesses[0], businesses[2]];
    }
    if (businesses.length === 2) {
      return [businesses[1], businesses[0]];
    }
    return businesses;
  }, [businesses]);

  return (
    <div className="relative">
  <button
    onClick={onClick}
    className={clsx(
      "glass rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
      active
            ? "!bg-[#133656] !text-white shadow-[0_0_30px_rgba(19,54,86,0.8)] !border-[#133656]"
        : "bg-white/5 text-white hover:bg-white/10 hover:text-white border border-white/10",
    )}
  >
    {category}
  </button>
      <AnimatePresence>
        {active && businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-4 z-[100] flex flex-row items-center gap-3 w-max max-w-[90vw]"
          >
            {displayedBusinesses.map((biz) => (
              <button
                key={biz.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onBusinessClick?.(biz);
                }}
                className={clsx(
                  "glass rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 text-center whitespace-nowrap",
                  selectedBusinessName === biz.name
                    ? "!bg-[#133656] !text-white shadow-[0_0_15px_rgba(19,54,86,0.6)] !border-[#133656]"
                    : "bg-white/5 text-white hover:bg-white/10 hover:text-white border border-white/10"
                )}
              >
                {biz.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AttentionMap = ({ zones, defaults, displayTime }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [fallback, setFallback] = useState(false);
  const [category, setCategory] = useState<Category>("estate");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessPoint | null>(null);
  const selectedBusinessRef = useRef<BusinessPoint | null>(null);
  useEffect(() => {
    selectedBusinessRef.current = selectedBusiness;
  }, [selectedBusiness]);

  const [expanded, setExpanded] = useState(false);
  const [defaultCardExpanded, setDefaultCardExpanded] = useState(true);
  const [businessIndex, setBusinessIndex] = useState(0); // Track current business index in category
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering businesses
  const [showSuggestions, setShowSuggestions] = useState(false); // Show autocomplete suggestions
  const [carouselPositions, setCarouselPositions] = useState<Record<number, number>>({}); // Track carousel positions for each row
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Get available categories for active zone
  const availableCategories = useMemo(() => {
    if (!activeZoneId) return [];
    const biz = businessPoints[activeZoneId] ?? [];
    return Array.from(new Set(biz.map((b) => b.category))).sort();
  }, [activeZoneId]);

  // Compute search suggestions based on query
  const searchSuggestions = useMemo(() => {
    if (!activeZoneId || !searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const suggestions: Array<{ type: "business" | "category"; name: string; category?: string }> = [];

    // Get businesses for the active zone
    const biz = businessPoints[activeZoneId] ?? [];
    const categories = availableCategories;

    // Match categories
    categories.forEach((cat: string) => {
      if (cat.toLowerCase().includes(query)) {
        suggestions.push({ type: "category", name: cat });
      }
    });

    // Match businesses (limit to 5)
    biz.forEach(business => {
      if (business.name.toLowerCase().includes(query) || business.category.toLowerCase().includes(query)) {
        suggestions.push({
          type: "business",
          name: business.name,
          category: business.category
        });
      }
    });

    // Limit total suggestions to 8
    return suggestions.slice(0, 8);
  }, [activeZoneId, searchQuery, availableCategories]);

  const outcomeMap = useMemo(() => outcomeLookup(defaults), [defaults]);

  const activeZone = useMemo(() => zones.find((z) => z.id === activeZoneId) ?? null, [zones, activeZoneId]);

  // Helper function to get top 3 businesses per category per town
  const getCategoryBusinesses = useCallback((zoneId: string | null, category: string | null): BusinessPoint[] => {
    if (!zoneId || !category) return [];
    const biz = businessPoints[zoneId] ?? [];
    const filtered = biz.filter((b) => b.category === category);
    return filtered;
  }, []);

  const updateBusinessMarkers = useCallback(
    (zoneId: string | null, categoryFilter: string | null = null, searchFilter: string = "") => {
      let biz = businessPoints[zoneId ?? ""] ?? [];
      
      // Filter by category if selected and limit to 3
      if (categoryFilter) {
        biz = biz.filter((b) => b.category === categoryFilter);
      }
      
      // Filter by search query if provided (using semantic search)
      if (searchFilter.trim()) {
        biz = filterBusinessesByQuery(biz, searchFilter);
      }

      if (mapRef.current && !fallback) {
        const map = mapRef.current;
        const sourceId = "business-points";
        const layerId = "business-points-layer";
        const glowLayerId = "business-points-layer-glow";
        const featureCollection: FeatureCollection<Point, { id: string; label: string; meta: string; category: string; phone: string; businessData: string }> = {
          type: "FeatureCollection",
          features: biz.map((b) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: b.coords },
            properties: { 
              id: `${zoneId}-${b.name}`, 
              label: b.name, 
              meta: b.meta, 
              category: b.category, 
              phone: b.phone,
              businessData: JSON.stringify(b),
            },
          })),
        };
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(featureCollection);
          // Ensure colors are updated even if source already existed
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, "circle-color", "#133656");
            map.setPaintProperty(layerId, "circle-stroke-color", "#ffffff");
            
            // Re-apply selection filter if a business is selected
            if (selectedBusiness) {
              const selectedId = `${zoneId}-${selectedBusiness.name}`;
              map.setFilter(layerId, ["!=", ["get", "id"], selectedId]);
            } else {
              map.setFilter(layerId, null);
            }
          }
          if (map.getLayer(glowLayerId)) {
            map.setPaintProperty(glowLayerId, "circle-color", "#133656");
            
            // Re-apply selection filter if a business is selected
            if (selectedBusiness) {
              const selectedId = `${zoneId}-${selectedBusiness.name}`;
              map.setFilter(glowLayerId, ["!=", ["get", "id"], selectedId]);
            } else {
              map.setFilter(glowLayerId, null);
            }
          }
        } else {
          map.addSource(sourceId, { type: "geojson", data: featureCollection });
          
          // Add glow layer first (underneath)
          map.addLayer({
            id: `${layerId}-glow`,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 12,
              "circle-color": "#133656",
              "circle-opacity": 0.4,
              "circle-blur": 0.8,
            },
          });

          // Main business point layer
          map.addLayer({
            id: layerId,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 7,
              "circle-color": "#133656",
              "circle-stroke-width": 2.5,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 1,
            },
          });

          // Add popup on hover
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: "business-popup",
          });

          map.on("mouseenter", layerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (!props) return;

            map.getCanvas().style.cursor = "pointer";

            popup
              .setLngLat(feature.geometry.type === "Point" ? (feature.geometry.coordinates as LngLat) : [0, 0])
              .setHTML(`
                <div style="color: #fff; font-family: system-ui, -apple-system, sans-serif;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${props.label}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">${props.category}</div>
                  <div style="font-size: 12px; color: #cbd5e1;">${props.phone}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${props.meta}</div>
                </div>
              `)
              .addTo(map);
          });

          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
            popup.remove();
          });

        // Add hover/click for selected-business-layer as well
        map.on("mouseenter", "selected-business-layer", (e) => {
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
          // It's already selected, but ensure expanded mode
          setExpanded(true);
          });

          // Add click handler to select business
          map.on("click", layerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (!props || !props.businessData) return;
            
            try {
              const business = JSON.parse(props.businessData as string) as BusinessPoint;
              setSelectedBusiness(business);
              setExpanded(true); // Open in expanded mode immediately
              
              // Update business index if category is selected
              if (selectedCategory && activeZoneId) {
                const categoryBiz = getCategoryBusinesses(activeZoneId, selectedCategory);
                const index = categoryBiz.findIndex(b => b.name === business.name);
                if (index >= 0) {
                  setBusinessIndex(index);
                }
              }
            } catch (err) {
              console.error("Failed to parse business data", err);
            }
          });
        }
      }
        },
        [fallback, selectedCategory, activeZoneId, getCategoryBusinesses, searchQuery, selectedBusiness],
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
        console.warn("WebGL not supported");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFallback(true);
        return;
      }

      if (!mapboxgl.accessToken) {
        console.warn("Mapbox token not set. Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
        console.warn("Get a free token at: https://account.mapbox.com/access-tokens/");
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
        console.error('Mapbox error:', e);
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
        
        // Explicitly set terrain
        map.setTerrain({ source: "mapbox-dem", exaggeration: 2.0 });

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
        const pulsingDot: any = {
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

        // Add town glow layer
        map.addLayer({
          id: "town-markers-glow",
          type: "circle",
          source: "town-markers",
          paint: {
            "circle-radius": 20,
            "circle-color": "#133656",
            "circle-opacity": 0.2,
            "circle-blur": 1,
          },
        });
        
        // Add town marker layer (only visible when no town is selected)
        map.addLayer({
          id: "town-markers-layer",
          type: "circle",
          source: "town-markers",
          paint: {
            "circle-radius": 10,
            "circle-color": "#133656",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 1,
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
        
        // Change cursor on hover
        map.on("mouseenter", "town-markers-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        
        map.on("mouseleave", "town-markers-layer", () => {
          map.getCanvas().style.cursor = "";
        });
        });

        map.on("error", (e) => {
          console.error("Mapbox error:", e);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFallback(true);
        });

      mapRef.current = map;
    } catch (error) {
        console.error("Mapbox initialization failed:", error);
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
      setSelectedBusiness(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusinessIndex(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery("");
      // Start with card minimized, it will expand smoothly
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultCardExpanded(false);
    }
  }, [activeZoneId]);

  // fly to location and show markers when town is selected
  useEffect(() => {
    if (!mapRef.current || fallback) return;
    
    // Show/hide town markers based on selection
    if (mapRef.current.getLayer("town-markers-layer")) {
      const visibility = activeZoneId ? "none" : "visible";
      mapRef.current.setLayoutProperty("town-markers-layer", "visibility", visibility);
      if (mapRef.current.getLayer("town-markers-glow")) {
        mapRef.current.setLayoutProperty("town-markers-glow", "visibility", visibility);
      }
    }
    if (mapRef.current.getLayer("town-labels-layer")) {
      mapRef.current.setLayoutProperty(
        "town-labels-layer",
        "visibility",
        activeZoneId ? "none" : "visible"
      );
    }
    
    if (activeZoneId) {
      const zone = zones.find((z) => z.id === activeZoneId);
      if (zone) {
        // Only zoom to zone if no category is selected (category zoom will handle it)
        if (!selectedCategory && !searchQuery) {
          mapRef.current.flyTo({ center: zone.coordinates, zoom: 13.5, duration: 1200, pitch: 60, bearing: -10 });
        }
        updateBusinessMarkers(activeZoneId, selectedCategory, searchQuery);
      }
    } else {
      // Show full Garden Route view when no town selected (Tilted slightly)
      const fit = new mapboxgl.LngLatBounds(regionBounds.sw, regionBounds.ne);
      mapRef.current.fitBounds(fit, { padding: 120, duration: 800, pitch: 25, bearing: 0 });
      // Clear business markers
      const sourceId = "business-points";
      if (mapRef.current.getSource(sourceId)) {
        const emptyCollection: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };
        (mapRef.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(emptyCollection);
      }
    }
  }, [activeZoneId, fallback, zones, updateBusinessMarkers, selectedCategory, searchQuery]);

  // Update markers and zoom when category or search changes
  useEffect(() => {
    if (activeZoneId && mapRef.current && !fallback) {
      updateBusinessMarkers(activeZoneId, selectedCategory, searchQuery);
      
      // Zoom in on businesses of selected category or search results
      if (selectedCategory || searchQuery.trim()) {
        const biz = businessPoints[activeZoneId] ?? [];
        let filteredBiz = biz;
        
        if (selectedCategory) {
          filteredBiz = filteredBiz.filter((b) => b.category === selectedCategory).slice(0, 3);
        }
        
        if (searchQuery.trim()) {
          filteredBiz = filterBusinessesByQuery(filteredBiz, searchQuery);
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
  }, [selectedCategory, activeZoneId, fallback, zones, updateBusinessMarkers]);

  // Zoom to selected business when it changes
  useEffect(() => {
    if (mapRef.current && !fallback) {
      const map = mapRef.current;
      const source = map.getSource("selected-business") as mapboxgl.GeoJSONSource;
      const layerId = "business-points-layer";
      const glowLayerId = "business-points-layer-glow";

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

        // Hide the original static marker
        const selectedId = `${activeZoneId}-${selectedBusiness.name}`;
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, ["!=", ["get", "id"], selectedId]);
        }
        if (map.getLayer(glowLayerId)) {
          map.setFilter(glowLayerId, ["!=", ["get", "id"], selectedId]);
        }

        // Fly to business
        map.flyTo({
          center: selectedBusiness.coords,
          zoom: 15.5,
          duration: 1200,
          pitch: 60,
          bearing: -10,
        });
      } else {
        // Clear pulsing dot and restore all static markers
        if (source) {
          source.setData({ type: "FeatureCollection", features: [] });
        }
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, null);
        }
        if (map.getLayer(glowLayerId)) {
          map.setFilter(glowLayerId, null);
        }
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

      {/* Top Left - Branding & Back Button */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3">
        <AnimatePresence mode="wait">
          {activeZoneId ? (
            <motion.button
              key="back-button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => {
                setActiveZoneId(null);
                setSelectedCategory(null);
                setSelectedBusiness(null);
                setExpanded(false);
                setSearchQuery("");
              }}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition border border-white/10"
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
          <span>Garden Route Defaults Engine</span>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

      {/* Bottom Center - Footer Header - Only show on main towns overview, not individual town pages */}
      {!activeZoneId && (
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="glass flex items-center gap-4 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-2xl backdrop-blur-2xl border-white/10">
            <Link href="/about" className="hover:text-[#133656] transition-colors">About</Link>
            <span className="h-1 w-1 rounded-full bg-[#133656]/40 shadow-[0_0_8px_rgba(19,54,86,0.4)]" />
            <Link href="/blogs" className="hover:text-[#133656] transition-colors">Blogs</Link>
            <span className="h-1 w-1 rounded-full bg-[#133656]/40 shadow-[0_0_8px_rgba(19,54,86,0.4)]" />
            <Link href="/contact" className="hover:text-[#133656] transition-colors">Contact</Link>
            <span className="h-1 w-1 rounded-full bg-[#133656]/40 shadow-[0_0_8px_rgba(19,54,86,0.4)]" />
            <Link href="/partners" className="hover:text-[#133656] transition-colors">Partners</Link>
      </div>
        </div>
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
      <div className="absolute left-1/2 top-20 -translate-x-1/2 z-20 w-full max-w-full px-4 flex flex-col items-center gap-3">
        {activeZoneId ? (
          <div className="flex flex-nowrap justify-center gap-2 overflow-visible max-w-full py-4 px-4">
              {availableCategories.map((cat) => (
                <CategoryButton
                  key={cat}
                  category={cat}
                  active={cat === selectedCategory}
                businesses={getCategoryBusinesses(activeZoneId, cat).slice(0, 3)}
                selectedBusinessName={selectedBusiness?.name}
                onBusinessClick={(biz) => {
                  setSelectedBusiness(biz);
                  setBusinessIndex(0);
                  setExpanded(true);
                }}
                  onClick={() => {
                    const newCategory = cat === selectedCategory ? null : cat;
                    setSelectedCategory(newCategory);
                    
                    // If selecting a category, show the first business from that category
                    if (newCategory && activeZoneId) {
                      const categoryBiz = getCategoryBusinesses(activeZoneId, newCategory);
                      if (categoryBiz.length > 0) {
                        setSelectedBusiness(categoryBiz[0]);
                        setBusinessIndex(0);
                        setExpanded(true);
                      } else {
                        setSelectedBusiness(null);
                        setBusinessIndex(0);
                        setExpanded(false);
                      }
                    } else {
                      setSelectedBusiness(null);
                      setBusinessIndex(0);
                      setExpanded(false);
                    }
                  }}
                />
              ))}
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

      <div className="absolute inset-0 z-10">
        <div className="relative h-full w-full overflow-hidden">
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden rounded-[28px] w-full h-full"
            style={{ minHeight: "100%" }}
          />
          {fallback ? <div className="absolute inset-0 rounded-[28px] map-fallback" /> : null}

          <motion.div 
            className="pointer-events-none absolute right-4 bottom-2 z-20 w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <AnimatePresence mode="wait">
              {selectedBusiness && activeZone ? (() => {
                const categoryBiz = selectedCategory ? getCategoryBusinesses(activeZoneId, selectedCategory) : [];
                const currentIndex = categoryBiz.findIndex(b => b.name === selectedBusiness.name);
                const canGoNext = currentIndex < categoryBiz.length - 1;
                const canGoPrevious = currentIndex > 0;
                
                const handleNext = () => {
                  if (canGoNext && currentIndex < categoryBiz.length - 1) {
                    setSelectedBusiness(categoryBiz[currentIndex + 1]);
                    setBusinessIndex(currentIndex + 1);
                    setExpanded(true);
                  }
                };
                
                const handlePrevious = () => {
                  if (canGoPrevious && currentIndex > 0) {
                    setSelectedBusiness(categoryBiz[currentIndex - 1]);
                    setBusinessIndex(currentIndex - 1);
                    setExpanded(true);
                  }
                };
                
                return (
                  <BusinessCard
                    key="business"
                    business={selectedBusiness}
                    zone={activeZone}
                    expanded={expanded}
                    onToggle={() => setExpanded(!expanded)}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    canGoNext={canGoNext}
                    canGoPrevious={canGoPrevious}
                  />
                );
              })() : activeZone && outcome ? (
                <OverlayCard
                  key="default"
                  zone={activeZone}
                  outcome={outcome}
                  category={category}
                  setCategory={(cat) => setCategory(cat)}
                  displayTime={displayTime}
                  expanded={defaultCardExpanded}
                  onToggle={() => setDefaultCardExpanded(!defaultCardExpanded)}
                  availableCategories={availableCategories}
                  carouselPositions={carouselPositions}
                  setCarouselPositions={setCarouselPositions}
                  onBusinessSelect={(business) => {
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
