import Link from "next/link";

const PARTNER_LEVELS = [
  {
    name: "Default Leader",
    description: "Exclusive top-level mapping for businesses that own their category.",
    features: ["Priority Panning", "Animated Pulsing Beacons", "Advanced Narrative Generation"]
  },
  {
    name: "Growth Partner",
    description: "For established businesses looking to solidify their market presence.",
    features: ["Town-Level Visibility", "Basic AI Content", "Directions Integration"]
  }
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-8 flex flex-col items-center">
      <div className="noise-overlay" />
      
      <div className="max-w-4xl w-full z-10 py-20 space-y-12">
        <div className="space-y-4 text-center">
          <Link href="/" className="text-sky-400 hover:text-white transition flex items-center justify-center gap-2 mb-8">
            ← Back to Map
          </Link>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">Partner with the Engine</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Join the network of top-tier businesses that dominate the Garden Route's attention map.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {PARTNER_LEVELS.map((level, i) => (
            <div key={i} className={`glass p-8 rounded-3xl border ${i === 0 ? 'border-sky-400/40 shadow-[0_0_40px_rgba(56,189,248,0.1)]' : 'border-white/10'} space-y-6 flex flex-col`}>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{level.name}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{level.description}</p>
              </div>
              
              <ul className="space-y-3 flex-1">
                {level.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="h-1 w-1 rounded-full bg-sky-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-xl font-bold transition ${i === 0 ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'}`}>
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

