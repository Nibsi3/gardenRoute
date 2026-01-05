import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/logger';

// Default spotlights based on the current townSpotlights in AttentionMap
const defaultSpotlights = [
  {
    locationId: "george",
    locationName: "George",
    businesses: [
      { id: "george-1", name: "Protea Hotel King George", category: "Stay", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] as [number, number] },
      { id: "george-2", name: "Avis George Airport", category: "Car Hire", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] as [number, number] },
      { id: "george-3", name: "The Fat Fish George", category: "Eat", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] as [number, number] },
    ]
  },
  {
    locationId: "wilderness",
    locationName: "Wilderness",
    businesses: [
      { id: "wilderness-1", name: "The Wilderness Hotel", category: "Stay", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] as [number, number] },
      { id: "wilderness-2", name: "Wilderness Cafe", category: "Coffee", phone: "044 877 0550", meta: "08:00-17:00", coords: [22.5769, -33.9912] as [number, number] },
      { id: "wilderness-3", name: "Serendipity Restaurant", category: "Eat", phone: "044 877 0433", meta: "12:00-21:00", coords: [22.5801, -33.9941] as [number, number] },
    ]
  },
  {
    locationId: "sedgefield",
    locationName: "Sedgefield",
    businesses: [
      { id: "sedgefield-1", name: "Sedgefield Arms", category: "Stay", phone: "044 343 1417", meta: "07:00-22:00", coords: [22.8034, -34.0178] as [number, number] },
      { id: "sedgefield-2", name: "Sedgefield Coffee Hub", category: "Coffee", phone: "044 343 2110", meta: "07:30-16:00", coords: [22.8021, -34.0189] as [number, number] },
      { id: "sedgefield-3", name: "Sedgefield Deli", category: "Eat", phone: "044 343 1417", meta: "08:00-17:00", coords: [22.8034, -34.0178] as [number, number] },
    ]
  },
  {
    locationId: "knysna",
    locationName: "Knysna",
    businesses: [
      { id: "knysna-1", name: "The Lofts Boutique Hotel", category: "Stay", phone: "044 302 5710", meta: "24/7", coords: [23.0498, -34.0394] as [number, number] },
      { id: "knysna-2", name: "East Head Cafe", category: "Eat", phone: "044 384 0933", meta: "08:00-17:00", coords: [23.0612, -34.0456] as [number, number] },
      { id: "knysna-3", name: "Cafe Neo Knysna", category: "Coffee", phone: "044 382 0454", meta: "08:00-17:00", coords: [23.0465, -34.0356] as [number, number] },
    ]
  },
  {
    locationId: "plett",
    locationName: "Plettenberg Bay",
    businesses: [
      { id: "plett-1", name: "Beacon Island Resort", category: "Stay", phone: "044 533 1120", meta: "24/7", coords: [23.3712, -34.0534] as [number, number] },
      { id: "plett-2", name: "Bean There Plett", category: "Coffee", phone: "044 533 1140", meta: "07:00-16:00", coords: [23.3712, -34.0534] as [number, number] },
      { id: "plett-3", name: "The Table Restaurant", category: "Eat", phone: "044 533 0277", meta: "12:00-22:00", coords: [23.3698, -34.0528] as [number, number] },
    ]
  },
  {
    locationId: "mossel",
    locationName: "Mossel Bay",
    businesses: [
      { id: "mossel-1", name: "Protea Hotel Mossel Bay", category: "Stay", phone: "044 691 3738", meta: "24/7", coords: [22.1312, -34.1812] as [number, number] },
      { id: "mossel-2", name: "Bay Coffee Co", category: "Coffee", phone: "044 695 0880", meta: "08:00-17:00", coords: [22.1189, -34.1712] as [number, number] },
      { id: "mossel-3", name: "Cafe Gannet", category: "Eat", phone: "044 691 1885", meta: "08:00-21:00", coords: [22.1456, -34.1812] as [number, number] },
    ]
  },
  {
    locationId: "oudtshoorn",
    locationName: "Oudtshoorn",
    businesses: [
      { id: "oudtshoorn-1", name: "Buffelsdrift Game Lodge", category: "Stay", phone: "044 272 0106", meta: "24/7", coords: [22.2034, -33.5912] as [number, number] },
      { id: "oudtshoorn-2", name: "Oudtshoorn Coffee House", category: "Coffee", phone: "044 272 0111", meta: "07:30-17:00", coords: [22.2034, -33.5912] as [number, number] },
      { id: "oudtshoorn-3", name: "Jemima's Restaurant", category: "Eat", phone: "044 272 0808", meta: "12:00-21:00", coords: [22.2012, -33.5889] as [number, number] },
    ]
  },
];

// In-memory store for editor changes
let editorSpotlights: any[] | null = null;

export async function GET() {
  try {
    if (editorSpotlights) {
      return NextResponse.json({ spotlights: editorSpotlights });
    }

    return NextResponse.json({ spotlights: defaultSpotlights });
  } catch (error) {
    logError('Error loading spotlights:', error);
    return NextResponse.json({ spotlights: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spotlights } = body;

    if (!Array.isArray(spotlights)) {
      return NextResponse.json(
        { error: 'Spotlights must be an array' },
        { status: 400 }
      );
    }

    // Store the changes (analytics history is preserved separately)
    editorSpotlights = spotlights;
    
    // Log the change for audit trail
    logInfo(`[Editor] Spotlights updated at ${new Date().toISOString()}`);
    spotlights.forEach((s: any) => {
      logInfo(`  - ${s.locationName}: ${s.businesses.length} businesses`);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Spotlights saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error saving spotlights:', error);
    return NextResponse.json(
      { error: 'Failed to save spotlights' },
      { status: 500 }
    );
  }
}
