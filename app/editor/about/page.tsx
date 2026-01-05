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
  Type,
  Image as ImageIcon,
  List,
  LayoutGrid,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AboutSection {
  id: string;
  type: "hero" | "text" | "grid" | "steps" | "cta";
  title: string;
  content: any;
  visible: boolean;
}

// Sortable Section Item
function SortableSectionItem({ 
  section,
  onEdit, 
  onDelete,
  onToggleVisibility
}: { 
  section: AboutSection;
  onEdit: (section: AboutSection) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      hero: Type,
      text: Type,
      grid: LayoutGrid,
      steps: List,
      cta: Type,
    };
    const Icon = icons[type] || Type;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hero: "Hero Section",
      text: "Text Block",
      grid: "Grid Layout",
      steps: "Steps/Process",
      cta: "Call to Action",
    };
    return labels[type] || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass border rounded-xl p-4 flex items-center gap-4 ${
        isDragging ? "shadow-2xl shadow-rose-500/20 border-rose-400/50" : "border-white/10"
      } ${!section.visible ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 text-white">
        {getTypeIcon(section.type)}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{section.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
            {getTypeLabel(section.type)}
          </span>
          {!section.visible && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-400/30">
              Hidden
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleVisibility(section.id)}
          className={`p-2 rounded-lg hover:bg-white/10 transition ${
            section.visible ? "text-emerald-400" : "text-slate-500"
          }`}
          title={section.visible ? "Hide section" : "Show section"}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(section)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(section.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Section Edit Modal
function SectionEditModal({
  section,
  onSave,
  onClose,
}: {
  section: AboutSection | null;
  onSave: (section: AboutSection) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<AboutSection>(
    section || {
      id: `section-${Date.now()}`,
      type: "text",
      title: "",
      content: { text: "" },
      visible: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderContentEditor = () => {
    switch (formData.type) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Headline</label>
              <input
                type="text"
                value={formData.content.headline || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, headline: e.target.value } 
                })}
                placeholder="Your Guide to the Best of the Garden Route"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subheadline</label>
              <textarea
                value={formData.content.subheadline || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, subheadline: e.target.value } 
                })}
                rows={3}
                placeholder="I've personally explored every corner..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Badge Text</label>
              <input
                type="text"
                value={formData.content.badge || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, badge: e.target.value } 
                })}
                placeholder="The Top 3 Best Businesses in Every Category"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Section Title</label>
              <input
                type="text"
                value={formData.content.sectionTitle || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, sectionTitle: e.target.value } 
                })}
                placeholder="Why Trust These Recommendations?"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
              <textarea
                value={formData.content.text || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, text: e.target.value } 
                })}
                rows={6}
                placeholder="Enter your content here..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60 resize-none"
              />
            </div>
          </div>
        );

      case "grid":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Grid Title</label>
              <input
                type="text"
                value={formData.content.gridTitle || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, gridTitle: e.target.value } 
                })}
                placeholder="7 Towns, Endless Discoveries"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Grid Subtitle</label>
              <input
                type="text"
                value={formData.content.gridSubtitle || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, gridSubtitle: e.target.value } 
                })}
                placeholder="Each town has its own character..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Items (JSON format)</label>
              <textarea
                value={JSON.stringify(formData.content.items || [], null, 2)}
                onChange={(e) => {
                  try {
                    const items = JSON.parse(e.target.value);
                    setFormData({ 
                      ...formData, 
                      content: { ...formData.content, items } 
                    });
                  } catch {}
                }}
                rows={8}
                placeholder='[{"title": "George", "description": "The commercial hub..."}]'
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60 resize-none font-mono text-sm"
              />
            </div>
          </div>
        );

      case "steps":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Steps (JSON format)</label>
              <textarea
                value={JSON.stringify(formData.content.steps || [], null, 2)}
                onChange={(e) => {
                  try {
                    const steps = JSON.parse(e.target.value);
                    setFormData({ 
                      ...formData, 
                      content: { ...formData.content, steps } 
                    });
                  } catch {}
                }}
                rows={10}
                placeholder='[{"number": 1, "title": "Pick a Town", "description": "Click any town..."}]'
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60 resize-none font-mono text-sm"
              />
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CTA Title</label>
              <input
                type="text"
                value={formData.content.ctaTitle || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, ctaTitle: e.target.value } 
                })}
                placeholder="Ready to Explore?"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CTA Description</label>
              <input
                type="text"
                value={formData.content.ctaDescription || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, ctaDescription: e.target.value } 
                })}
                placeholder="Start discovering the best businesses..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Primary Button Text</label>
                <input
                  type="text"
                  value={formData.content.primaryButton || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    content: { ...formData.content, primaryButton: e.target.value } 
                  })}
                  placeholder="Open the Map"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Button Text</label>
                <input
                  type="text"
                  value={formData.content.secondaryButton || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    content: { ...formData.content, secondaryButton: e.target.value } 
                  })}
                  placeholder="Read Our Blog"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {section ? "Edit Section" : "New Section"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Section Name *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Hero Section"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Section Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-rose-400/60"
              >
                <option value="hero" className="bg-slate-800">Hero Section</option>
                <option value="text" className="bg-slate-800">Text Block</option>
                <option value="grid" className="bg-slate-800">Grid Layout</option>
                <option value="steps" className="bg-slate-800">Steps/Process</option>
                <option value="cta" className="bg-slate-800">Call to Action</option>
              </select>
            </div>
          </div>

          {/* Dynamic Content Editor */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Section Content</h3>
            {renderContentEditor()}
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
              className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white border border-rose-400/50 hover:bg-rose-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { logError } from "@/lib/logger";

export default function AboutEditor() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<AboutSection | null>(null);
  const [showModal, setShowModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const savedSections = localStorage.getItem("editor-about");
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      } else {
        const response = await fetch("/api/editor/about");
        if (response.ok) {
          const data = await response.json();
          setSections(data.sections || []);
        }
      }
    } catch (error) {
      logError("Failed to load sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSections = (newSections: AboutSection[]) => {
    setSections(newSections);
    localStorage.setItem("editor-about", JSON.stringify(newSections));
    fetch("/api/editor/about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: newSections }),
    }).catch(logError);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      saveSections(newSections);
    }
  };

  const handleEdit = (section: AboutSection) => {
    setEditingSection(section);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this section?")) {
      const newSections = sections.filter((s) => s.id !== id);
      saveSections(newSections);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const newSections = sections.map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    saveSections(newSections);
  };

  const handleSave = (section: AboutSection) => {
    const existingIndex = sections.findIndex((s) => s.id === section.id);
    let newSections: AboutSection[];
    if (existingIndex >= 0) {
      newSections = [...sections];
      newSections[existingIndex] = section;
    } else {
      newSections = [...sections, section];
    }
    saveSections(newSections);
    setShowModal(false);
    setEditingSection(null);
  };

  const handleNewSection = () => {
    setEditingSection(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">About Page Editor</h1>
          <p className="text-slate-400">Drag to reorder sections. Click eye icon to show/hide.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/about"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition font-medium"
          >
            <Eye className="w-4 h-4" />
            Preview
          </a>
          <button
            onClick={handleNewSection}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white border border-rose-400/50 hover:bg-rose-400 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading sections...</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No sections configured</p>
          <button
            onClick={handleNewSection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 hover:bg-rose-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add your first section
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Modal */}
      {showModal && (
        <SectionEditModal
          section={editingSection}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
}
