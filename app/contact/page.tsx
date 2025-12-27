"use client";

import Link from "next/link";
import { useState } from "react";

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
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-8 flex flex-col items-center">
        <div className="noise-overlay" />

        <div className="max-w-2xl w-full z-10 py-20 space-y-12">
          <div className="space-y-4">
            <Link href="/" className="text-sky-400 hover:text-white transition flex items-center gap-2 mb-8">
              ← Back to Map
            </Link>
            <h1 className="text-5xl font-bold tracking-tight text-white mb-4">Message Sent!</h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Thank you for reaching out. We've received your message and will get back to you within 24 hours.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/10 space-y-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg text-slate-300">
              Your inquiry has been successfully submitted. We'll be in touch soon!
            </p>
            <Link
              href="/"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            >
              Return to Map
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200 p-8 flex flex-col items-center">
      <div className="noise-overlay" />

      <div className="max-w-2xl w-full z-10 py-20 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="text-sky-400 hover:text-white transition flex items-center gap-2 mb-8">
            ← Back to Map
          </Link>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">Get in Touch</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Interested in capturing more default attention? Let's discuss your position on the map.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 space-y-8">
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
                placeholder="Tell us about your business and how we can help you capture more default attention..."
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

          <div className="border-t border-white/10 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-sky-400 font-bold">Email Us</p>
                <p className="text-lg font-semibold text-white">hello@gardenroutedefaults.co.za</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-sky-400 font-bold">Location</p>
                <p className="text-lg text-slate-200">George, Garden Route, South Africa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

