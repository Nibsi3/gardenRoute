import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/logger';

// Default about page sections
const defaultSections = [
  {
    id: "hero-1",
    type: "hero",
    title: "Hero Section",
    content: {
      badge: "The Top 3 Best Businesses in Every Category",
      headline: "Your Guide to the Best of the Garden Route",
      subheadline: "I've personally explored every corner of the Garden Route to bring you the top 3 businesses in each category, in every town. No algorithms, no paid rankings—just honest recommendations from someone who lives here and knows what's worth your time."
    },
    visible: true
  },
  {
    id: "trust-1",
    type: "grid",
    title: "Why Trust Section",
    content: {
      gridTitle: "Why Trust These Recommendations?",
      gridSubtitle: "",
      items: [
        { title: "Personally Vetted", description: "Every business is visited and evaluated by me—no paid placements, no algorithms." },
        { title: "Local Knowledge", description: "I live here. These are the places I recommend to friends and family." },
        { title: "Quality Over Quantity", description: "Only the top 3 in each category make the cut. If it's listed, it's worth your time." },
        { title: "Always Updated", description: "Recommendations evolve as businesses change. What's best today stays best." }
      ]
    },
    visible: true
  },
  {
    id: "towns-1",
    type: "grid",
    title: "Towns Section",
    content: {
      gridTitle: "7 Towns, Endless Discoveries",
      gridSubtitle: "Each town has its own character—and its own top businesses.",
      items: [
        { title: "George", description: "The commercial hub with the airport—your gateway to the Garden Route." },
        { title: "Wilderness", description: "Peaceful beach village with lagoons, rivers, and indigenous forests." },
        { title: "Sedgefield", description: "South Africa's only official 'slow town'—where life moves at its own pace." },
        { title: "Knysna", description: "Vibrant waterfront town famous for oysters and the iconic Knysna Heads." },
        { title: "Plettenberg Bay", description: "Upmarket beach resort with pristine beaches and marine life." },
        { title: "Mossel Bay", description: "Historic harbour town where European explorers first landed." },
        { title: "Oudtshoorn", description: "Klein Karoo gateway—ostrich farms, Cango Caves, and dramatic passes." }
      ]
    },
    visible: true
  },
  {
    id: "categories-1",
    type: "grid",
    title: "Categories Section",
    content: {
      gridTitle: "Categories We Cover",
      gridSubtitle: "From where to stay to where to eat—we've got you covered.",
      items: [
        { title: "Stay", description: "Hotels, guest houses, and resorts handpicked for comfort and location." },
        { title: "Eat", description: "Restaurants serving the best local cuisine and international flavours." },
        { title: "Coffee", description: "Specialty coffee shops and roasteries worth the detour." },
        { title: "Car Hire", description: "Reliable vehicle rentals to explore the coast at your own pace." },
        { title: "Services", description: "From dental care to optometry—trusted local professionals." },
        { title: "Wellness", description: "Spas, wellness centres, and places to unwind." }
      ]
    },
    visible: true
  },
  {
    id: "steps-1",
    type: "steps",
    title: "How It Works",
    content: {
      steps: [
        { number: 1, title: "Pick a Town", description: "Click any town on the map to zoom in and see what's available." },
        { number: 2, title: "Choose a Category", description: "Filter by what you need—restaurants, hotels, coffee, services, and more." },
        { number: 3, title: "Discover the Best", description: "See the top 3 businesses, get directions, call directly, or read more." }
      ]
    },
    visible: true
  },
  {
    id: "cta-1",
    type: "cta",
    title: "Call to Action",
    content: {
      ctaTitle: "Ready to Explore?",
      ctaDescription: "Start discovering the best businesses the Garden Route has to offer.",
      primaryButton: "Open the Map",
      secondaryButton: "Read Our Blog"
    },
    visible: true
  }
];

// In-memory store for editor changes
let editorSections: any[] | null = null;

export async function GET() {
  try {
    if (editorSections) {
      return NextResponse.json({ sections: editorSections });
    }

    return NextResponse.json({ sections: defaultSections });
  } catch (error) {
    logError('Error loading about sections:', error);
    return NextResponse.json({ sections: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Sections must be an array' },
        { status: 400 }
      );
    }

    editorSections = sections;
    logInfo(`[Editor] About page updated: ${sections.length} sections at ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Sections saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error saving about sections:', error);
    return NextResponse.json(
      { error: 'Failed to save sections' },
      { status: 500 }
    );
  }
}
