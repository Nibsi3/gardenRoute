"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/my-trip", label: "MY TRIP" },
  { href: "/blogs", label: "BLOGS" },
  { href: "/contact", label: "CONTACT" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [townActive, setTownActive] = useState(false);

  // Listen for town active state changes from AttentionMap
  useEffect(() => {
    const handleTownActive = (e: CustomEvent) => {
      setTownActive(e.detail.active);
    };
    
    window.addEventListener('townActiveChange', handleTownActive as EventListener);
    return () => window.removeEventListener('townActiveChange', handleTownActive as EventListener);
  }, []);

  // Hide on specific pages
  const hideOnPages = ["/george", "/wilderness", "/sedgefield", "/knysna", "/plettenberg-bay", "/mossel-bay", "/oudtshoorn", "/auth/signin"];
  const shouldHide = hideOnPages.some(page => pathname === page || pathname.startsWith(page + "/") || pathname.startsWith(page + "?"));
  
  // Hide if on a hidden page OR if a town is active on the home map
  if (shouldHide || townActive) {
    return null;
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/50 shadow-xl">
        {navLinks.map((link, index) => {
          const isActive = pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));

          if (link.href === "/my-trip") {
            return (
              <div key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  aria-label="My Trip"
                  className={
                  `mx-1 relative inline-flex items-center justify-center rounded-full transition-all ` +
                  (isActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                    : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10")
                }
                style={{ width: 44, height: 44, marginTop: -10, marginBottom: -10 }}
              >
                <Heart className={isActive ? "w-5 h-5 fill-sky-300 text-sky-300" : "w-5 h-5"} />
              </Link>
              {index < navLinks.length - 1 && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-1" />
              )}
            </div>
          );
          }
          
          return (
            <div key={link.href} className="flex items-center">
              <Link
                href={link.href}
                className={`
                  px-4 py-1.5 text-sm font-medium tracking-wide transition-colors
                  ${isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                  }
                `}
              >
                {link.label}
              </Link>
              {index < navLinks.length - 1 && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
