import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Coffee,
  Utensils,
  Car,
  Bed,
  Scissors,
  Heart,
  Star,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const towns = [
  { name: "George", desc: "The commercial hub with the airport—your gateway to the Garden Route." },
  { name: "Wilderness", desc: "Peaceful beach village with lagoons, rivers, and indigenous forests." },
  { name: "Sedgefield", desc: "South Africa's only official 'slow town'—where life moves at its own pace." },
  { name: "Knysna", desc: "Vibrant waterfront town famous for oysters and the iconic Knysna Heads." },
  { name: "Plettenberg Bay", desc: "Upmarket beach resort with pristine beaches and marine life." },
  { name: "Mossel Bay", desc: "Historic harbour town where European explorers first landed." },
  { name: "Oudtshoorn", desc: "Klein Karoo gateway—ostrich farms, Cango Caves, and dramatic passes." },
];

const categories = [
  { icon: <Bed className="w-5 h-5 text-sky-300" />, name: "Stay", desc: "Hotels, guest houses, and resorts handpicked for comfort and location." },
  { icon: <Utensils className="w-5 h-5 text-amber-300" />, name: "Eat", desc: "Restaurants serving the best local cuisine and international flavours." },
  { icon: <Coffee className="w-5 h-5 text-emerald-300" />, name: "Coffee", desc: "Specialty coffee shops and roasteries worth the detour." },
  { icon: <Car className="w-5 h-5 text-violet-300" />, name: "Car Hire", desc: "Reliable vehicle rentals to explore the coast at your own pace." },
  { icon: <Scissors className="w-5 h-5 text-rose-300" />, name: "Services", desc: "From dental care to optometry—trusted local professionals." },
  { icon: <Heart className="w-5 h-5 text-fuchsia-300" />, name: "Wellness", desc: "Spas, wellness centres, and places to unwind." },
];

const whyTrust = [
  { title: "Personally Vetted", desc: "Every business is visited and evaluated by me—no paid placements, no algorithms." },
  { title: "Local Knowledge", desc: "I live here. These are the places I recommend to friends and family." },
  { title: "Quality Over Quantity", desc: "Only the top 3 in each category make the cut. If it's listed, it's worth your time." },
  { title: "Always Updated", desc: "Recommendations evolve as businesses change. What's best today stays best." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 px-6 md:px-10 pb-28">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.08),transparent_30%)]" />
      </div>

      <div className="max-w-6xl mx-auto pt-16 space-y-12">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-sky-300 font-semibold">
            <Link href="/" className="inline-flex items-center gap-2 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Map
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition text-sm"
            >
              Read Our Blog
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_18px_rgba(56,189,248,0.25)] text-sm"
            >
              Contact
            </Link>
          </div>
        </div>

        <header className="space-y-6 text-center relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70 px-6 py-10 md:py-14 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.15),transparent_35%)]" />
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sky-200 text-sm font-semibold shadow-lg">
            <Star className="w-4 h-4 text-amber-300" />
            The Top 3 Best Businesses in Every Category
          </div>
          <h1 className="relative text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_8px_30px_rgba(56,189,248,0.25)]">
            Your Guide to the Best of the Garden Route
          </h1>
          <p className="relative text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-3xl mx-auto">
            I&apos;ve personally explored every corner of the Garden Route to bring you the <span className="text-white font-semibold">top 3 businesses</span> in each category,
            in every town. No algorithms, no paid rankings—just honest recommendations from someone who lives here and knows what&apos;s worth your time.
          </p>
          <div className="relative flex flex-wrap justify-center gap-3 pt-2">
            {[
              { label: "7 Towns", color: "from-sky-400/30 to-blue-500/30" },
              { label: "Handpicked Top 3s", color: "from-emerald-400/30 to-teal-500/30" },
              { label: "Zero Paid Placements", color: "from-amber-300/30 to-orange-400/20" },
            ].map((item) => (
              <span
                key={item.label}
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${item.color} border border-white/10 shadow-[0_0_18px_rgba(255,255,255,0.08)]`}
              >
                {item.label}
              </span>
            ))}
          </div>
        </header>

        {/* Why Trust This */}
        <section className="glass border border-white/10 rounded-3xl p-6 md:p-10 space-y-6 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/60">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Local, Verified, Current
            </div>
            <h2 className="text-2xl font-bold text-white">Why Trust These Recommendations?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyTrust.map((item, i) => (
              <div
                key={i}
                className="relative overflow-hidden glass rounded-2xl border border-white/10 p-5 space-y-3 hover:border-sky-400/40 transition"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/4 to-transparent pointer-events-none" />
                <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-400/20 flex items-center justify-center text-sky-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Towns */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">7 Towns, Endless Discoveries</h2>
            <p className="text-slate-400">Each town has its own character—and its own top businesses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {towns.map((town, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 p-5 space-y-2 hover:border-amber-300/40 hover:shadow-[0_15px_35px_rgba(251,191,36,0.08)] transition"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_45%)]" />
                <div className="relative flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-300/30 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-amber-300" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{town.name}</h3>
                </div>
                <p className="relative text-sm text-slate-400 leading-relaxed">{town.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="glass border border-white/10 rounded-3xl p-6 md:p-10 space-y-6 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/60">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Categories We Cover</h2>
            <p className="text-slate-400">From where to stay to where to eat—we&apos;ve got you covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 hover:border-sky-400/40 hover:shadow-[0_15px_35px_rgba(56,189,248,0.08)] transition"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_40%)]" />
                <div className="relative mt-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center">
                    {cat.icon}
                  </div>
                </div>
                <div className="relative space-y-1">
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { num: "1", title: "Pick a Town", desc: "Click any town on the map to zoom in and see what's available.", color: "from-sky-500/20 to-blue-500/20", border: "border-sky-400/30", text: "text-sky-300" },
            { num: "2", title: "Choose a Category", desc: "Filter by what you need—restaurants, hotels, coffee, services, and more.", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-400/30", text: "text-amber-300" },
            { num: "3", title: "Discover the Best", desc: "See the top 3 businesses, get directions, call directly, or read more.", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-400/30", text: "text-emerald-300" },
          ].map((step) => (
            <div
              key={step.num}
              className="relative overflow-hidden glass rounded-2xl border border-white/10 p-6 space-y-3 text-center bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 hover:border-sky-400/40 transition"
            >
              <div className={`w-12 h-12 rounded-full ${step.color} ${step.border} border flex items-center justify-center mx-auto`}>
                <span className={`text-xl font-bold ${step.text}`}>{step.num}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </section>

        {/* Call to action */}
        <section className="relative overflow-hidden glass rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-sky-500/12 via-slate-900/30 to-amber-500/12">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_50%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_85%_40%,rgba(251,191,36,0.16),transparent_32%)]" />
          <div className="relative space-y-2">
            <h2 className="text-2xl font-bold text-white">Ready to Explore?</h2>
            <p className="text-slate-300 text-sm">
              Start discovering the best businesses the Garden Route has to offer.
            </p>
          </div>
          <div className="relative flex gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]"
            >
              Open the Map
            </Link>
            <Link
              href="/blogs"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
            >
              Read Our Blog
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold">
            <Heart className="w-4 h-4 text-rose-300" />
            We’d love to hear from you
          </div>
          <p className="text-slate-400">
            Have a question or want to suggest a business?{" "}
            <Link href="/contact" className="text-sky-400 hover:text-white transition font-semibold">
              Get in touch
            </Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
