"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  X,
  Save,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Star,
  Building2,
  Check,
  Undo,
  Redo,
  ChevronRight,
  ChevronDown,
  Phone,
  Clock,
  Sparkles,
  Target,
  Navigation,
  Tag,
  Search,
  ArrowUp,
  ArrowDown,
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

// Types
interface Business {
  id: string;
  name: string;
  category: string;
  phone: string;
  meta: string;
  coords: [number, number];
}

interface Location {
  id: string;
  name: string;
  coords: [number, number];
  zoom: number;
  description: string;
  categories: string[];
}

interface HistoryState {
  locations: Location[];
  businesses: Record<string, Business[]>;
  spotlights: Record<string, Business[]>;
}

// All available categories
const ALL_CATEGORIES = ["Stay", "Eat", "Coffee", "Car Hire", "Dental", "Optometrist", "Spa", "Kids", "Tours", "Services"];

// Default data
const defaultLocations: Location[] = [
  { id: "george", name: "George", coords: [22.4617, -33.9646], zoom: 13, description: "The heart of the Garden Route", categories: ["Stay", "Eat", "Coffee", "Car Hire", "Dental"] },
  { id: "wilderness", name: "Wilderness", coords: [22.5801, -33.9941], zoom: 14, description: "Beach paradise", categories: ["Stay", "Eat", "Coffee"] },
  { id: "sedgefield", name: "Sedgefield", coords: [22.7967, -34.0333], zoom: 14, description: "Slow town", categories: ["Stay", "Eat", "Coffee"] },
  { id: "knysna", name: "Knysna", coords: [23.0486, -34.0356], zoom: 13, description: "Lagoon town", categories: ["Stay", "Eat", "Coffee", "Tours"] },
  { id: "plett", name: "Plettenberg Bay", coords: [23.3716, -34.0527], zoom: 13, description: "Beach resort", categories: ["Stay", "Eat", "Coffee", "Tours", "Spa"] },
  { id: "mosselBay", name: "Mossel Bay", coords: [22.1265, -34.1826], zoom: 13, description: "Historic harbour", categories: ["Stay", "Eat", "Coffee"] },
  { id: "oudtshoorn", name: "Oudtshoorn", coords: [22.2034, -33.5920], zoom: 13, description: "Ostrich capital", categories: ["Stay", "Eat", "Tours"] },
];

const defaultBusinesses: Record<string, Business[]> = {
  george: [
    { id: "gb1", category: "Stay", name: "Protea Hotel King George", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] },
    { id: "gb2", category: "Car Hire", name: "Avis George Airport", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] },
    { id: "gb3", category: "Eat", name: "The Fat Fish George", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] },
    { id: "gb4", category: "Coffee", name: "The Foundry Roasters", phone: "044 873 3444", meta: "07:00-16:30", coords: [22.4545, -33.9578] },
  ],
  wilderness: [
    { id: "wb1", category: "Stay", name: "The Wilderness Hotel", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] },
    { id: "wb2", category: "Coffee", name: "Wilderness Cafe", phone: "044 877 0550", meta: "08:00-17:00", coords: [22.5769, -33.9912] },
    { id: "wb3", category: "Eat", name: "Serendipity Restaurant", phone: "044 877 0433", meta: "12:00-21:00", coords: [22.5801, -33.9941] },
  ],
  knysna: [
    { id: "kb1", category: "Stay", name: "The Rex Hotel", phone: "044 382 2011", meta: "24/7", coords: [23.0486, -34.0356] },
    { id: "kb2", category: "Eat", name: "34 South", phone: "044 382 7331", meta: "09:00-22:00", coords: [23.0445, -34.0389] },
    { id: "kb3", category: "Coffee", name: "Ile de Pain", phone: "044 302 5707", meta: "07:00-16:00", coords: [23.0467, -34.0412] },
  ],
  sedgefield: [],
  plett: [],
  mosselBay: [],
  oudtshoorn: [],
};

const defaultSpotlights: Record<string, Business[]> = {
  george: [
    { id: "g1", category: "Stay", name: "Protea Hotel King George", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] },
    { id: "g2", category: "Car Hire", name: "Avis George Airport", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] },
    { id: "g3", category: "Eat", name: "The Fat Fish George", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] },
  ],
  wilderness: [
    { id: "w1", category: "Stay", name: "The Wilderness Hotel", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] },
    { id: "w2", category: "Coffee", name: "Wilderness Cafe", phone: "044 877 0550", meta: "08:00-17:00", coords: [22.5769, -33.9912] },
  ],
  knysna: [
    { id: "k1", category: "Stay", name: "The Rex Hotel", phone: "044 382 2011", meta: "24/7", coords: [23.0486, -34.0356] },
    { id: "k2", category: "Eat", name: "34 South", phone: "044 382 7331", meta: "09:00-22:00", coords: [23.0445, -34.0389] },
  ],
  sedgefield: [],
  plett: [],
  mosselBay: [],
  oudtshoorn: [],
};

// Helper: Get category emoji
const getCategoryEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    Stay: "🏨", Eat: "🍴", Coffee: "☕", "Car Hire": "🚗",
    Dental: "🦷", Optometrist: "👓", Spa: "💆", Kids: "👶",
    Tours: "🗺️", Services: "🔧",
  };
  return emojis[category] || "💎";
};

// Sortable Category Item
function SortableCategoryItem({ id, category, onRemove }: { id: string; category: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs">
      <GripVertical className="w-3 h-3 cursor-grab text-slate-500" {...attributes} {...listeners} />
      <span>{getCategoryEmoji(category)}</span>
      <span>{category}</span>
      <button onClick={onRemove} className="ml-1 hover:text-red-400 transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Sortable Spotlight Item
function SortableSpotlightItem({ id, spotlight, index, onRemove }: { id: string; spotlight: Business; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded-lg border border-amber-400/30 bg-amber-500/10">
      <GripVertical className="w-4 h-4 text-slate-500 cursor-grab flex-shrink-0" {...attributes} {...listeners} />
      <div className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300 flex-shrink-0">
        {index + 1}
      </div>
      <span className="text-sm flex-shrink-0">{getCategoryEmoji(spotlight.category)}</span>
      <span className="text-xs text-white truncate flex-1">{spotlight.name}</span>
      <button onClick={onRemove} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Editable Text Component
function EditableText({
  value,
  onChange,
  className = "",
  placeholder = "Click to edit...",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalValue(value); }, [value]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setLocalValue(value); setIsEditing(false); } }}
        className={`bg-violet-500/20 border border-violet-400/50 rounded px-2 py-1 outline-none w-full ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-violet-500/10 hover:outline hover:outline-2 hover:outline-violet-400/50 hover:outline-dashed rounded px-1 -mx-1 transition-all ${className}`}
    >
      {value || <span className="text-slate-500 italic">{placeholder}</span>}
    </span>
  );
}

// Main Live Editor Page
import { logError } from "@/lib/logger";

export default function LiveEditorPage() {
  // State
  const [locations, setLocations] = useState<Location[]>(defaultLocations);
  const [businesses, setBusinesses] = useState<Record<string, Business[]>>(defaultBusinesses);
  const [spotlights, setSpotlights] = useState<Record<string, Business[]>>(defaultSpotlights);
  
  // UI State
  const [activeTab, setActiveTab] = useState<"locations" | "businesses" | "spotlights">("locations");
  const [selectedLocation, setSelectedLocation] = useState<string>("george");
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ george: true });
  const [showAddSpotlightModal, setShowAddSpotlightModal] = useState(false);
  const [spotlightSearchQuery, setSpotlightSearchQuery] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessCategory, setNewBusinessCategory] = useState("Eat");
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        locations: JSON.parse(JSON.stringify(locations)),
        businesses: JSON.parse(JSON.stringify(businesses)),
        spotlights: JSON.parse(JSON.stringify(spotlights)),
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      locations: JSON.parse(JSON.stringify(locations)),
      businesses: JSON.parse(JSON.stringify(businesses)),
      spotlights: JSON.parse(JSON.stringify(spotlights)),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setHasChanges(true);
  }, [history, historyIndex, locations, businesses, spotlights]);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLocations(JSON.parse(JSON.stringify(prev.locations)));
      setBusinesses(JSON.parse(JSON.stringify(prev.businesses)));
      setSpotlights(JSON.parse(JSON.stringify(prev.spotlights)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLocations(JSON.parse(JSON.stringify(next.locations)));
      setBusinesses(JSON.parse(JSON.stringify(next.businesses)));
      setSpotlights(JSON.parse(JSON.stringify(next.spotlights)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Add new location
  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    saveToHistory();
    const newId = newLocationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const newLocation: Location = {
      id: newId,
      name: newLocationName,
      coords: [22.5, -33.9], // Default coords
      zoom: 13,
      description: "",
      categories: ["Stay", "Eat", "Coffee"],
    };
    setLocations([...locations, newLocation]);
    setBusinesses({ ...businesses, [newId]: [] });
    setSpotlights({ ...spotlights, [newId]: [] });
    setSelectedLocation(newId);
    setExpandedSections({ ...expandedSections, [newId]: true });
    setNewLocationName("");
  };

  // Delete location
  const handleDeleteLocation = (id: string) => {
    if (locations.length <= 1) {
      alert("Cannot delete the last location");
      return;
    }
    if (!confirm(`Delete "${locations.find(l => l.id === id)?.name}"? This will also delete all businesses and spotlights.`)) return;
    saveToHistory();
    setLocations(locations.filter(loc => loc.id !== id));
    const newBusinesses = { ...businesses };
    delete newBusinesses[id];
    setBusinesses(newBusinesses);
    const newSpotlights = { ...spotlights };
    delete newSpotlights[id];
    setSpotlights(newSpotlights);
    if (selectedLocation === id) setSelectedLocation(locations.filter(l => l.id !== id)[0]?.id || "");
  };

  // Update location
  const handleUpdateLocation = (id: string, updates: Partial<Location>) => {
    saveToHistory();
    setLocations(locations.map(loc => loc.id === id ? { ...loc, ...updates } : loc));
  };

  // Add category to location
  const handleAddCategory = (locationId: string, category: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc || loc.categories.includes(category)) return;
    saveToHistory();
    setLocations(locations.map(l => l.id === locationId ? { ...l, categories: [...l.categories, category] } : l));
  };

  // Remove category from location
  const handleRemoveCategory = (locationId: string, category: string) => {
    saveToHistory();
    setLocations(locations.map(l => l.id === locationId ? { ...l, categories: l.categories.filter(c => c !== category) } : l));
  };

  // Reorder categories
  const handleReorderCategories = (locationId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;
    saveToHistory();
    const oldIndex = loc.categories.indexOf(active.id as string);
    const newIndex = loc.categories.indexOf(over.id as string);
    setLocations(locations.map(l => l.id === locationId ? { ...l, categories: arrayMove(l.categories, oldIndex, newIndex) } : l));
  };

  // Add business
  const handleAddBusiness = () => {
    if (!newBusinessName.trim() || !selectedLocation) return;
    saveToHistory();
    const newBusiness: Business = {
      id: `${selectedLocation}-${Date.now()}`,
      name: newBusinessName,
      category: newBusinessCategory,
      phone: "",
      meta: "",
      coords: [22.5, -33.9],
    };
    setBusinesses({
      ...businesses,
      [selectedLocation]: [...(businesses[selectedLocation] || []), newBusiness],
    });
    setSelectedBusiness(newBusiness.id);
    setNewBusinessName("");
  };

  // Update business
  const handleUpdateBusiness = (locationId: string, businessId: string, updates: Partial<Business>) => {
    saveToHistory();
    setBusinesses({
      ...businesses,
      [locationId]: (businesses[locationId] || []).map(biz => biz.id === businessId ? { ...biz, ...updates } : biz),
    });
  };

  // Delete business
  const handleDeleteBusiness = (locationId: string, businessId: string) => {
    saveToHistory();
    setBusinesses({
      ...businesses,
      [locationId]: (businesses[locationId] || []).filter(biz => biz.id !== businessId),
    });
    // Also remove from spotlights
    if (spotlights[locationId]) {
      setSpotlights({
        ...spotlights,
        [locationId]: spotlights[locationId].filter(s => s.id !== businessId),
      });
    }
    if (selectedBusiness === businessId) setSelectedBusiness(null);
  };

  // Add to spotlight from existing businesses
  const handleAddToSpotlight = (business: Business) => {
    if (!selectedLocation) return;
    if ((spotlights[selectedLocation]?.length || 0) >= 3) {
      alert("Maximum 3 spotlights per location");
      return;
    }
    if (spotlights[selectedLocation]?.find(s => s.id === business.id)) {
      alert("Already in spotlight");
      return;
    }
    saveToHistory();
    setSpotlights({
      ...spotlights,
      [selectedLocation]: [...(spotlights[selectedLocation] || []), business],
    });
    setShowAddSpotlightModal(false);
    setSpotlightSearchQuery("");
  };

  // Remove from spotlight
  const handleRemoveFromSpotlight = (businessId: string) => {
    if (!selectedLocation) return;
    saveToHistory();
    setSpotlights({
      ...spotlights,
      [selectedLocation]: (spotlights[selectedLocation] || []).filter(s => s.id !== businessId),
    });
  };

  // Reorder spotlights
  const handleReorderSpotlights = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedLocation) return;
    saveToHistory();
    const items = spotlights[selectedLocation] || [];
    const oldIndex = items.findIndex(s => s.id === active.id);
    const newIndex = items.findIndex(s => s.id === over.id);
    setSpotlights({
      ...spotlights,
      [selectedLocation]: arrayMove(items, oldIndex, newIndex),
    });
  };

  // Save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("editor-locations", JSON.stringify(locations));
      localStorage.setItem("editor-businesses", JSON.stringify(businesses));
      localStorage.setItem("editor-spotlights", JSON.stringify(spotlights));
      setHasChanges(false);
      alert("Changes saved successfully!");
    } catch (error) {
      logError("Save failed:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const currentLocation = locations.find(l => l.id === selectedLocation);
  const availableBusinessesForSpotlight = (businesses[selectedLocation] || [])
    .filter(b => !spotlights[selectedLocation]?.find(s => s.id === b.id))
    .filter(b => spotlightSearchQuery ? b.name.toLowerCase().includes(spotlightSearchQuery.toLowerCase()) : true);

  return (
    <div className="min-h-screen bg-[#04060c] text-white">
      {/* Top Toolbar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Live Editor</span>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-4">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 ml-2">
              {historyIndex + 1}/{history.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-300">Unsaved</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-white/10 h-[calc(100vh-57px)] overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {[
              { id: "locations", label: "Locations", icon: MapPin },
              { id: "businesses", label: "Businesses", icon: Building2 },
              { id: "spotlights", label: "Spotlights", icon: Star },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-violet-500/20 text-violet-300 border-b-2 border-violet-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* LOCATIONS TAB */}
            {activeTab === "locations" && (
              <>
                {/* Add Location */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="New location name..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                  />
                  <button
                    onClick={handleAddLocation}
                    disabled={!newLocationName.trim()}
                    className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Location List */}
                {locations.map(loc => (
                  <div
                    key={loc.id}
                    className={`rounded-xl border transition ${
                      selectedLocation === loc.id
                        ? "border-violet-400/50 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Location Header */}
                    <button
                      onClick={() => {
                        setSelectedLocation(loc.id);
                        setExpandedSections(prev => ({ ...prev, [loc.id]: !prev[loc.id] }));
                      }}
                      className="w-full flex items-center gap-3 p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{loc.name}</p>
                        <p className="text-[10px] text-slate-500">{loc.categories.length} categories • {(businesses[loc.id] || []).length} businesses</p>
                      </div>
                      {expandedSections[loc.id] ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedSections[loc.id] && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                            {/* Name */}
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
                              <EditableText
                                value={loc.name}
                                onChange={(name) => handleUpdateLocation(loc.id, { name })}
                                className="text-sm text-white block mt-1"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Description</label>
                              <EditableText
                                value={loc.description}
                                onChange={(description) => handleUpdateLocation(loc.id, { description })}
                                className="text-xs text-slate-300 block mt-1"
                                placeholder="Add description..."
                              />
                            </div>

                            {/* Categories - Sortable */}
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Tag className="w-3 h-3" /> Categories (drag to reorder)
                              </label>
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleReorderCategories(loc.id, e)}>
                                <SortableContext items={loc.categories} strategy={verticalListSortingStrategy}>
                                  <div className="flex flex-wrap gap-1">
                                    {loc.categories.map(cat => (
                                      <SortableCategoryItem
                                        key={cat}
                                        id={cat}
                                        category={cat}
                                        onRemove={() => handleRemoveCategory(loc.id, cat)}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                              
                              {/* Add Category Dropdown */}
                              {loc.categories.length < ALL_CATEGORIES.length && (
                                <select
                                  onChange={(e) => { if (e.target.value) handleAddCategory(loc.id, e.target.value); e.target.value = ""; }}
                                  className="mt-2 w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 focus:outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>+ Add category...</option>
                                  {ALL_CATEGORIES.filter(c => !loc.categories.includes(c)).map(cat => (
                                    <option key={cat} value={cat} className="bg-slate-800">{getCategoryEmoji(cat)} {cat}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete Location
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </>
            )}

            {/* BUSINESSES TAB */}
            {activeTab === "businesses" && (
              <>
                {/* Location selector */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-400/50"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800">{loc.name}</option>
                  ))}
                </select>

                {/* Add Business */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    placeholder="Business name..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddBusiness()}
                  />
                  <select
                    value={newBusinessCategory}
                    onChange={(e) => setNewBusinessCategory(e.target.value)}
                    className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    {(currentLocation?.categories || []).map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddBusiness}
                    disabled={!newBusinessName.trim()}
                    className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Business List */}
                {(businesses[selectedLocation] || []).map(biz => (
                  <div
                    key={biz.id}
                    className={`p-3 rounded-xl border transition ${
                      selectedBusiness === biz.id
                        ? "border-emerald-400/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                    onClick={() => setSelectedBusiness(selectedBusiness === biz.id ? null : biz.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-base flex-shrink-0">
                        {getCategoryEmoji(biz.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{biz.name}</p>
                        <p className="text-[10px] text-slate-500">{biz.category}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!spotlights[selectedLocation]?.find(s => s.id === biz.id) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToSpotlight(biz); }}
                            className="p-1.5 rounded-lg hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition"
                            title="Add to spotlight"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBusiness(selectedLocation, biz.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selectedBusiness === biz.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 pt-3 border-t border-white/10 space-y-2"
                      >
                        <div>
                          <label className="text-[10px] text-slate-500">Name</label>
                          <EditableText
                            value={biz.name}
                            onChange={(name) => handleUpdateBusiness(selectedLocation, biz.id, { name })}
                            className="text-sm text-white block"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">Category</label>
                          <select
                            value={biz.category}
                            onChange={(e) => handleUpdateBusiness(selectedLocation, biz.id, { category: e.target.value })}
                            className="w-full mt-1 px-2 py-1 rounded bg-white/10 text-xs text-white border-none outline-none"
                          >
                            {(currentLocation?.categories || []).map(cat => (
                              <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <EditableText
                            value={biz.phone}
                            onChange={(phone) => handleUpdateBusiness(selectedLocation, biz.id, { phone })}
                            className="text-xs text-slate-300"
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <EditableText
                            value={biz.meta}
                            onChange={(meta) => handleUpdateBusiness(selectedLocation, biz.id, { meta })}
                            className="text-xs text-slate-300"
                            placeholder="Hours"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}

                {(businesses[selectedLocation] || []).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No businesses yet. Add one above.
                  </div>
                )}
              </>
            )}

            {/* SPOTLIGHTS TAB */}
            {activeTab === "spotlights" && (
              <>
                {/* Location selector */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-400/50"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800">{loc.name}</option>
                  ))}
                </select>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {(spotlights[selectedLocation] || []).length}/3 spotlights
                  </p>
                  <button
                    onClick={() => setShowAddSpotlightModal(true)}
                    disabled={(spotlights[selectedLocation]?.length || 0) >= 3}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-3 h-3" /> Add from businesses
                  </button>
                </div>

                {/* Spotlight List - Sortable */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderSpotlights}>
                  <SortableContext items={(spotlights[selectedLocation] || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {(spotlights[selectedLocation] || []).map((spotlight, index) => (
                        <SortableSpotlightItem
                          key={spotlight.id}
                          id={spotlight.id}
                          spotlight={spotlight}
                          index={index}
                          onRemove={() => handleRemoveFromSpotlight(spotlight.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {(spotlights[selectedLocation] || []).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No spotlights yet. Click "Add from businesses" above.
                  </div>
                )}

                <p className="text-[10px] text-slate-600 text-center">
                  Drag to reorder. Position 1 = main featured.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Preview/Info */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Current Location Summary */}
            {currentLocation && (
              <div className="glass border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentLocation.name}</h2>
                    <p className="text-sm text-slate-400">{currentLocation.description || "No description"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-2xl font-bold text-white">{currentLocation.categories.length}</p>
                    <p className="text-xs text-slate-500">Categories</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-2xl font-bold text-white">{(businesses[selectedLocation] || []).length}</p>
                    <p className="text-xs text-slate-500">Businesses</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-2xl font-bold text-white">{(spotlights[selectedLocation] || []).length}</p>
                    <p className="text-xs text-slate-500">Spotlights</p>
                  </div>
                </div>

                {/* Categories Preview */}
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Active Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentLocation.categories.map(cat => (
                      <span key={cat} className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs">
                        {getCategoryEmoji(cat)} {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spotlights Preview */}
                {(spotlights[selectedLocation] || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">Featured Spotlights:</p>
                    <div className="flex gap-2">
                      {(spotlights[selectedLocation] || []).map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
                          <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300">{i + 1}</span>
                          <span className="text-xs text-white">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help */}
            <div className="glass border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Guide</h3>
              <div className="space-y-3 text-sm text-slate-400">
                <p><strong className="text-white">Locations:</strong> Add towns, manage their categories (drag to reorder), and delete if needed.</p>
                <p><strong className="text-white">Businesses:</strong> Add businesses to each location, assign categories, edit details.</p>
                <p><strong className="text-white">Spotlights:</strong> Feature up to 3 businesses per location. Drag to set order (1 = main).</p>
                <p><strong className="text-white">Undo/Redo:</strong> Use the toolbar buttons to undo or redo any changes.</p>
                <p><strong className="text-white">Save:</strong> Click Save to persist all changes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Spotlight Modal */}
      <AnimatePresence>
        {showAddSpotlightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddSpotlightModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Add to Spotlight</h3>
                <button onClick={() => setShowAddSpotlightModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={spotlightSearchQuery}
                    onChange={(e) => setSpotlightSearchQuery(e.target.value)}
                    placeholder="Search businesses..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50"
                  />
                </div>

                {/* Business List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableBusinessesForSpotlight.length === 0 ? (
                    <p className="text-center py-4 text-slate-500 text-sm">
                      {(businesses[selectedLocation] || []).length === 0
                        ? "No businesses in this location. Add some first."
                        : "All businesses are already in spotlight or no matches."}
                    </p>
                  ) : (
                    availableBusinessesForSpotlight.map(biz => (
                      <button
                        key={biz.id}
                        onClick={() => handleAddToSpotlight(biz)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/30 transition text-left"
                      >
                        <span className="text-lg">{getCategoryEmoji(biz.category)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{biz.name}</p>
                          <p className="text-[10px] text-slate-500">{biz.category}</p>
                        </div>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
