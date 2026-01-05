"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Info, BookOpen, Mail, Users, Heart } from "lucide-react";

const navLinks = [
  { href: "/", label: "Map", icon: MapPin },
  { href: "/about", label: "About", icon: Info },
  { href: "/blogs", label: "Blog", icon: BookOpen },
  { href: "/partners", label: "Partners", icon: Users },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Header() {
  const pathname = usePathname();
  const isMyTripActive = pathname.startsWith("/my-trip");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <nav className="max-w-6xl mx-auto">
        <div className="glass rounded-2xl border border-white/10 px-4 py-2 flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white font-bold text-lg hover:text-sky-300 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline">Spotlight</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition
                    ${isActive 
                      ? "bg-sky-500/20 text-sky-300 border border-sky-400/30" 
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}

            <Link
              href="/my-trip"
              aria-label="My Trip"
              className={
                `ml-1 relative inline-flex items-center justify-center rounded-full transition-all ` +
                (isMyTripActive
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                  : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10")
              }
              style={{ width: 44, height: 44, marginTop: -10, marginBottom: -10 }}
            >
              <Heart className={isMyTripActive ? "w-5 h-5 fill-sky-400 text-sky-400" : "w-5 h-5"} />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
