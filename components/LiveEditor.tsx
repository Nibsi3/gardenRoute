"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  MapPin, 
  Star, 
  Building2,
  Edit2,
  ChevronDown,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Business {
  id: string;
  name: string;
  category: string;
  phone?: string;
  meta?: string;
  coords: [number, number];
  googleMapsUrl?: string;
  placeId?: string;
  address?: string;
  rating?: number;
  photos?: string[];
}

interface SpotlightBusiness extends Business {}

interface LiveEditorProps {
  isOpen: boolean;
  onClose: () => void;
  activeZoneId: string | null;
  activeZoneName: string;
  spotlights: SpotlightBusiness[];
  businesses: Business[];
  onUpdateSpotlights: (spotlights: SpotlightBusiness[]) => void;
  onUpdateBusinesses: (businesses: Business[]) => void;
  onSelectBusiness: (business: Business) => void;
}

const CATEGORIES = ["Stay", "Eat", "Coffee", "Car Hire", "Dental", "Optometrist", "Spa", "Kids", "Tours", "Services"];

// Sortable Spotlight Item
function SortableSpotlightItem({
  business,
  index,
  onEdit,
  onRemove,
}: {
  business: SpotlightBusiness;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: business.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      Stay: "🏨", Eat: "🍴", Coffee: "☕", "Car Hire": "🚗",
      Dental: "🦷", Optometrist: "👓", Spa: "💆", Kids: "👶",
      Tours: "🗺️", Services: "🔧",
    };
    return emojis[category] || "💎";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border transition ${
        isDragging ? "border-amber-400/50 bg-amber-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-sm">
        {index + 1}
      </div>
      <span className="text-base">{getCategoryEmoji(business.category)}</span>
      <span className="flex-1 text-sm text-white truncate">{business.name}</span>
      <button onClick={onEdit} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onRemove} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Quick Edit Form
function QuickEditForm({
  business,
  onSave,
  onCancel,
}: {
  business: SpotlightBusiness | null;
  onSave: (business: SpotlightBusiness) => void;
  onCancel: () => void;
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

  return (
    <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Business name"
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400/50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
          ))}
        </select>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Phone"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>
      <input
        type="text"
        value={formData.meta}
        onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
        placeholder="Hours (e.g., 08:00-17:00)"
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-400 transition flex items-center justify-center gap-1"
        >
          <Check className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  );
}

export default function LiveEditor({
  isOpen,
  onClose,
  activeZoneId,
  activeZoneName,
  spotlights,
  businesses,
  onUpdateSpotlights,
  onUpdateBusinesses,
  onSelectBusiness,
}: LiveEditorProps) {
  const [activeTab, setActiveTab] = useState<"spotlights" | "businesses">("spotlights");
  const [editingSpotlight, setEditingSpotlight] = useState<SpotlightBusiness | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [localSpotlights, setLocalSpotlights] = useState<SpotlightBusiness[]>(spotlights);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    // Ensure all spotlights have unique IDs
    const spotlightsWithIds = spotlights.map((s, i) => ({
      ...s,
      id: s.id || `${activeZoneId}-spotlight-${i}-${Date.now()}`
    }));
    setLocalSpotlights(spotlightsWithIds);
    setHasChanges(false);
  }, [spotlights, activeZoneId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localSpotlights.findIndex((s) => s.id === active.id);
      const newIndex = localSpotlights.findIndex((s) => s.id === over.id);
      const newSpotlights = arrayMove(localSpotlights, oldIndex, newIndex);
      setLocalSpotlights(newSpotlights);
      setHasChanges(true);
    }
  };

  const handleSaveSpotlight = (business: SpotlightBusiness) => {
    let newSpotlights: SpotlightBusiness[];
    if (isAddingNew) {
      newSpotlights = [...localSpotlights, business];
    } else {
      const index = localSpotlights.findIndex((s) => s.id === business.id);
      newSpotlights = [...localSpotlights];
      newSpotlights[index] = business;
    }
    setLocalSpotlights(newSpotlights);
    setEditingSpotlight(null);
    setIsAddingNew(false);
    setHasChanges(true);
  };

  const handleRemoveSpotlight = (id: string) => {
    const newSpotlights = localSpotlights.filter((s) => s.id !== id);
    setLocalSpotlights(newSpotlights);
    setHasChanges(true);
  };

  const handleApplyChanges = () => {
    onUpdateSpotlights(localSpotlights);
    setHasChanges(false);
    // Save to localStorage and API
    const allSpotlights = JSON.parse(localStorage.getItem("editor-spotlights") || "[]");
    const updatedSpotlights = allSpotlights.map((s: any) =>
      s.locationId === activeZoneId ? { ...s, businesses: localSpotlights } : s
    );
    localStorage.setItem("editor-spotlights", JSON.stringify(updatedSpotlights));
  };

  if (!isOpen || !activeZoneId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="absolute left-4 top-4 bottom-4 w-80 z-30 pointer-events-auto"
      >
        <div className="h-full glass border border-white/10 rounded-2xl overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Editor</h3>
                  <p className="text-[10px] text-slate-400">{activeZoneName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/5">
              <button
                onClick={() => setActiveTab("spotlights")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === "spotlights"
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Spotlights
              </button>
              <button
                onClick={() => setActiveTab("businesses")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === "businesses"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Businesses
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "spotlights" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Drag to reorder • Max 3 spotlights
                  </p>
                  {localSpotlights.length < 3 && !isAddingNew && !editingSpotlight && (
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>

                {/* Add/Edit Form */}
                {(isAddingNew || editingSpotlight) && (
                  <QuickEditForm
                    business={editingSpotlight}
                    onSave={handleSaveSpotlight}
                    onCancel={() => {
                      setEditingSpotlight(null);
                      setIsAddingNew(false);
                    }}
                  />
                )}

                {/* Spotlights List */}
                {!isAddingNew && !editingSpotlight && localSpotlights.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={localSpotlights.map((s, i) => s.id || `fallback-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {localSpotlights.map((spotlight, index) => (
                          <SortableSpotlightItem
                            key={spotlight.id || `spotlight-${index}`}
                            business={spotlight}
                            index={index}
                            onEdit={() => setEditingSpotlight(spotlight)}
                            onRemove={() => handleRemoveSpotlight(spotlight.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {localSpotlights.length === 0 && !isAddingNew && (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No spotlights yet. Add one above.
                  </div>
                )}
              </>
            )}

            {activeTab === "businesses" && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-3">
                  Click a business to view on map
                </p>
                {businesses.map((business) => (
                  <button
                    key={business.id || business.name}
                    onClick={() => onSelectBusiness(business)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-400/30 transition text-left"
                  >
                    <span className="text-base">
                      {business.category === "Stay" ? "🏨" :
                        business.category === "Eat" ? "🍴" :
                          business.category === "Coffee" ? "☕" :
                            business.category === "Car Hire" ? "🚗" : "💎"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{business.name}</p>
                      <p className="text-[10px] text-slate-500">{business.category}</p>
                    </div>
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Apply Button */}
          {hasChanges && (
            <div className="p-4 border-t border-white/10 bg-slate-900/80">
              <button
                onClick={handleApplyChanges}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-400 transition"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
