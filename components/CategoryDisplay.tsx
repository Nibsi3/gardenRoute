"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { categories } from "@/lib/defaults";
import { Category } from "@/lib/types";

interface CategoryPillProps {
  id: Category;
  label: string;
  micro: string;
  active: boolean;
  onSelect: (category: Category) => void;
}

const CategoryPill = ({ id, label, micro, active, onSelect }: CategoryPillProps) => (
  <button
    onClick={() => onSelect(id)}
    className={clsx(
      "glass group relative inline-flex flex-col gap-1 rounded-xl px-3 py-2 text-left transition",
      active
        ? "!border-blue-500 !bg-blue-500/20 !text-blue-100 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
        : "border-white/5 hover:border-white/20 hover:bg-white/5",
    )}
  >
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="text-xs opacity-60 font-mono">{micro}</div>
    </div>
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

interface CategoryDisplayProps {
  availableCategories: string[];
  category: Category;
  setCategory: (category: Category) => void;
  carouselPositions: Record<number, number>;
  setCarouselPositions: (positions: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void;
}

export default function CategoryDisplay({
  availableCategories,
  category,
  setCategory,
  carouselPositions,
  setCarouselPositions
}: CategoryDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableCatIds = availableCategories.map((cat: string) => cat.toLowerCase());
  const filteredCategories = categories.filter(cat =>
    availableCatIds.includes(cat.id.toLowerCase())
  );


  // Don't render on server to avoid hydration mismatches
  if (!mounted) {
    return (
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {/* Render placeholder categories to match server HTML */}
          {Array.from({ length: Math.min(filteredCategories.length, 10) }).map((_, i) => (
            <div key={i} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 h-10 w-20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // If 10 or fewer categories available in this zone, display them all normally
  if (filteredCategories.length <= 10) {
    return (
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {filteredCategories.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.label}
              micro={cat.micro}
              active={cat.id === category}
              onSelect={setCategory}
            />
          ))}
        </div>
      </div>
    );
  }

  // If more than 11 categories, display in carousel with 5 per slide
  const slides = [];
  for (let i = 0; i < filteredCategories.length; i += 5) {
    slides.push(filteredCategories.slice(i, i + 5));
  }

  const currentSlide = carouselPositions[0] || 0;
  const canGoLeft = currentSlide > 0;
  const canGoRight = currentSlide < slides.length - 1;

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Left navigation button */}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!canGoLeft}
            onClick={() => {
              setCarouselPositions((prev: Record<number, number>) => ({
                ...prev,
                0: Math.max(0, (prev[0] || 0) - 1)
              }));
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Carousel container - show only current slide */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-2 transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
                width: `${slides.length * 100}%`
              }}
            >
              {slides.map((slide, slideIndex) => (
                <div key={slideIndex} className="flex gap-2" style={{ width: `${100 / slides.length}%` }}>
                  {slide.map((cat) => (
                    <CategoryPill
                      key={cat.id}
                      id={cat.id}
                      label={cat.label}
                      micro={cat.micro}
                      active={cat.id === category}
                      onSelect={setCategory}
                    />
                  ))}
                  {/* Fill empty spaces if slide has less than 5 items */}
                  {Array.from({ length: 5 - slide.length }).map((_, emptyIndex) => (
                    <div key={`empty-${emptyIndex}`} className="w-20 h-10" /> // Invisible spacer
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right navigation button */}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!canGoRight}
            onClick={() => {
              setCarouselPositions((prev: Record<number, number>) => ({
                ...prev,
                0: Math.min(slides.length - 1, (prev[0] || 0) + 1)
              }));
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Slide indicators */}
        <div className="flex justify-center gap-1 mt-2">
          {slides.map((_, slideIndex) => (
            <div
              key={slideIndex}
              className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                slideIndex === currentSlide ? 'bg-sky-400' : 'bg-white/20'
              }`}
              onClick={() => {
                setCarouselPositions((prev: Record<number, number>) => ({
                  ...prev,
                  0: slideIndex
                }));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
