"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessType: "",
    company: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", businessType: "", company: "", message: "" });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 pb-28 flex flex-col items-center">
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_35%),radial-gradient(circle_at_75%_15%,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_50%_75%,rgba(251,191,36,0.08),transparent_30%)]" />
        </div>

        <div className="max-w-6xl w-full z-10 py-12 space-y-10">
          <header className="space-y-6 text-center relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/45 to-slate-900/70 px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.14),transparent_36%)]" />
            <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-sm font-semibold shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
              Message received
            </div>
            <h1 className="relative text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(56,189,248,0.25)]">
              Thanks for reaching out
            </h1>
            <p className="relative text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-2xl mx-auto">
              We’ve received your message and we’ll get back to you as soon as possible.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 glass rounded-3xl border border-white/10 p-6 md:p-8 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.12),transparent_45%)]" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">What happens next?</h2>
                    <p className="text-slate-400 leading-relaxed">
                      We’ll review your message and reply by email.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Clock className="w-4 h-4 text-sky-300" />
                          Typical response time
                        </div>
                        <p className="text-sm text-slate-400 mt-1">Within 24 hours</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Mail className="w-4 h-4 text-sky-300" />
                          Reply sent to
                        </div>
                        <p className="text-sm text-slate-400 mt-1">The email you provided</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold border border-sky-400/50 transition shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                >
                  Return to Map
                </Link>
                <Link
                  href="/blogs"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
                >
                  Read the Blog
                </Link>
              </div>
            </div>

            <aside className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-5 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/60 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_45%)]" />
              <div className="relative space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">Contact</h3>
                  <p className="text-slate-400 text-sm">Prefer to email directly?</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Email</p>
                    <p className="text-white font-semibold">hello@spotlight.co.za</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Based in</p>
                    <p className="text-slate-200">George, Garden Route, South Africa</p>
                  </div>
                </div>
              </div>
              </div>
            </aside>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Suggest a business", desc: "Help us keep recommendations current." },
              { title: "Be featured", desc: "Tell us what makes you one of the top 3." },
              { title: "Partnerships", desc: "Collaborate on content or experiences." },
              { title: "Support", desc: "Report a bug or a listing update." },
            ].map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.08),transparent_45%)]" />
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-sky-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-6 md:p-10 pb-28 flex flex-col items-center">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.08),transparent_30%),radial-gradient(circle_at_50%_75%,rgba(251,191,36,0.08),transparent_30%)]" />
      </div>

      <div className="max-w-6xl w-full z-10 py-12 space-y-10">
        <header className="space-y-8 text-center relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/45 to-slate-900/70 px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.14),transparent_36%)]" />
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Map
            </Link>
            <Link
              href="/blogs"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 font-semibold border border-white/10 transition"
            >
              Read the Blog
            </Link>
          </div>

          <div className="text-center space-y-5 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-200 text-sm font-semibold shadow-lg">
              <Mail className="w-4 h-4" />
              We reply fast
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(56,189,248,0.25)]">Get in Touch</h1>
            <p className="text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-3xl mx-auto">
              Have a question, want to suggest a business, or interested in being featured? Send a message and we’ll respond by email.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
          <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-6 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.12),transparent_45%)]" />
            <div className="relative space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Send a message</h2>
              <p className="text-sm text-slate-400">
                The more context you share, the quicker we can help.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 transition-colors"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 transition-colors"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for contacting *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-sky-400/60 transition-colors appearance-none"
                required
              >
                <option value="" disabled className="bg-slate-800">Select reason for contacting</option>
                <option value="general-inquiry" className="bg-slate-800">General Inquiry</option>
                <option value="business-listing" className="bg-slate-800">Business Listing</option>
                <option value="partnership" className="bg-slate-800">Partnership Opportunity</option>
                <option value="technical-support" className="bg-slate-800">Technical Support</option>
                <option value="marketing-services" className="bg-slate-800">Marketing Services</option>
                <option value="other" className="bg-slate-800">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 transition-colors"
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 transition-colors resize-none"
                placeholder="Tell us about your inquiry or how we can help..."
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? "Sending Message..." : "Send Message"}
            </button>
          </form>

            <div className="pt-2">
              <p className="text-xs text-slate-500">
                By submitting, you agree to be contacted by email about your inquiry.
              </p>
            </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-5 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/60 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_45%)]" />
              <div className="relative space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">Direct contact</h3>
                <p className="text-sm text-slate-400">You can also reach us here.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Email</div>
                    <div className="text-white font-semibold">hello@spotlight.co.za</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Based in</div>
                    <div className="text-slate-200">George, Garden Route, South Africa</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Typical response</div>
                    <div className="text-slate-200">Within 24 hours</div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-4 bg-gradient-to-br from-slate-900/60 via-slate-900/45 to-slate-900/60 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.12),transparent_42%)]" />
              <div className="relative space-y-4">
              <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">Popular topics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Suggest a business", desc: "Help us keep recommendations current." },
                  { title: "Be featured", desc: "Tell us what makes you one of the top 3." },
                  { title: "Partnerships", desc: "Collaborate on content or experiences." },
                  { title: "Support", desc: "Report a bug or a listing update." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-4"
                  >
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.08),transparent_45%)]" />
                    <div className="relative flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-sky-200" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

