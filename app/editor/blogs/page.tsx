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
  Image as ImageIcon,
  Eye,
  Search,
  Filter,
  Star,
  Crown,
  Upload,
  Link,
  Camera
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  cover: string;
  tags: string[];
  status: string;
  featuredGlobal?: boolean;
  featuredInCategory?: boolean;
}

// Sortable Blog Item Component
function SortableBlogItem({ 
  post, 
  onEdit, 
  onDelete,
  onToggleFeatured 
}: { 
  post: BlogPost; 
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, type: "global" | "category") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass border border-white/10 rounded-xl p-3 flex items-center gap-3 overflow-hidden ${
        isDragging ? "shadow-2xl shadow-violet-500/20 border-violet-400/50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
        {post.cover ? (
          <img src={post.cover} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white truncate text-sm">{post.title}</h3>
          {post.featuredGlobal && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3 h-3" /> Featured
            </span>
          )}
          {post.featuredInCategory && !post.featuredGlobal && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
              <Star className="w-3 h-3" /> Cat Featured
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">{post.excerpt}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
            {post.category}
          </span>
          <span className="text-[10px] text-slate-500">{post.date}</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => onToggleFeatured(post.id, "global")}
          className={`p-1.5 rounded-lg transition ${post.featuredGlobal ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10 text-slate-400 hover:text-amber-400"}`}
          title={post.featuredGlobal ? "Remove from global featured" : "Set as global featured"}
        >
          <Crown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggleFeatured(post.id, "category")}
          className={`p-1.5 rounded-lg transition ${post.featuredInCategory ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/10 text-slate-400 hover:text-violet-400"}`}
          title={post.featuredInCategory ? "Remove from category featured" : "Set as category featured"}
        >
          <Star className="w-3.5 h-3.5" />
        </button>
        <a
          href={`/blogs/${post.slug}`}
          target="_blank"
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <Eye className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => onEdit(post)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Blog Edit Modal
function BlogEditModal({
  post,
  onSave,
  onClose,
}: {
  post: BlogPost | null;
  onSave: (post: BlogPost) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<BlogPost>(
    post || {
      id: `blog-${Date.now()}`,
      title: "",
      slug: "",
      excerpt: "",
      category: "Stay",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      author: "Editor",
      cover: "",
      tags: [],
      status: "Published",
    }
  );
  const [tagInput, setTagInput] = useState("");
  const [imageUploadMode, setImageUploadMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Convert to base64 for local storage/preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, cover: base64 });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logError("Upload failed:", error);
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-generate slug from title if empty
    const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    onSave({ ...formData, slug });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {post ? "Edit Blog Post" : "New Blog Post"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image</label>
            
            {/* Image Source Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageUploadMode("url")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  imageUploadMode === "url"
                    ? "bg-violet-500/20 border-violet-400/50 text-violet-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageUploadMode("upload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  imageUploadMode === "upload"
                    ? "bg-violet-500/20 border-violet-400/50 text-violet-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>

            {/* URL Input */}
            {imageUploadMode === "url" && (
              <div className="flex gap-3">
                <input
                  type="url"
                  value={formData.cover}
                  onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                  placeholder="https://images.unsplash.com/... or any image URL"
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
                />
              </div>
            )}

            {/* File Upload */}
            {imageUploadMode === "upload" && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`flex items-center justify-center gap-3 px-4 py-6 rounded-xl border-2 border-dashed transition ${
                  isUploading ? "border-violet-400/50 bg-violet-500/10" : "border-white/20 bg-white/5 hover:border-violet-400/30"
                }`}>
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-violet-300">
                      <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400" />
                      <span className="text-slate-400">Click or drag to upload an image</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {formData.cover && (
              <div className="mt-3 relative group">
                <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-800">
                  <img src={formData.cover} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cover: "" })}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter blog title..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Slug (auto-generated if empty)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="blog-post-slug"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Excerpt *</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              required
              rows={3}
              placeholder="Brief description of the blog post..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60 resize-none"
            />
          </div>

          {/* Category & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-violet-400/60"
              >
                <option value="Stay" className="bg-slate-800">Stay</option>
                <option value="Eat" className="bg-slate-800">Eat</option>
                <option value="Coffee" className="bg-slate-800">Coffee</option>
                <option value="Car Hire" className="bg-slate-800">Car Hire</option>
                <option value="Tours" className="bg-slate-800">Tours</option>
                <option value="Services" className="bg-slate-800">Services</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Author name"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags (Location tags for filtering)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag (e.g., George, Knysna)"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-sm text-slate-300 border border-white/10"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
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
              className="flex-1 px-4 py-3 rounded-xl bg-violet-500 text-white border border-violet-400/50 hover:bg-violet-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { logError } from "@/lib/logger";

export default function BlogsEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Load posts from API or local storage
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Try to load from localStorage first (for editor changes)
      const savedPosts = localStorage.getItem("editor-blogs");
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      } else {
        // Load from the actual posts file via API
        const response = await fetch("/api/editor/blogs");
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      }
    } catch (error) {
      logError("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePosts = (newPosts: BlogPost[]) => {
    setPosts(newPosts);
    localStorage.setItem("editor-blogs", JSON.stringify(newPosts));
    // Also save to API for persistence
    fetch("/api/editor/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: newPosts }),
    }).catch(logError);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = posts.findIndex((p) => p.id === active.id);
      const newIndex = posts.findIndex((p) => p.id === over.id);
      const newPosts = arrayMove(posts, oldIndex, newIndex);
      savePosts(newPosts);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      const newPosts = posts.filter((p) => p.id !== id);
      savePosts(newPosts);
    }
  };

  const handleSave = (post: BlogPost) => {
    const existingIndex = posts.findIndex((p) => p.id === post.id);
    let newPosts: BlogPost[];
    if (existingIndex >= 0) {
      newPosts = [...posts];
      newPosts[existingIndex] = post;
    } else {
      newPosts = [post, ...posts];
    }
    savePosts(newPosts);
    setShowModal(false);
    setEditingPost(null);
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setShowModal(true);
  };

  const handleToggleFeatured = (id: string, type: "global" | "category") => {
    const newPosts = posts.map((p) => {
      if (p.id !== id) return p;
      if (type === "global") {
        return { ...p, featuredGlobal: !p.featuredGlobal };
      } else {
        return { ...p, featuredInCategory: !p.featuredInCategory };
      }
    });
    savePosts(newPosts);
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || post.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(posts.map((p) => p.category)));

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="glass border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Editor</h1>
          <p className="text-slate-400">Drag to reorder, click to edit. {posts.length} posts total.</p>
        </div>
        <a
          href="/editor/blogs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white border border-violet-400/50 hover:bg-violet-400 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          New Top 3 Post
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              !filterCategory
                ? "bg-violet-500/20 text-white border border-violet-400/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                filterCategory === cat
                  ? "bg-violet-500/20 text-white border border-violet-400/30"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No posts found</p>
          <button
            onClick={handleNewPost}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Create your first post
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredPosts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <SortableBlogItem
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Modal */}
      {showModal && (
        <BlogEditModal
          post={editingPost}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
}
