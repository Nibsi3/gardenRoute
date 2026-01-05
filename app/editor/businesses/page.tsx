"use client";

import { useState, useEffect, useRef } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Building2,
  Phone,
  Clock,
  MapPin,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Business {
  id: string;
  name: string;
  category: string;
  phone: string;
  meta: string;
  coords: [number, number];
  location: string;
  aiContent?: string;
}

const CATEGORIES = [
  "Stay", "Eat", "Coffee", "Car Hire", "Dental", "Optometrist", 
  "Spa", "Kids", "Tours", "Services", "Shopping"
];

const LOCATIONS = [
  { id: "george", name: "George" },
  { id: "wilderness", name: "Wilderness" },
  { id: "sedgefield", name: "Sedgefield" },
  { id: "knysna", name: "Knysna" },
  { id: "plett", name: "Plettenberg Bay" },
  { id: "mossel", name: "Mossel Bay" },
  { id: "oudtshoorn", name: "Oudtshoorn" },
];

// Sortable Business Item
function SortableBusinessItem({ 
  business, 
  onEdit, 
  onDelete 
}: { 
  business: Business; 
  onEdit: (business: Business) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: business.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      "Stay": "🏨", "Eat": "🍴", "Coffee": "☕", "Car Hire": "🚗",
      "Dental": "🦷", "Optometrist": "👓", "Spa": "💆", "Kids": "👶",
      "Tours": "🗺️", "Services": "🔧", "Shopping": "🛍️"
    };
    return emojis[category] || "💎";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass border border-white/10 rounded-xl p-4 flex items-center gap-4 ${
        isDragging ? "shadow-2xl shadow-emerald-500/20 border-emerald-400/50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 text-xl">
        {getCategoryEmoji(business.category)}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{business.name}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {business.phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {business.meta}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {business.category}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
            {LOCATIONS.find(l => l.id === business.location)?.name || business.location}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(business)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(business.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Business Edit Modal with Map
function BusinessEditModal({
  business,
  onSave,
  onClose,
}: {
  business: Business | null;
  onSave: (business: Business) => void;
  onClose: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [formData, setFormData] = useState<Business>(
    business || {
      id: `business-${Date.now()}`,
      name: "",
      category: "Eat",
      phone: "",
      meta: "",
      coords: [22.4617, -33.9646],
      location: "george",
      aiContent: "",
    }
  );

  // Get location center for map
  const getLocationCenter = (locationId: string): [number, number] => {
    const centers: Record<string, [number, number]> = {
      george: [22.461, -33.964],
      wilderness: [22.577, -33.989],
      sedgefield: [22.803, -34.018],
      knysna: [23.046, -34.04],
      plett: [23.371, -34.053],
      mossel: [22.137, -34.183],
      oudtshoorn: [22.203, -33.59],
    };
    return centers[locationId] || centers.george;
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = business?.coords || getLocationCenter(formData.location);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: center,
      zoom: 15,
    });

    mapRef.current = map;

    const marker = new mapboxgl.Marker({ color: "#10b981", draggable: true })
      .setLngLat(center)
      .addTo(map);

    markerRef.current = marker;

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setFormData((prev) => ({
        ...prev,
        coords: [lngLat.lng, lngLat.lat],
      }));
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      setFormData((prev) => ({
        ...prev,
        coords: [lng, lat],
      }));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map when location changes
  const handleLocationChange = (locationId: string) => {
    setFormData({ ...formData, location: locationId });
    const center = getLocationCenter(locationId);
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center, zoom: 14 });
      markerRef.current.setLngLat(center);
      setFormData((prev) => ({ ...prev, location: locationId, coords: center }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {business ? "Edit Business" : "New Business"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., The Fat Fish George"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-emerald-400/60"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-emerald-400/60"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-slate-800">{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="044 123 4567"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hours / Website</label>
                <input
                  type="text"
                  value={formData.meta}
                  onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                  placeholder="08:00-17:00 or website.co.za"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.coords[0]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coords: [parseFloat(e.target.value), formData.coords[1]] 
                    })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-emerald-400/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.coords[1]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coords: [formData.coords[0], parseFloat(e.target.value)] 
                    })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-emerald-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">AI Description (Optional)</label>
                <textarea
                  value={formData.aiContent || ""}
                  onChange={(e) => setFormData({ ...formData, aiContent: e.target.value })}
                  rows={3}
                  placeholder="Auto-generated description for the business..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60 resize-none"
                />
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Click on map or drag marker to set exact location
              </label>
              <div 
                ref={mapContainerRef} 
                className="w-full h-80 rounded-xl overflow-hidden border border-white/10"
              />
              <p className="text-xs text-slate-500">
                Tip: Drag the green marker to the exact business location
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white border border-emerald-400/50 hover:bg-emerald-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { logError } from "@/lib/logger";

export default function BusinessesEditor() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const savedBusinesses = localStorage.getItem("editor-businesses");
      if (savedBusinesses) {
        setBusinesses(JSON.parse(savedBusinesses));
      } else {
        const response = await fetch("/api/editor/businesses");
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data.businesses || []);
        }
      }
    } catch (error) {
      logError("Failed to load businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinesses = (newBusinesses: Business[]) => {
    setBusinesses(newBusinesses);
    localStorage.setItem("editor-businesses", JSON.stringify(newBusinesses));
    fetch("/api/editor/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businesses: newBusinesses }),
    }).catch(logError);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = businesses.findIndex((b) => b.id === active.id);
      const newIndex = businesses.findIndex((b) => b.id === over.id);
      const newBusinesses = arrayMove(businesses, oldIndex, newIndex);
      saveBusinesses(newBusinesses);
    }
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this business?")) {
      const newBusinesses = businesses.filter((b) => b.id !== id);
      saveBusinesses(newBusinesses);
    }
  };

  const handleSave = (business: Business) => {
    const existingIndex = businesses.findIndex((b) => b.id === business.id);
    let newBusinesses: Business[];
    if (existingIndex >= 0) {
      newBusinesses = [...businesses];
      newBusinesses[existingIndex] = business;
    } else {
      newBusinesses = [...businesses, business];
    }
    saveBusinesses(newBusinesses);
    setShowModal(false);
    setEditingBusiness(null);
  };

  const handleNewBusiness = () => {
    setEditingBusiness(null);
    setShowModal(true);
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !filterLocation || business.location === filterLocation;
    const matchesCategory = !filterCategory || business.category === filterCategory;
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const categories = Array.from(new Set(businesses.map((b) => b.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Businesses Editor</h1>
          <p className="text-slate-400">Manage all businesses. Drag to reorder within locations.</p>
        </div>
        <button
          onClick={handleNewBusiness}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white border border-emerald-400/50 hover:bg-emerald-400 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Business
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition ${
              showFilters || filterLocation || filterCategory
                ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="glass border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterLocation(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    !filterLocation
                      ? "bg-emerald-500/20 text-white border border-emerald-400/30"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setFilterLocation(loc.id === filterLocation ? null : loc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterLocation === loc.id
                        ? "bg-emerald-500/20 text-white border border-emerald-400/30"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    !filterCategory
                      ? "bg-emerald-500/20 text-white border border-emerald-400/30"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterCategory === cat
                        ? "bg-emerald-500/20 text-white border border-emerald-400/30"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-slate-400">
          Showing <span className="text-white font-medium">{filteredBusinesses.length}</span> of {businesses.length} businesses
        </span>
      </div>

      {/* Businesses List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading businesses...</div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No businesses found</p>
          <button
            onClick={handleNewBusiness}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add a business
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredBusinesses.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredBusinesses.map((business) => (
                <SortableBusinessItem
                  key={business.id}
                  business={business}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Modal */}
      {showModal && (
        <BusinessEditModal
          business={editingBusiness}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingBusiness(null);
          }}
        />
      )}
    </div>
  );
}
