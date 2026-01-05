"use client";

import { useState, useEffect } from "react";
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
  Star,
  MapPin,
  TrendingUp,
  Eye
} from "lucide-react";

interface SpotlightBusiness {
  id: string;
  name: string;
  category: string;
  phone: string;
  meta: string;
  coords: [number, number];
}

interface LocationSpotlight {
  locationId: string;
  locationName: string;
  businesses: SpotlightBusiness[];
}

const LOCATIONS = [
  { id: "george", name: "George" },
  { id: "wilderness", name: "Wilderness" },
  { id: "sedgefield", name: "Sedgefield" },
  { id: "knysna", name: "Knysna" },
  { id: "plett", name: "Plettenberg Bay" },
  { id: "mossel", name: "Mossel Bay" },
  { id: "oudtshoorn", name: "Oudtshoorn" },
];

const CATEGORIES = [
  "Stay", "Eat", "Coffee", "Car Hire", "Dental", "Optometrist", 
  "Spa", "Kids", "Tours", "Services"
];

// Sortable Spotlight Business Item
function SortableSpotlightItem({ 
  business,
  position,
  onEdit, 
  onRemove 
}: { 
  business: SpotlightBusiness;
  position: number;
  onEdit: (business: SpotlightBusiness) => void;
  onRemove: (id: string) => void;
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
      "Tours": "🗺️", "Services": "🔧"
    };
    return emojis[category] || "💎";
  };

  const getPositionBadge = (pos: number) => {
    if (pos === 0) return { label: "Featured", color: "from-amber-500 to-orange-500" };
    if (pos === 1) return { label: "2nd", color: "from-slate-400 to-slate-500" };
    return { label: "3rd", color: "from-amber-700 to-amber-800" };
  };

  const badge = getPositionBadge(position);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass border border-white/10 rounded-xl p-4 flex items-center gap-4 ${
        isDragging ? "shadow-2xl shadow-amber-500/20 border-amber-400/50" : ""
      } ${position === 0 ? "ring-2 ring-amber-400/30" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-bold text-white">{position + 1}</span>
      </div>

      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-lg">
        {getCategoryEmoji(business.category)}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{business.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            {business.category}
          </span>
          <span className="text-xs text-slate-500">{business.phone}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(business)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(business.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Add/Edit Spotlight Modal
function SpotlightEditModal({
  business,
  onSave,
  onClose,
}: {
  business: SpotlightBusiness | null;
  onSave: (business: SpotlightBusiness) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<SpotlightBusiness>(
    business || {
      id: `spotlight-${Date.now()}`,
      name: "",
      category: "Eat",
      phone: "",
      meta: "",
      coords: [22.4617, -33.9646],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-3xl w-full max-w-lg">
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {business ? "Edit Spotlight Business" : "Add to Spotlight"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., The Fat Fish George"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-amber-400/60"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="044 123 4567"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hours / Website</label>
            <input
              type="text"
              value={formData.meta}
              onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
              placeholder="08:00-17:00 or website.co.za"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-white border border-amber-400/50 hover:bg-amber-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Location Spotlight Card
function LocationSpotlightCard({
  spotlight,
  onUpdate,
}: {
  spotlight: LocationSpotlight;
  onUpdate: (locationId: string, businesses: SpotlightBusiness[]) => void;
}) {
  const [editingBusiness, setEditingBusiness] = useState<SpotlightBusiness | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = spotlight.businesses.findIndex((b) => b.id === active.id);
      const newIndex = spotlight.businesses.findIndex((b) => b.id === over.id);
      const newBusinesses = arrayMove(spotlight.businesses, oldIndex, newIndex);
      onUpdate(spotlight.locationId, newBusinesses);
    }
  };

  const handleEdit = (business: SpotlightBusiness) => {
    setEditingBusiness(business);
    setIsAddingNew(false);
    setShowModal(true);
  };

  const handleRemove = (id: string) => {
    if (confirm("Remove this business from the spotlight?")) {
      const newBusinesses = spotlight.businesses.filter((b) => b.id !== id);
      onUpdate(spotlight.locationId, newBusinesses);
    }
  };

  const handleSave = (business: SpotlightBusiness) => {
    let newBusinesses: SpotlightBusiness[];
    if (isAddingNew) {
      newBusinesses = [...spotlight.businesses, business];
    } else {
      const index = spotlight.businesses.findIndex((b) => b.id === business.id);
      newBusinesses = [...spotlight.businesses];
      newBusinesses[index] = business;
    }
    onUpdate(spotlight.locationId, newBusinesses);
    setShowModal(false);
    setEditingBusiness(null);
  };

  const handleAddNew = () => {
    setEditingBusiness(null);
    setIsAddingNew(true);
    setShowModal(true);
  };

  return (
    <div className="glass border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{spotlight.locationName}</h3>
            <p className="text-xs text-slate-400">{spotlight.businesses.length} featured businesses</p>
          </div>
        </div>
        {spotlight.businesses.length < 3 && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Businesses */}
      <div className="p-4">
        {spotlight.businesses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-3">No spotlight businesses for this location</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Add first spotlight
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={spotlight.businesses.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {spotlight.businesses.map((business, index) => (
                  <SortableSpotlightItem
                    key={business.id}
                    business={business}
                    position={index}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <SpotlightEditModal
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

import { logError } from "@/lib/logger";

export default function SpotlightsEditor() {
  const [spotlights, setSpotlights] = useState<LocationSpotlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpotlights();
  }, []);

  const loadSpotlights = async () => {
    setLoading(true);
    try {
      const savedSpotlights = localStorage.getItem("editor-spotlights");
      if (savedSpotlights) {
        setSpotlights(JSON.parse(savedSpotlights));
      } else {
        const response = await fetch("/api/editor/spotlights");
        if (response.ok) {
          const data = await response.json();
          setSpotlights(data.spotlights || []);
        }
      }
    } catch (error) {
      logError("Failed to load spotlights:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSpotlights = (newSpotlights: LocationSpotlight[]) => {
    setSpotlights(newSpotlights);
    localStorage.setItem("editor-spotlights", JSON.stringify(newSpotlights));
    fetch("/api/editor/spotlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlights: newSpotlights }),
    }).catch(logError);
  };

  const handleUpdateLocation = (locationId: string, businesses: SpotlightBusiness[]) => {
    const newSpotlights = spotlights.map((s) =>
      s.locationId === locationId ? { ...s, businesses } : s
    );
    saveSpotlights(newSpotlights);
  };

  // Calculate total stats
  const totalSpotlights = spotlights.reduce((sum, s) => sum + s.businesses.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Spotlight Editor</h1>
            <p className="text-slate-400">
              Drag to reorder featured businesses. Position 1 is the main featured spot.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">{totalSpotlights} total spotlights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass border border-white/10 rounded-2xl p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">How Spotlights Work</h3>
          <p className="text-sm text-slate-400">
            Each location can have up to 3 spotlight businesses. The first position is the "Featured" spot 
            and gets the most visibility. Drag businesses to reorder their priority. Analytics are tracked 
            separately and won't be affected by reordering.
          </p>
        </div>
      </div>

      {/* Spotlights Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading spotlights...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {spotlights.map((spotlight) => (
            <LocationSpotlightCard
              key={spotlight.locationId}
              spotlight={spotlight}
              onUpdate={handleUpdateLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
