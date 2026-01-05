"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Plus, 
  X, 
  ChevronDown,
  Loader2,
  Building2,
  Globe,
  Phone,
  Clock,
  MapPin,
  Instagram,
  Facebook
} from "lucide-react";
import { businessPoints, BusinessPoint } from "@/lib/businessData";

type Top3Business = {
  name: string;
  tagline: string;
  phone: string;
  hours: string;
  location: string;
  website: string;
  instagram?: string;
  facebook?: string;
  features: string[];
  content: string;
  linkedBusinessId?: string;
};

type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  town: string;
  cover: string;
  tags: string[];
  businesses: Top3Business[];
  introContent: string;
};

const TOWNS = ["George", "Wilderness", "Knysna", "Plettenberg Bay", "Mossel Bay", "Sedgefield", "Oudtshoorn"];
const CATEGORIES = ["Eat", "Stay", "Coffee", "Car Hire", "Tours", "Services", "Healthcare", "Shopping"];

import { logError } from "@/lib/logger";

export default function NewBlogPost() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null); // Track which field is generating
  const [showBusinessDropdown, setShowBusinessDropdown] = useState<number | null>(null);
  const [availableBusinesses, setAvailableBusinesses] = useState<BusinessPoint[]>([]);
  const [businessSearch, setBusinessSearch] = useState("");
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    category: "Eat",
    author: "Garden Route Team",
    town: "George",
    cover: "",
    tags: [],
    businesses: [
      { name: "", tagline: "", phone: "", hours: "", location: "", website: "", features: [], content: "" },
      { name: "", tagline: "", phone: "", hours: "", location: "", website: "", features: [], content: "" },
      { name: "", tagline: "", phone: "", hours: "", location: "", website: "", features: [], content: "" },
    ],
    introContent: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [featureInputs, setFeatureInputs] = useState(["", "", ""]);

  // Load ALL businesses from ALL towns
  useEffect(() => {
    const allBusinesses: BusinessPoint[] = [];
    Object.keys(businessPoints).forEach(townKey => {
      const townBusinesses = businessPoints[townKey] || [];
      townBusinesses.forEach(b => {
        allBusinesses.push({ ...b, meta: townKey }); // Add town key as meta for reference
      });
    });
    // Sort alphabetically by name
    allBusinesses.sort((a, b) => a.name.localeCompare(b.name));
    setAvailableBusinesses(allBusinesses);
  }, []);

  // Auto-generate title and slug
  useEffect(() => {
    if (formData.town && formData.category) {
      const year = new Date().getFullYear();
      const title = `Top 3 ${formData.category} in ${formData.town} You Must Try in ${year}`;
      const slug = `top-3-${formData.category.toLowerCase().replace(/\s+/g, "-")}-${formData.town.toLowerCase()}-${year}`;
      setFormData(prev => ({ ...prev, title, slug }));
    }
  }, [formData.town, formData.category]);

  const handleBusinessSelect = (index: number, business: BusinessPoint) => {
    const newBusinesses = [...formData.businesses];
    newBusinesses[index] = {
      ...newBusinesses[index],
      name: business.name,
      phone: business.phone || "",
      location: business.address || "",
      website: business.website?.replace(/^https?:\/\//, "").replace(/^www\./, "") || "",
      instagram: business.instagram || "",
      linkedBusinessId: `${formData.town.toLowerCase()}-${business.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-")}`,
    };
    setFormData({ ...formData, businesses: newBusinesses });
    setShowBusinessDropdown(null);
  };

  // Generic AI generation function
  const generateAI = async (field: string, index?: number) => {
    const fieldKey = index !== undefined ? `${field}-${index}` : field;
    setGeneratingAI(fieldKey);
    
    try {
      let prompt = "";
      const business = index !== undefined ? formData.businesses[index] : null;
      
      switch (field) {
        case "title":
          prompt = `Generate a catchy, SEO-friendly blog title for a "Top 3 ${formData.category}" article about ${formData.town}, Garden Route, South Africa. Return only the title, no quotes.`;
          break;
        case "excerpt":
          prompt = `Write a compelling 2-sentence excerpt/description for a blog about the top 3 ${formData.category} businesses in ${formData.town}, Garden Route. Return only the excerpt text.`;
          break;
        case "tagline":
          if (!business?.name) { alert("Please enter a business name first"); setGeneratingAI(null); return; }
          prompt = `Generate a short, catchy tagline (5-7 words) for ${business.name}, a ${formData.category} business in ${formData.town}. Return only the tagline, no quotes.`;
          break;
        case "features":
          if (!business?.name) { alert("Please enter a business name first"); setGeneratingAI(null); return; }
          prompt = `Generate 5 short feature tags (2-3 words each) for ${business.name}, a ${formData.category} business. Return as comma-separated list only.`;
          break;
        case "content":
          if (!business?.name) { alert("Please enter a business name first"); setGeneratingAI(null); return; }
          prompt = `Write 3 detailed paragraphs about ${business.name}, a ${formData.category} business in ${formData.town}. Format with <p> tags.`;
          break;
        default:
          setGeneratingAI(null);
          return;
      }

      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: business?.name || formData.town,
          businessWebsite: business?.website || "",
          town: formData.town,
          category: formData.category,
          prompt,
        }),
      });

      const data = await response.json();
      if (data.success && data.content) {
        if (field === "title") {
          setFormData(prev => ({ ...prev, title: data.content.replace(/^["']|["']$/g, "") }));
        } else if (field === "excerpt") {
          setFormData(prev => ({ ...prev, excerpt: data.content }));
        } else if (field === "tagline" && index !== undefined) {
          const newBusinesses = [...formData.businesses];
          newBusinesses[index].tagline = data.content.replace(/^["']|["']$/g, "");
          setFormData({ ...formData, businesses: newBusinesses });
        } else if (field === "features" && index !== undefined) {
          const features = data.content.split(",").map((f: string) => f.trim()).filter((f: string) => f);
          const newBusinesses = [...formData.businesses];
          newBusinesses[index].features = [...newBusinesses[index].features, ...features];
          setFormData({ ...formData, businesses: newBusinesses });
        } else if (field === "content" && index !== undefined) {
          const newBusinesses = [...formData.businesses];
          newBusinesses[index].content = data.content;
          setFormData({ ...formData, businesses: newBusinesses });
        }
      } else {
        alert("Failed to generate. Please try again.");
      }
    } catch (error) {
      logError("AI generation error:", error);
      alert("Failed to generate. Please try again.");
    } finally {
      setGeneratingAI(null);
    }
  };

  const updateBusiness = (index: number, field: keyof Top3Business, value: string | string[]) => {
    const newBusinesses = [...formData.businesses];
    (newBusinesses[index] as any)[field] = value;
    setFormData({ ...formData, businesses: newBusinesses });
  };

  const addFeature = (index: number) => {
    if (featureInputs[index].trim()) {
      const newBusinesses = [...formData.businesses];
      newBusinesses[index].features = [...newBusinesses[index].features, featureInputs[index].trim()];
      setFormData({ ...formData, businesses: newBusinesses });
      const newInputs = [...featureInputs];
      newInputs[index] = "";
      setFeatureInputs(newInputs);
    }
  };

  const removeFeature = (businessIndex: number, featureIndex: number) => {
    const newBusinesses = [...formData.businesses];
    newBusinesses[businessIndex].features = newBusinesses[businessIndex].features.filter((_, i) => i !== featureIndex);
    setFormData({ ...formData, businesses: newBusinesses });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleSave = async () => {
    if (!formData.title || formData.businesses.some(b => !b.name)) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      // Create the blog post object matching the Top3 format
      const blogPost = {
        id: `blog-${Date.now()}`,
        title: formData.title,
        slug: formData.slug,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        author: formData.author,
        category: formData.category,
        excerpt: formData.excerpt,
        tags: [...formData.tags, formData.town, "Top 3"],
        cover: formData.cover || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80`,
        status: "Published",
        isTop3: true,
        town: formData.town,
        businesses: formData.businesses,
        content: formData.introContent,
      };

      // Save to localStorage and API
      const savedPosts = JSON.parse(localStorage.getItem("editor-blogs") || "[]");
      savedPosts.unshift(blogPost);
      localStorage.setItem("editor-blogs", JSON.stringify(savedPosts));

      await fetch("/api/editor/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: savedPosts }),
      });

      router.push("/editor/blogs");
    } catch (error) {
      logError("Save error:", error);
      alert("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/editor/blogs")}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">New Top 3 Blog Post</h1>
              <p className="text-slate-400">Create a curated list of the best businesses</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white border border-violet-400/50 hover:bg-violet-400 transition font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-4">Blog Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Town *</label>
            <select
              value={formData.town}
              onChange={(e) => setFormData({ ...formData, town: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-violet-400/60"
            >
              {TOWNS.map(town => (
                <option key={town} value={town} className="bg-slate-800">{town}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-violet-400/60"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Title</label>
            <button
              onClick={() => generateAI("title")}
              disabled={generatingAI === "title"}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
            >
              {generatingAI === "title" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Generate
            </button>
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-violet-400/60"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Excerpt *</label>
            <button
              onClick={() => generateAI("excerpt")}
              disabled={generatingAI === "excerpt"}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
            >
              {generatingAI === "excerpt" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Generate
            </button>
          </div>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            placeholder="Brief description of this Top 3 list..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image URL</label>
          <input
            type="url"
            value={formData.cover}
            onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-violet-400/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
              <button onClick={addTag} className="px-4 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-300 border border-white/10">
                    {tag}
                    <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Cards */}
      {[0, 1, 2].map((index) => (
        <div key={index} className="glass border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-sm">
                {index + 1}
              </span>
              <h2 className="text-lg font-semibold text-white">#{index + 1} Pick</h2>
            </div>
            <button
              onClick={() => generateAI("content", index)}
              disabled={generatingAI === `content-${index}` || !formData.businesses[index].name}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30 hover:from-violet-500/30 hover:to-purple-500/30 transition disabled:opacity-50"
            >
              {generatingAI === `content-${index}` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generatingAI === `content-${index}` ? "Generating..." : "AI Generate Content"}
            </button>
          </div>

          {/* Business Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Business Name * (Select from existing or type new)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.businesses[index].name}
                onChange={(e) => updateBusiness(index, "name", e.target.value)}
                onFocus={() => setShowBusinessDropdown(index)}
                placeholder="Select or type business name..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
              <button
                onClick={() => setShowBusinessDropdown(showBusinessDropdown === index ? null : index)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            {showBusinessDropdown === index && (
              <div className="absolute z-50 w-full mt-2 rounded-xl bg-slate-800 border border-white/20 shadow-2xl">
                <div className="p-2 border-b border-white/10">
                  <input
                    type="text"
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    placeholder="Search businesses..."
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableBusinesses
                    .filter(b => b.name.toLowerCase().includes(businessSearch.toLowerCase()) || 
                                 b.category.toLowerCase().includes(businessSearch.toLowerCase()))
                    .slice(0, 50)
                    .map((business, i) => (
                      <button
                        key={i}
                        onClick={() => { handleBusinessSelect(index, business); setBusinessSearch(""); }}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 transition border-b border-white/5 last:border-0"
                      >
                        <div className="font-medium text-white text-sm">{business.name}</div>
                        <div className="text-xs text-slate-400">{business.category} • {business.meta || "Garden Route"}</div>
                      </button>
                    ))}
                  {availableBusinesses.filter(b => b.name.toLowerCase().includes(businessSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-slate-400 text-sm">No businesses found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Tagline</label>
              <button
                onClick={() => generateAI("tagline", index)}
                disabled={generatingAI === `tagline-${index}`}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
              >
                {generatingAI === `tagline-${index}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI
              </button>
            </div>
            <input
              type="text"
              value={formData.businesses[index].tagline}
              onChange={(e) => updateBusiness(index, "tagline", e.target.value)}
              placeholder="e.g., Fresh Seafood & Ocean Views"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Phone
              </label>
              <input
                type="text"
                value={formData.businesses[index].phone}
                onChange={(e) => updateBusiness(index, "phone", e.target.value)}
                placeholder="044 874 7803"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="w-3 h-3 inline mr-1" /> Hours
              </label>
              <input
                type="text"
                value={formData.businesses[index].hours}
                onChange={(e) => updateBusiness(index, "hours", e.target.value)}
                placeholder="12:00 - 21:00"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MapPin className="w-3 h-3 inline mr-1" /> Location
              </label>
              <input
                type="text"
                value={formData.businesses[index].location}
                onChange={(e) => updateBusiness(index, "location", e.target.value)}
                placeholder="124A York St, George"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Globe className="w-3 h-3 inline mr-1" /> Website
              </label>
              <input
                type="text"
                value={formData.businesses[index].website}
                onChange={(e) => updateBusiness(index, "website", e.target.value)}
                placeholder="www.example.co.za"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Instagram className="w-3 h-3 inline mr-1" /> Instagram
              </label>
              <input
                type="text"
                value={formData.businesses[index].instagram || ""}
                onChange={(e) => updateBusiness(index, "instagram", e.target.value)}
                placeholder="username (without @)"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Facebook className="w-3 h-3 inline mr-1" /> Facebook
              </label>
              <input
                type="text"
                value={formData.businesses[index].facebook || ""}
                onChange={(e) => updateBusiness(index, "facebook", e.target.value)}
                placeholder="page name or URL"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Features</label>
              <button
                onClick={() => generateAI("features", index)}
                disabled={generatingAI === `features-${index}`}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
              >
                {generatingAI === `features-${index}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={featureInputs[index]}
                onChange={(e) => {
                  const newInputs = [...featureInputs];
                  newInputs[index] = e.target.value;
                  setFeatureInputs(newInputs);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature(index))}
                placeholder="Add feature (e.g., Fresh Seafood)"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
              <button onClick={() => addFeature(index)} className="px-4 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.businesses[index].features.map((feature, fi) => (
                <span key={fi} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-sm text-slate-200 border border-white/10">
                  {feature}
                  <button onClick={() => removeFeature(index, fi)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content (3 paragraphs about why this is a top pick)
            </label>
            <textarea
              value={formData.businesses[index].content}
              onChange={(e) => updateBusiness(index, "content", e.target.value)}
              rows={8}
              placeholder="Write or generate AI content about this business..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60 resize-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Use &lt;p&gt; tags to separate paragraphs</p>
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end gap-4 pb-8">
        <button
          onClick={() => router.push("/editor/blogs")}
          className="px-6 py-3 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white border border-violet-400/50 hover:bg-violet-400 transition font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Publishing..." : "Publish Blog Post"}
        </button>
      </div>
    </div>
  );
}
