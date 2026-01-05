import { supabaseAdmin } from './supabase';
import type { BlogPost } from '@/app/blogs/posts';

// Blog operations
export const dbBlogs = {
  async getAll(): Promise<BlogPost[]> {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(blog: Omit<BlogPost, 'id'>): Promise<BlogPost> {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .insert([blog])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(slug: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async delete(slug: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('slug', slug);

    if (error) throw error;
    return true;
  }
};

// Featured blog operations
export const dbFeatured = {
  async get(): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('featured_blog')
      .select('blog_slug')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.blog_slug || null;
  },

  async set(slug: string): Promise<void> {
    // First, delete existing featured blog
    await supabaseAdmin.from('featured_blog').delete();

    // Then insert new one
    const { error } = await supabaseAdmin
      .from('featured_blog')
      .insert([{ blog_slug: slug }]);

    if (error) throw error;
  }
};

// Business operations
export type AdminBusiness = {
  id?: string;
  name: string;
  category: string;
  town: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  meta?: Record<string, any>;
  clicks: number;
  calls: number;
  websites: number;
  directions: number;
  shares: number;
};

export const dbBusinesses = {
  async getAll(): Promise<AdminBusiness[]> {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getByName(name: string): Promise<AdminBusiness | null> {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(business: AdminBusiness): Promise<AdminBusiness> {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert([business])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(name: string, updates: Partial<AdminBusiness>): Promise<AdminBusiness | null> {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('name', name)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async delete(name: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('name', name);

    if (error) throw error;
    return true;
  }
};

// Categories operations
export type Category = {
  id?: string;
  name: string;
  display_order: number;
};

export const dbCategories = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(name: string, updates: Partial<Category>): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('name', name)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async delete(name: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
    return true;
  }
};

// Metrics operations
export type BusinessMetric = {
  business_name: string;
  date: string;
  clicks: number;
  directions: number;
  calls: number;
  websites: number;
  shares: number;
};

export type BlogMetric = {
  blog_slug: string;
  date: string;
  reads: number;
  shares: number;
};

export const dbMetrics = {
  // Business metrics
  async getBusinessMetrics(
    businessName?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BusinessMetric[]> {
    let query = supabaseAdmin.from('business_metrics').select('*');

    if (businessName) {
      query = query.eq('business_name', businessName);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date');

    if (error) throw error;
    return data || [];
  },

  async addBusinessMetric(metric: BusinessMetric): Promise<void> {
    const { error } = await supabaseAdmin
      .from('business_metrics')
      .upsert([metric], { onConflict: 'business_name,date' });

    if (error) throw error;
  },

  // Blog metrics
  async getBlogMetrics(
    blogSlug?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BlogMetric[]> {
    let query = supabaseAdmin.from('blog_metrics').select('*');

    if (blogSlug) {
      query = query.eq('blog_slug', blogSlug);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date');

    if (error) throw error;
    return data || [];
  },

  async addBlogMetric(metric: BlogMetric): Promise<void> {
    const { error } = await supabaseAdmin
      .from('blog_metrics')
      .upsert([metric], { onConflict: 'blog_slug,date' });

    if (error) throw error;
  }
};

// User data operations (Favorites and Trips)
export type UserFavorite = {
  user_id: string;
  town_id: string;
  business_name: string;
  created_at?: string;
};

export type UserTrip = {
  id?: string;
  user_id: string;
  name: string;
  stops: any[];
  created_at?: string;
  updated_at?: string;
};

export const dbUser = {
  // Favorites
  async getFavorites(userId: string): Promise<UserFavorite[]> {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist yet, return empty list instead of crashing
      if (error.code === '42P01') return [];
      throw error;
    }
    return data || [];
  },

  async addFavorite(favorite: UserFavorite): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_favorites')
      .insert([favorite]);

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      if (error.code === '42P01') return; // Silent fail if table missing
      throw error;
    }
  },

  async removeFavorite(userId: string, townId: string, businessName: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .match({ user_id: userId, town_id: townId, business_name: businessName });

    if (error) {
      if (error.code === '42P01') return;
      throw error;
    }
  },

  async syncFavorites(userId: string, localFavorites: { townId: string; businessName: string }[]): Promise<void> {
    const favorites = localFavorites.map(f => ({
      user_id: userId,
      town_id: f.townId,
      business_name: f.businessName
    }));

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .upsert(favorites, { onConflict: 'user_id,town_id,business_name' });

    if (error && error.code !== '42P01') throw error;
  },

  // Trips
  async getTrips(userId: string): Promise<UserTrip[]> {
    const { data, error } = await supabaseAdmin
      .from('user_trips')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return data || [];
  },

  async saveTrip(trip: UserTrip): Promise<UserTrip> {
    const { data, error } = await supabaseAdmin
      .from('user_trips')
      .upsert([trip])
      .select()
      .single();

    if (error && error.code !== '42P01') throw error;
    return data || trip;
  },

  async deleteTrip(userId: string, tripId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_trips')
      .delete()
      .match({ user_id: userId, id: tripId });

    if (error && error.code !== '42P01') throw error;
  },

  async syncTrips(userId: string, localTrips: any[]): Promise<void> {
    const trips = localTrips.map(t => ({
      user_id: userId,
      name: t.name,
      stops: t.stops,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
      .from('user_trips')
      .upsert(trips);

    if (error && error.code !== '42P01') throw error;
  }
};
