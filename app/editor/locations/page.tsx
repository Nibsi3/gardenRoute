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
  MapPin,
  Navigation
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  description: string;
  businessCount: number;
}

// Sortable Location Item
function SortableLocationItem({ 
  location, 
  onEdit, 
  onDelete 
}: { 
  location: Location; 
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass border border-white/10 rounded-xl p-4 flex items-center gap-4 ${
        isDragging ? "shadow-2xl shadow-amber-500/20 border-amber-400/50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white">{location.name}</h3>
        <p className="text-sm text-slate-400">{location.description || "No description"}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-500">
            {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {location.businessCount} businesses
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(location)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(location.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Location Edit Modal with Map Picker
function LocationEditModal({
  location,
  onSave,
  onClose,
}: {
  location: Location | null;
  onSave: (location: Location) => void;
  onClose: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [formData, setFormData] = useState<Location>(
    location || {
      id: `location-${Date.now()}`,
      name: "",
      coordinates: [22.4617, -33.9646], // Default to George
      zoom: 13,
      description: "",
      businessCount: 0,
    }
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: formData.coordinates,
      zoom: formData.zoom,
    });

    mapRef.current = map;

    // Add marker
    const marker = new mapboxgl.Marker({ color: "#f59e0b", draggable: true })
      .setLngLat(formData.coordinates)
      .addTo(map);

    markerRef.current = marker;

    // Update coordinates when marker is dragged
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setFormData((prev) => ({
        ...prev,
        coordinates: [lngLat.lng, lngLat.lat],
      }));
    });

    // Update coordinates when map is clicked
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      setFormData((prev) => ({
        ...prev,
        coordinates: [lng, lat],
      }));
    });

    // Update zoom when map zoom changes
    map.on("zoomend", () => {
      setFormData((prev) => ({
        ...prev,
        zoom: Math.round(map.getZoom()),
      }));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const centerOnCoordinates = () => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({
        center: formData.coordinates,
        zoom: formData.zoom,
      });
      markerRef.current.setLngLat(formData.coordinates);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {location ? "Edit Location" : "New Location"}
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Location Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., George, Knysna, Plett"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this location..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates[0]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordinates: [parseFloat(e.target.value), formData.coordinates[1]] 
                    })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates[1]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordinates: [formData.coordinates[0], parseFloat(e.target.value)] 
                    })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Default Zoom Level</label>
                <input
                  type="range"
                  min="10"
                  max="18"
                  value={formData.zoom}
                  onChange={(e) => setFormData({ ...formData, zoom: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Wide (10)</span>
                  <span className="text-amber-400 font-medium">{formData.zoom}</span>
                  <span>Close (18)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={centerOnCoordinates}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition"
              >
                <Navigation className="w-4 h-4" />
                Center Map on Coordinates
              </button>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Click on map or drag marker to set location
              </label>
              <div 
                ref={mapContainerRef} 
                className="w-full h-80 rounded-xl overflow-hidden border border-white/10"
              />
              <p className="text-xs text-slate-500">
                Tip: Drag the orange marker to precisely position the town center
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
              className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-white border border-amber-400/50 hover:bg-amber-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { logError } from "@/lib/logger";

export default function LocationsEditor() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showModal, setShowModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const savedLocations = localStorage.getItem("editor-locations");
      if (savedLocations) {
        setLocations(JSON.parse(savedLocations));
      } else {
        const response = await fetch("/api/editor/locations");
        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations || []);
        }
      }
    } catch (error) {
      logError("Failed to load locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLocations = (newLocations: Location[]) => {
    setLocations(newLocations);
    localStorage.setItem("editor-locations", JSON.stringify(newLocations));
    fetch("/api/editor/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: newLocations }),
    }).catch(logError);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((l) => l.id === active.id);
      const newIndex = locations.findIndex((l) => l.id === over.id);
      const newLocations = arrayMove(locations, oldIndex, newIndex);
      saveLocations(newLocations);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this location? This will also remove all businesses in this location.")) {
      const newLocations = locations.filter((l) => l.id !== id);
      saveLocations(newLocations);
    }
  };

  const handleSave = (location: Location) => {
    const existingIndex = locations.findIndex((l) => l.id === location.id);
    let newLocations: Location[];
    if (existingIndex >= 0) {
      newLocations = [...locations];
      newLocations[existingIndex] = location;
    } else {
      newLocations = [...locations, location];
    }
    saveLocations(newLocations);
    setShowModal(false);
    setEditingLocation(null);
  };

  const handleNewLocation = () => {
    setEditingLocation(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations Editor</h1>
          <p className="text-slate-400">Manage towns on the map. Drag to reorder display priority.</p>
        </div>
        <button
          onClick={handleNewLocation}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white border border-amber-400/50 hover:bg-amber-400 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No locations configured</p>
          <button
            onClick={handleNewLocation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add your first location
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={locations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {locations.map((location) => (
                <SortableLocationItem
                  key={location.id}
                  location={location}
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
        <LocationEditModal
          location={editingLocation}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
}
