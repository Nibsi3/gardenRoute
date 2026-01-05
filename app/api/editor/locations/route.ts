import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/logger';

// Default locations based on the Garden Route towns
const defaultLocations = [
  { id: "george", name: "George Central", coordinates: [22.461, -33.964] as [number, number], zoom: 13, description: "The commercial hub with the airport—your gateway to the Garden Route.", businessCount: 12 },
  { id: "wilderness", name: "Wilderness", coordinates: [22.577, -33.989] as [number, number], zoom: 14, description: "Peaceful beach village with lagoons, rivers, and indigenous forests.", businessCount: 8 },
  { id: "sedgefield", name: "Sedgefield", coordinates: [22.803, -34.018] as [number, number], zoom: 14, description: "South Africa's only official 'slow town'—where life moves at its own pace.", businessCount: 6 },
  { id: "knysna", name: "Knysna", coordinates: [23.046, -34.04] as [number, number], zoom: 13, description: "Vibrant waterfront town famous for oysters and the iconic Knysna Heads.", businessCount: 10 },
  { id: "plett", name: "Plettenberg Bay", coordinates: [23.371, -34.053] as [number, number], zoom: 13, description: "Upmarket beach resort with pristine beaches and marine life.", businessCount: 9 },
  { id: "mossel", name: "Mossel Bay", coordinates: [22.137, -34.183] as [number, number], zoom: 13, description: "Historic harbour town where European explorers first landed.", businessCount: 7 },
  { id: "oudtshoorn", name: "Oudtshoorn", coordinates: [22.203, -33.59] as [number, number], zoom: 13, description: "Klein Karoo gateway—ostrich farms, Cango Caves, and dramatic passes.", businessCount: 5 },
];

// In-memory store for editor changes
let editorLocations: any[] | null = null;

export async function GET() {
  try {
    if (editorLocations) {
      return NextResponse.json({ locations: editorLocations });
    }

    return NextResponse.json({ locations: defaultLocations });
  } catch (error) {
    logError('Error loading locations:', error);
    return NextResponse.json({ locations: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locations } = body;

    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Locations must be an array' },
        { status: 400 }
      );
    }

    editorLocations = locations;
    logInfo(`[Editor] Locations updated: ${locations.length} locations at ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Locations saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error saving locations:', error);
    return NextResponse.json(
      { error: 'Failed to save locations' },
      { status: 500 }
    );
  }
}
