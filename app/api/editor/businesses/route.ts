import { NextRequest, NextResponse } from 'next/server';
import { businessPoints } from '@/lib/businessData';
import { logError, logInfo } from '@/lib/logger';

// In-memory store for editor changes
let editorBusinesses: any[] | null = null;

export async function GET() {
  try {
    if (editorBusinesses) {
      return NextResponse.json({ businesses: editorBusinesses });
    }

    // Convert static business data to editor format
    const businesses: any[] = [];
    let idCounter = 0;

    Object.entries(businessPoints).forEach(([locationId, locationBusinesses]) => {
      locationBusinesses.forEach((business) => {
        businesses.push({
          id: `business-${idCounter++}`,
          name: business.name,
          category: business.category,
          phone: business.phone,
          meta: business.meta,
          coords: business.coords,
          location: locationId,
          aiContent: business.aiContent || "",
        });
      });
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    logError('Error loading businesses:', error);
    return NextResponse.json({ businesses: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businesses } = body;

    if (!Array.isArray(businesses)) {
      return NextResponse.json(
        { error: 'Businesses must be an array' },
        { status: 400 }
      );
    }

    editorBusinesses = businesses;
    logInfo(`[Editor] Businesses updated: ${businesses.length} businesses at ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Businesses saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error saving businesses:', error);
    return NextResponse.json(
      { error: 'Failed to save businesses' },
      { status: 500 }
    );
  }
}
