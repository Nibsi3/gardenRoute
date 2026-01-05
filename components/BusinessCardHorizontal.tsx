"use client";

import { BusinessPoint, getPhotoUrl } from "@/lib/businessData";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart, MapPin, Star, Phone, Globe, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface BusinessCardHorizontalProps {
  business: BusinessPoint;
  townId: string;
  onClick?: () => void;
}

export function BusinessCardHorizontal({ business, townId, onClick }: BusinessCardHorizontalProps) {
  const { data: session } = useSession();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(townId, business.name);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get photo URL
  const photoUrl = business.photos?.[0]
    ? getPhotoUrl(business.photos[0], 300)
    : null;

  return (
    <div 
      className="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex">
        {/* Image Section */}
        <div className="relative w-28 h-28 flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {photoUrl ? (
            <>
              <Image
                src={photoUrl}
                alt={business.name}
                fill
                priority
                onLoad={() => setImageLoaded(true)}
                className={`object-cover transition-all duration-500 ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
          )}
          {/* Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!session) {
                signIn("google");
                return;
              }
              toggleFavorite(townId, business.name);
            }}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 rounded-full backdrop-blur-sm shadow-sm hover:scale-110 transition-transform border border-gray-100"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                saved ? "fill-sky-400 text-sky-400" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-medium text-sky-600 uppercase tracking-wide">
                {business.category}
              </span>
              <h3 className="font-semibold text-gray-900 truncate text-sm mt-0.5">
                {business.name}
              </h3>
            </div>
            {business.rating && (
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium text-amber-700">
                  {business.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {business.address && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {business.address}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-sky-600 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-sky-600 transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span>Website</span>
              </a>
            )}
            {business.googleMapsUrl && (
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-sky-600 transition-colors ml-auto"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Directions</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
