const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://itnpydhppfajlwofjouv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnB5ZGhwcGZhamx3b2Zqb3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MDk1NywiZXhwIjoyMDgyMzE2OTU3fQ.hl1KB06ikCs9US-Y8pgclHqVkV6jptTGPokIO_2p6Yg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import actual blog data - matching database schema
const POSTS = [
  {
    slug: "protea-hotel-king-george-default",
    title: "Protea Hotel King George: The Stay Default of George",
    excerpt: "How Protea Hotel King George keeps its 'default' position for accommodation near Fancourt and the airport.",
    content: `
      <h2>Why Protea King George Wins First Choice</h2>
      <p>Protea Hotel King George anchors the "default" for overnight stays in George thanks to its position between the airport, Fancourt, and the CBD. Business travelers choose it because they can land, check-in late, and be on the course or in a meeting within minutes.</p>
      <p>Key signals that keep Protea ahead:</p>
      <ul>
        <li><strong>Proximity + Access:</strong> 10 minutes from George Airport and quick transfers to Fancourt and corporate parks.</li>
        <li><strong>Predictability:</strong> Strong uptime on Wi‑Fi, late check-ins that actually work, and consistent room standards.</li>
        <li><strong>Event Gravity:</strong> Conferences and team offsites funnel repeat bookings and keep search visibility high.</li>
        <li><strong>Loyalty Stickiness:</strong> Brand trust plus corporate agreements reduce price sensitivity.</li>
      </ul>
      <p>During peak season, competitors briefly surface, but Protea sustains the default by reducing planning friction and offering reliable late arrivals. Families also benefit from proximity to schools, sports venues, and medical specialists when visiting George.</p>
    `,
    author: "Defaults Lab",
    category: "Stay",
    tags: ["George", "Stay", "Hospitality"],
    cover_image: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=1400&q=80",
    status: "published"
  },
  {
    slug: "avis-george-airport-default",
    title: "Avis George Airport: Why the Car Hire Default Sticks",
    excerpt: "Arrivals at George Airport funnel straight to Avis. Here's how they defend the 'default' slot.",
    content: `
      <h2>How Avis Holds the Airport Default</h2>
      <p>Car hire defaults are won inside the terminal. Avis George Airport owns that funnel from baggage claim to ignition because the counter, key handoff, and parking bays are the most direct path out of the airport.</p>
      <p>What keeps them first choice:</p>
      <ul>
        <li><strong>Fast Path:</strong> Counter placement + pre-staged vehicles minimize walking distance and handover time.</li>
        <li><strong>Profile Memory:</strong> Frequent renters skip data entry; license and card data are pre-validated.</li>
        <li><strong>Queue Discipline:</strong> Internal targets keep visible queues under ~7 minutes to prevent defection to nearby desks.</li>
        <li><strong>Fleet Fit:</strong> Right-sized sedans and SUVs for Garden Route roads, reducing upsell friction.</li>
      </ul>
      <p>Even when challengers discount, travelers prioritize speed and certainty on arrival. Avis sustains the default by compressing the first ten minutes after landing and keeping support visible for late-night flights.</p>
    `,
    author: "Mobility Desk",
    category: "Car Hire",
    tags: ["Car Hire", "George Airport", "Mobility"],
    cover_image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=80",
    status: "published"
  },
  {
    slug: "fat-fish-george-default",
    title: "The Fat Fish George: Capturing 'Eat' Defaults with Consistency",
    excerpt: "The Fat Fish stays the go-to seafood choice in George. We map how consistency beats novelty.",
    content: `
      <h2>The Reliability Play for Dining Defaults</h2>
      <p>The Fat Fish is the seafood default in George because it minimizes dining risk for families, travelers, and business dinners. Guests know the quality, can reserve quickly, and avoid guesswork on service timing.</p>
      <p>How they defend the slot:</p>
      <ul>
        <li><strong>Stable Menu Core:</strong> Signature dishes anchor expectations; seasonal specials add variety without raising uncertainty.</li>
        <li><strong>Reservation Clarity:</strong> Online bookings with realistic seating times prevent surprise waits.</li>
        <li><strong>Service Timing:</strong> Tight kitchen and floor coordination keeps tables turning without rushing guests.</li>
        <li><strong>Multi-occasion Fit:</strong> Works for business lunches, family dinners, and traveler stopovers on the N2.</li>
      </ul>
      <p>New entrants may spike interest, but The Fat Fish holds the default by lowering friction and consistently delivering on the promise of "good seafood, on time, every time."</p>
    `,
    author: "Food Signals",
    category: "Eat",
    tags: ["Eat", "Seafood", "George"],
    cover_image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80",
    status: "published"
  },
  {
    slug: "wilderness-hotel-default",
    title: "The Wilderness Hotel: Owning Resort Attention on the Lakeside",
    excerpt: "How The Wilderness Hotel anchors lakeside stays and keeps alternatives from rotating in.",
    content: `
      <h2>Bundle Power for Lakeside Stays</h2>
      <p>The Wilderness Hotel defends the default for lakeside stays by combining location with bundled experiences. Guests get spa access, shuttles, and guided outings without stitching together separate bookings.</p>
      <p>Why it stays first choice:</p>
      <ul>
        <li><strong>Location Edge:</strong> Immediate access to the lagoon and nearby trails.</li>
        <li><strong>All-in Packages:</strong> Spa, shuttles, and activities reduce planning overhead for families and couples.</li>
        <li><strong>Consistent Availability:</strong> Reliable inventory during peak holiday weeks keeps it top-of-mind.</li>
        <li><strong>Event Magnet:</strong> Retreats and weddings create recurring demand and word-of-mouth.</li>
      </ul>
      <p>Challengers must drastically cut friction to displace this default; otherwise, the bundled ease keeps guests booking Wilderness first.</p>
    `,
    author: "Resort Watch",
    category: "Stay",
    tags: ["Wilderness", "Resort", "Stay"],
    cover_image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80",
    status: "published"
  },
  {
    slug: "beacon-island-default",
    title: "Beacon Island Resort (Plett): The Coastal Default",
    excerpt: "Beacon Island remains the default coastal stay in Plettenberg Bay—here's why challengers struggle.",
    content: `
      <h2>Why Beacon Island Keeps the Coastal Default</h2>
      <p>Beacon Island Resort remains the go-to coastal stay in Plettenberg Bay by combining direct beach access with trusted family amenities. Travelers save time by choosing a single location that fits kids, couples, and multi-generational trips.</p>
      <p>Default drivers:</p>
      <ul>
        <li><strong>Beachfront Certainty:</strong> No commute to the sand; ocean views are guaranteed.</li>
        <li><strong>Family-Ready:</strong> Pools, supervised activities, and dining options keep families on property.</li>
        <li><strong>Brand Trust:</strong> Long-standing reputation reduces perceived risk for first-time Plett visitors.</li>
        <li><strong>Holiday Momentum:</strong> Peak-season visibility and repeat guests sustain the default year after year.</li>
      </ul>
      <p>Boutique challengers may win niche segments, but Beacon reduces decision fatigue so effectively that it keeps the first-choice slot for most holiday planners.</p>
    `,
    author: "Coastal Insights",
    category: "Stay",
    tags: ["Plett", "Stay", "Resort"],
    cover_image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80",
    status: "published"
  },
];

// Business data
const businessPoints = {
  george: [
    { category: "Stay", name: "Protea Hotel King George", phone: "044 874 7659", meta: "24/7", coords: [22.4589, -33.9612] },
    { category: "Car Hire", name: "Avis George Airport", phone: "044 876 9314", meta: "06:30-20:00", coords: [22.3802, -34.0007] },
    { category: "Car Hire", name: "Hertz George", phone: "044 876 9314", meta: "07:00-19:00", coords: [22.3820, -34.0015] },
    { category: "Car Hire", name: "Europcar George", phone: "044 876 9314", meta: "06:00-22:00", coords: [22.3835, -34.0028] },
    { category: "Eat", name: "The Fat Fish George", phone: "044 874 7803", meta: "11:30-22:00", coords: [22.4530, -33.9595] },
    { category: "Coffee", name: "The Foundry Roasters", phone: "044 873 3444", meta: "07:00-16:30", coords: [22.4545, -33.9578] },
    { category: "Dental", name: "George Dental Care", phone: "044 874 4455", meta: "08:00-17:00", coords: [22.4589, -33.9612] },
    { category: "Optometrist", name: "George Optometrist", phone: "044 873 3444", meta: "08:30-17:30", coords: [22.4545, -33.9578] },
    { category: "Kids", name: "George Little Stars", phone: "044 874 1140", meta: "07:00-17:30", coords: [22.4578, -33.9591] },
    { category: "Spa", name: "George Spa & Wellness", phone: "044 873 2220", meta: "09:00-18:00", coords: [22.4589, -33.9645] },
    { category: "Blinds", name: "George Blinds & Curtains", phone: "082 554 9112", meta: "georgeblinds.co.za", coords: [22.4912, -33.9841] },
    { category: "Blinds", name: "Classic Blinds George", phone: "044 874 1234", meta: "classicblinds.co.za", coords: [22.4560, -33.9585] },
    { category: "Blinds", name: "Modern Window Coverings", phone: "044 874 5678", meta: "modernwindows.co.za", coords: [22.4575, -33.9598] },
    { category: "Waste", name: "George Waste Management", phone: "044 801 9111", meta: "Municipal & Private", coords: [22.4597, -33.9587] },
    { category: "Storage", name: "George Storage Solutions", phone: "044 874 4117", meta: "georgestorage.co.za", coords: [22.4912, -33.9841] },
  ],
  wilderness: [
    { category: "Stay", name: "The Wilderness Hotel", phone: "044 877 1110", meta: "24/7", coords: [22.5772, -33.9934] },
    { category: "Car Hire", name: "Garden Route Shuttles", phone: "082 494 5433", meta: "24/7 bookings", coords: [22.5768, -33.9921] },
    { category: "Eat", name: "Salina's Beach Restaurant", phone: "044 877 0001", meta: "09:00-21:00", coords: [22.5743, -33.9956] },
    { category: "Coffee", name: "Wilderness Cafe", phone: "044 877 0550", meta: "08:00-17:00", coords: [22.5769, -33.9912] },
    { category: "Dental", name: "Wilderness Dental", phone: "044 877 0466", meta: "08:00-16:00", coords: [22.5772, -33.9934] },
    { category: "Optometrist", name: "Wilderness Eye Care", phone: "082 342 6673", meta: "09:00-17:00", coords: [22.5769, -33.9912] },
    { category: "Kids", name: "Wilderness Kids Academy", phone: "083 454 1109", meta: "07:30-17:00", coords: [22.5784, -33.9928] },
    { category: "Interiors", name: "Wilderness Interiors", phone: "082 453 1109", meta: "wildinteriors@mweb.co.za", coords: [22.5768, -33.9921] },
    { category: "Tours", name: "Wilderness Tours", phone: "082 494 5433", meta: "08:00-18:00", coords: [22.5743, -33.9956] },
    { category: "Waste", name: "Wilderness Waste Services", phone: "044 877 1316", meta: "Refuse & Garden", coords: [22.5756, -33.9915] },
    { category: "Storage", name: "Wilderness Self Storage", phone: "082 896 5520", meta: "Secure Units", coords: [22.5801, -33.9941] },
  ],
  sedgefield: [
    { category: "Stay", name: "Sedgefield Arms", phone: "044 343 1417", meta: "07:00-22:00", coords: [22.8034, -34.0178] },
    { category: "Car Hire", name: "Eden Shuttles", phone: "083 454 1109", meta: "08:00-18:00", coords: [22.8012, -34.0165] },
    { category: "Eat", name: "Sedgefield Deli", phone: "044 343 1417", meta: "08:00-17:00", coords: [22.8034, -34.0178] },
    { category: "Coffee", name: "Sedgefield Coffee Hub", phone: "044 343 2110", meta: "07:30-16:00", coords: [22.8021, -34.0189] },
    { category: "Dental", name: "Sedgefield Dental", phone: "044 343 1117", meta: "08:00-16:30", coords: [22.8034, -34.0178] },
    { category: "Optometrist", name: "Sedgefield Optometry", phone: "044 343 1628", meta: "08:30-17:00", coords: [22.8032, -34.0189] },
    { category: "Interiors", name: "Sedgefield Tiles & Floors", phone: "044 343 1321", meta: "tiles & floors", coords: [22.8012, -34.0165] },
    { category: "Kids", name: "Sedgefield Early Learning", phone: "044 343 2110", meta: "07:00-17:00", coords: [22.8021, -34.0189] },
    { category: "Craft", name: "Sedgefield Craft Shop", phone: "044 343 1417", meta: "09:00-16:00", coords: [22.8034, -34.0178] },
    { category: "Waste", name: "Sedgefield Waste Removal", phone: "044 343 1321", meta: "Skip Hire", coords: [22.8012, -34.0165] },
    { category: "Storage", name: "Sedgefield Storage Units", phone: "044 343 1117", meta: "CBD Lockers", coords: [22.8056, -34.0201] },
  ],
  knysna: [
    { category: "Stay", name: "The Lofts Boutique Hotel", phone: "044 302 5710", meta: "24/7", coords: [23.0498, -34.0394] },
    { category: "Car Hire", name: "First Car Rental", phone: "044 382 1083", meta: "08:00-17:00", coords: [23.0465, -34.0356] },
    { category: "Eat", name: "34 South Knysna", phone: "044 382 7331", meta: "08:30-21:30", coords: [23.0443, -34.0412] },
    { category: "Coffee", name: "Cafe Neo Knysna", phone: "044 382 0454", meta: "08:00-17:00", coords: [23.0465, -34.0356] },
    { category: "Dental", name: "Knysna Dental Practice", phone: "044 382 1149", meta: "08:00-17:00", coords: [23.0498, -34.0394] },
    { category: "Optometrist", name: "Knysna Optometrists", phone: "044 382 0454", meta: "08:30-17:30", coords: [23.0465, -34.0356] },
    { category: "Kids", name: "Knysna Kids Academy", phone: "044 302 5710", meta: "07:30-17:30", coords: [23.0645, -34.0487] },
    { category: "Kitchen", name: "Knysna Kitchen & Bath", phone: "044 382 5589", meta: "knysnakitchen.co.za", coords: [23.0512, -34.0412] },
    { category: "Blinds", name: "Knysna Window Treatments", phone: "044 382 1038", meta: "knysnablinds@cx.co.za", coords: [23.0489, -34.0378] },
    { category: "Tours", name: "Knysna Lagoon Tours", phone: "044 382 7331", meta: "08:00-17:00", coords: [23.0443, -34.0412] },
    { category: "Waste", name: "Knysna Rubbish Removal", phone: "044 382 5919", meta: "Private Collection", coords: [23.0612, -34.0456] },
    { category: "Storage", name: "Knysna Storage Solutions", phone: "044 302 4700", meta: "knysnastorage.co.za", coords: [23.0612, -34.0456] },
  ],
  plett: [
    { category: "Stay", name: "Beacon Island Resort", phone: "044 533 1120", meta: "24/7", coords: [23.3712, -34.0534] },
    { category: "Car Hire", name: "Woodford Car Hire", phone: "044 533 0215", meta: "08:00-17:00", coords: [23.3698, -34.0528] },
    { category: "Eat", name: "The Lookout Deck", phone: "044 533 1379", meta: "09:00-22:00", coords: [23.3612, -34.0512] },
    { category: "Coffee", name: "Bean There Plett", phone: "044 533 1140", meta: "07:00-16:00", coords: [23.3712, -34.0534] },
    { category: "Dental", name: "Plett Dental Studio", phone: "044 533 0836", meta: "08:00-17:00", coords: [23.3612, -34.0512] },
    { category: "Optometrist", name: "Plett Vision Centre", phone: "044 533 1140", meta: "08:30-17:00", coords: [23.3712, -34.0534] },
    { category: "Kids", name: "Plett Little Ones", phone: "044 533 1120", meta: "07:00-17:00", coords: [23.3712, -34.0534] },
    { category: "Kitchen", name: "Plett Kitchen Services", phone: "044 533 6740", meta: "plettkitchens@mweb.co.za", coords: [23.3689, -34.0567] },
    { category: "Blinds", name: "Plett Blinds & Curtains", phone: "044 533 1944", meta: "plettblinds.co.za", coords: [23.3698, -34.0528] },
    { category: "Tours", name: "Plett Adventure Tours", phone: "044 533 1379", meta: "08:00-17:00", coords: [23.3789, -34.0612] },
    { category: "Waste", name: "Plett Waste Solutions", phone: "044 533 2103", meta: "Eco Waste Mgmt", coords: [23.3743, -34.0589] },
    { category: "Storage", name: "Plett Self Storage", phone: "044 533 3371", meta: "plettstorage.co.za", coords: [23.3612, -34.0512] },
  ],
  mossel: [
    { category: "Stay", name: "Protea Hotel Mossel Bay", phone: "044 691 3738", meta: "24/7", coords: [22.1445, -34.1812] },
    { category: "Car Hire", name: "Bidvest Car Rental", phone: "044 695 2404", meta: "08:00-17:00", coords: [22.1189, -34.1712] },
    { category: "Eat", name: "Cafe Gannet", phone: "044 691 1885", meta: "07:00-22:00", coords: [22.1456, -34.1812] },
    { category: "Coffee", name: "Bay Coffee Co", phone: "044 695 0880", meta: "08:00-17:00", coords: [22.1189, -34.1712] },
    { category: "Dental", name: "Bay Dental Clinic", phone: "044 691 3724", meta: "08:00-17:00", coords: [22.1445, -34.1812] },
    { category: "Optometrist", name: "Bay Eye Care", phone: "044 695 0880", meta: "08:30-17:30", coords: [22.1189, -34.1712] },
    { category: "Kids", name: "Bay Children's Centre", phone: "044 691 3738", meta: "07:00-17:30", coords: [22.1412, -34.1801] },
    { category: "Kitchen", name: "Mossel Bay Kitchens", phone: "044 691 3111", meta: "mbkitchens@gmail.com", coords: [22.1012, -34.1645] },
    { category: "Flooring", name: "Mossel Bay Flooring", phone: "044 690 6715", meta: "mbflooring.co.za", coords: [22.1089, -34.1512] },
    { category: "Tours", name: "Mossel Bay Tours", phone: "044 691 1885", meta: "08:00-18:00", coords: [22.1456, -34.1812] },
    { category: "Waste", name: "Mossel Bay Waste Services", phone: "044 691 1133", meta: "Industrial Refuse", coords: [22.1012, -34.1567] },
    { category: "Storage", name: "Mossel Bay Storage", phone: "044 601 2240", meta: "mbstorage.co.za", coords: [22.1012, -34.1567] },
  ],
  oudtshoorn: [
    { category: "Stay", name: "Buffelsdrift Game Lodge", phone: "044 272 0000", meta: "24/7", coords: [22.2034, -33.5912] },
    { category: "Car Hire", name: "Klein Karoo Car Hire", phone: "044 272 0288", meta: "08:00-17:00", coords: [22.2034, -33.5912] },
    { category: "Eat", name: "Buffelsdrift Restaurant", phone: "044 272 0000", meta: "07:00-21:00", coords: [22.2034, -33.5912] },
    { category: "Coffee", name: "Oudtshoorn Coffee House", phone: "044 272 0111", meta: "07:30-17:00", coords: [22.2034, -33.5912] },
    { category: "Dental", name: "Oudtshoorn Dental Care", phone: "044 272 0111", meta: "08:00-17:00", coords: [22.2034, -33.5912] },
    { category: "Optometrist", name: "Oudtshoorn Optometrists", phone: "044 272 6023", meta: "08:30-17:00", coords: [22.2032, -33.5891] },
    { category: "Kids", name: "Oudtshoorn Kids Academy", phone: "044 272 0000", meta: "07:30-17:00", coords: [22.2034, -33.5912] },
    { category: "Kitchen", name: "Oudtshoorn Kitchens", phone: "044 272 5622", meta: "oudtkitchens.co.za", coords: [22.2089, -33.5945] },
    { category: "Blinds", name: "Oudtshoorn Blinds", phone: "071 411 5098", meta: "oudtblinds@gmail.com", coords: [22.2089, -33.5912] },
    { category: "Spa", name: "Buffelsdrift Spa", phone: "044 272 0000", meta: "09:00-18:00", coords: [22.2167, -33.4834] },
    { category: "Waste", name: "Oudtshoorn Waste", phone: "044 272 4115", meta: "Municipal", coords: [22.2089, -33.5956] },
    { category: "Storage", name: "Oudtshoorn Storage Units", phone: "044 272 2241", meta: "Klein Karoo Storage", coords: [22.2089, -33.5912] },
  ],
};

async function seedRealData() {
  console.log('🌱 Seeding real blog posts and businesses...');

  try {
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');

    await supabase.from('blogs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('businesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('business_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('blog_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Seed real blog posts
    console.log('📝 Seeding real blog posts...');
    for (const post of POSTS) {
      const { error } = await supabase
        .from('blogs')
        .insert([post]);

      if (error && !error.message.includes('duplicate key')) {
        console.log(`⚠️  Error seeding blog ${post.title}:`, error.message);
      } else {
        console.log(`✅ Seeded blog: ${post.title}`);
      }
    }

    // Seed real businesses
    console.log('🏢 Seeding real businesses...');
    const allBusinesses = [];

    // Convert the businessPoints structure to flat array
    Object.entries(businessPoints).forEach(([town, businesses]) => {
      businesses.forEach(business => {
        allBusinesses.push({
          name: business.name,
          category: business.category,
          town: town.charAt(0).toUpperCase() + town.slice(1),
          phone: business.phone,
          website: business.meta.includes('.co.za') || business.meta.includes('.com') || business.meta.includes('@') ? business.meta : null,
          email: business.meta.includes('@') ? business.meta : null,
          latitude: business.coords[1],
          longitude: business.coords[0],
          description: `Professional ${business.category.toLowerCase()} services in ${town.charAt(0).toUpperCase() + town.slice(1)}. ${business.meta}`,
        });
      });
    });

    for (const business of allBusinesses) {
      const { error } = await supabase
        .from('businesses')
        .insert([business]);

      if (error && !error.message.includes('duplicate key')) {
        console.log(`⚠️  Error seeding business ${business.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${POSTS.length} blog posts`);
    console.log(`✅ Seeded ${allBusinesses.length} businesses`);

    // Set a featured blog
    console.log('⭐ Setting featured blog...');
    const featuredPost = POSTS[0]; // Protea Hotel King George
    await supabase.from('featured_blog').delete();
    await supabase.from('featured_blog').insert([{ blog_slug: featuredPost.slug }]);

    // Seed categories
    console.log('📂 Seeding categories...');
    const categories = [
      { name: 'Stay', display_order: 1 },
      { name: 'Eat', display_order: 2 },
      { name: 'Car Hire', display_order: 3 },
      { name: 'Coffee', display_order: 4 },
      { name: 'Dental', display_order: 5 },
      { name: 'Optometrist', display_order: 6 },
      { name: 'Blinds', display_order: 7 },
      { name: 'Kids', display_order: 8 },
      { name: 'Spa', display_order: 9 },
      { name: 'Interiors', display_order: 10 },
      { name: 'Kitchen', display_order: 11 },
      { name: 'Craft', display_order: 12 },
      { name: 'Tours', display_order: 13 },
      { name: 'Waste', display_order: 14 },
      { name: 'Storage', display_order: 15 },
      { name: 'Flooring', display_order: 16 },
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'name' });

      if (error) {
        console.log(`⚠️  Error seeding category ${category.name}:`, error.message);
      }
    }

    console.log('🎉 Real data seeding complete!');
    console.log('📊 Your admin dashboard now contains all actual blog posts and businesses!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedRealData();
