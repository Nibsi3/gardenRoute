import Link from "next/link";
import { ArrowLeft, Sparkles, Map, Gauge, Users, Layers, Zap, Shield, Target } from "lucide-react";

const highlights = [
  {
    icon: <Map className="w-5 h-5 text-sky-300" />,
    title: "Spatial Attention",
    desc: "Live map layers that show where intent is forming across towns like George, Wilderness, Knysna, and Plett.",
  },
  {
    icon: <Gauge className="w-5 h-5 text-amber-300" />,
    title: "Default Scores",
    desc: "A proprietary scoring model that blends friction, trust signals, proximity, and narrative strength.",
  },
  {
    icon: <Users className="w-5 h-5 text-emerald-300" />,
    title: "Category Leaders",
    desc: "Track incumbents and challengers in Stay, Car Hire, Eat, Coffee, and more local categories.",
  },
  {
    icon: <Zap className="w-5 h-5 text-violet-300" />,
    title: "Conversion Flow",
    desc: "See how attention becomes action—calls, bookings, and directions—per micro-zone.",
  },
  {
    icon: <Shield className="w-5 h-5 text-sky-200" />,
    title: "Resilience",
    desc: "Measure how defaults hold under peak load, weather shifts, or seasonal tourism surges.",
  },
  {
    icon: <Layers className="w-5 h-5 text-fuchsia-200" />,
    title: "Narrative Layer",
    desc: "Pair geospatial data with concise narratives explaining why a business is winning right now.",
  },
];

const milestones = [
  { year: "2024", title: "Prototype", detail: "Initial attention-map prototype across George and Wilderness." },
  { year: "2025", title: "Defaults Engine", detail: "Rolled out category defaults for Stay, Car Hire, Eat, Coffee." },
  { year: "2026", title: "Playbooks", detail: "Actionable rotation playbooks for challengers and incumbents." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 px-6 md:px-10 pb-20">
      <div className="noise-overlay" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="glow-ring left-1/4 top-1/4 h-96 w-96 bg-sky-400/12" />
        <div className="glow-ring right-1/3 top-1/3 h-96 w-96 bg-violet-500/10" />
        <div className="glow-ring left-1/2 bottom-1/4 h-80 w-80 bg-amber-400/8" />
      </div>

      <div className="max-w-6xl mx-auto pt-16 space-y-12">
        <div className="flex items-center gap-3 text-sm text-sky-300 font-semibold">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <Sparkles className="w-4 h-4" /> Garden Route Defaults Engine
          </span>
        </div>

        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Mapping the defaults that capture action across the Garden Route.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-4xl">
            We track where attention converts—calls, bookings, directions—and reveal which businesses hold the
            “default” position in each category. From George Airport arrivals to lakeside stays in Wilderness, we show
            who wins and why.
          </p>
        </header>

        {/* Highlights */}
        <section className="glass border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">What the Engine Sees</h2>
          <p className="text-slate-400 max-w-4xl">
            Each layer combines spatial signals, service friction, and narrative strength to explain market dominance in
            plain language.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="glass rounded-2xl border border-white/10 p-4 flex items-start gap-3 hover:border-sky-400/40 transition"
              >
                <div className="mt-1">{item.icon}</div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">How Defaults Are Calculated</h2>
            <p className="text-slate-300 leading-relaxed">
              The engine scores each business on friction, trust signals, proximity, and current narrative strength.
              When a challenger’s score surpasses the incumbent, we flag a potential rotation.
            </p>
            <ul className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 space-y-2 list-disc list-inside">
              <li>Friction: queue time, response latency, distance to user.</li>
              <li>Trust: reviews, brand recall, consistency signals.</li>
              <li>Context: proximity and narrative strength within the town.</li>
              <li>Rotation trigger: when a challenger’s combined signals exceed the incumbent.</li>
            </ul>
            <p className="text-slate-400 text-sm">
              We also track dwell time, queue stress, and response latency to surface “micro-friction” that can erode a
              default during peak demand.
            </p>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">Where It Applies</h2>
            <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2"><Target className="w-4 h-4 text-sky-300 mt-1" /> George arrivals: Car Hire defaults (Avis George Airport).</li>
              <li className="flex items-start gap-2"><Target className="w-4 h-4 text-sky-300 mt-1" /> George dining: Seafood reliability (The Fat Fish).</li>
              <li className="flex items-start gap-2"><Target className="w-4 h-4 text-sky-300 mt-1" /> Wilderness stays: Lakeside bundles (The Wilderness Hotel).</li>
              <li className="flex items-start gap-2"><Target className="w-4 h-4 text-sky-300 mt-1" /> Plett coast: All-in-one resort default (Beacon Island Resort).</li>
              <li className="flex items-start gap-2"><Target className="w-4 h-4 text-sky-300 mt-1" /> Business travel: Reliable check-ins near George Airport (Protea Hotel King George).</li>
            </ul>
          </div>
        </section>

        {/* Milestones */}
        <section className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Milestones</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {milestones.map((m) => (
              <div key={m.year} className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-2 glass">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300 font-bold">{m.year}</p>
                <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{m.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="glass rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Want to see your town’s default map?</h2>
            <p className="text-slate-300 text-sm">
              We’ll walk you through the live map, friction scores, and rotation playbooks for your category.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.35)]"
            >
              Book a Session
            </Link>
            <Link
              href="/blogs"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
            >
              Read Insights
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

