import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { dbBusinesses, dbCategories } from "@/lib/database";

export async function GET() {
  try {
    // Get all categories from database
    const categories = await dbCategories.getAll();

    // Get businesses to calculate counts and towns per category
    const businesses = await dbBusinesses.getAll();
    const categoryStats = new Map<string, { count: number; towns: Set<string> }>();

    businesses.forEach((b) => {
      if (!categoryStats.has(b.category)) {
        categoryStats.set(b.category, { count: 0, towns: new Set() });
      }
      const entry = categoryStats.get(b.category)!;
      entry.count += 1;
      entry.towns.add(b.town);
    });

    // Combine database categories with calculated stats
    const enrichedCategories = categories.map((cat) => {
      const stats = categoryStats.get(cat.name) || { count: 0, towns: new Set() };
      return {
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order,
        count: stats.count,
        towns: Array.from(stats.towns).sort(),
      };
    });

    return NextResponse.json({ categories: enrichedCategories });
  } catch (error) {
    logError('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

