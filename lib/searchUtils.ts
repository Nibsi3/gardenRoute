import type { BusinessPoint } from "@/lib/businessData";

// Semantic mapping of search terms to categories - comprehensive keyword matching
// Updated to match new streamlined category structure
const categoryKeywords: Record<string, string[]> = {
  // EAT & DRINK
  "Restaurant": ["restaurant", "food", "dining", "eat", "meal", "bistro", "diner", "cuisine", "lunch", "dinner", "breakfast", "brunch", "hungry", "takeaway", "takeout", "sushi", "pizza", "burger", "steak", "seafood", "italian", "chinese", "indian", "thai", "mexican"],
  "Coffee": ["coffee", "cafe", "espresso", "latte", "cappuccino", "brew", "roastery", "barista", "mocha", "americano", "flat white"],
  "Farm Stalls": ["farm stall", "farmstall", "market", "fresh produce", "organic", "local produce", "farmers market", "farm shop", "fresh fruit", "vegetables", "homemade"],
  
  // PLAY & STAY
  "Stay": ["hotel", "accommodation", "stay", "lodge", "resort", "guesthouse", "bed and breakfast", "bnb", "airbnb", "sleep", "overnight", "room", "booking", "vacation rental", "holiday home"],
  "Activities": ["activity", "activities", "adventure", "outdoor", "hiking", "cycling", "kayak", "zipline", "bungee", "tour", "tours", "excursion", "sightseeing", "things to do", "experience", "guided", "golf", "paragliding", "water sports", "surfing", "diving", "fishing"],
  "Car Hire": ["car", "rental", "hire", "vehicle", "automobile", "transport", "drive", "pickup", "suv", "bakkie", "sedan"],
  
  // LIVE & SETTLE
  "Real Estate": ["estate agent", "property", "real estate", "house for sale", "rent", "rental", "apartment", "buy house", "sell house", "plot", "land"],
  "Moving": ["moving", "relocation", "removals", "movers", "storage", "boxes", "packing", "furniture removal"],
  "Internet": ["internet", "wifi", "fibre", "fiber", "broadband", "connection", "data", "network", "isp"],
  "Solar & Power": ["solar", "power", "inverter", "battery", "loadshedding", "load shedding", "backup power", "generator", "panels", "energy"],
  "Security": ["security", "alarm", "cctv", "camera", "guard", "armed response", "burglar", "break in", "safety", "protection", "fence", "gate motor"],
  "Vehicle Repairs": ["mechanic", "car service", "vehicle repair", "auto", "engine", "brakes", "oil change", "tyres", "tires", "car won't start", "breakdown", "mot", "roadworthy", "panel beater", "body shop", "accident repair"],
  
  // HEALTH & HELP
  "Healthcare": ["doctor", "medical", "clinic", "hospital", "gp", "physician", "sick", "ill", "health", "nurse", "dentist", "dental", "optometrist", "eye", "specialist"],
  "Pharmacy": ["pharmacy", "chemist", "medicine", "medication", "prescription", "pills", "drug store"],
  "Vets": ["vet", "veterinarian", "animal", "pet", "dog", "cat", "animal hospital", "pet clinic"],
  "Towing": ["towing", "tow truck", "roadside", "breakdown", "stuck", "accident", "recovery", "flatbed"],
  
  // HOME (Merged categories)
  "Trades & Fixes": [
    // Electricians
    "electrician", "electrical", "power", "lights", "wiring", "outlet", "socket", "fuse", "circuit breaker", "tripped", "no power", "blackout", "sparking",
    // Plumbers
    "plumber", "plumbing", "water", "pipes", "leak", "geyser", "hot water", "drain", "blocked", "toilet", "tap", "burst pipe", "flooding", "bathroom",
    // Painters
    "painter", "painting", "paint", "walls", "colour", "color", "decorator",
    // Roofing
    "roof", "roofing", "tiles", "gutter", "ceiling", "thatch", "waterproofing",
    // Locksmiths
    "locksmith", "lock", "keys", "locked out", "safe",
    // Pest Control
    "pest", "pest control", "exterminator", "bugs", "insects", "rats", "mice", "termites", "fumigation",
    // Glass
    "glass", "glazier", "window repair", "broken window", "windscreen",
    // Builders
    "builder", "building", "construction", "contractor", "renovate", "renovation",
    // HVAC
    "hvac", "air conditioning", "aircon", "heating", "ventilation"
  ],
  "Home Care": [
    // Garden
    "garden", "gardener", "landscaping", "lawn", "grass", "trees", "plants", "irrigation", "sprinkler", "hedge", "pruning",
    // Pool
    "pool", "swimming pool", "pool service", "pool pump", "pool cleaning", "chlorine", "green pool", "filter",
    // Cleaning
    "cleaning", "cleaner", "maid", "domestic", "housekeeping", "deep clean", "laundry"
  ],
};

// Get category from search query
export const getCategoryFromQuery = (query: string): string | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check for exact category matches first
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (lowerQuery.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  // Check for keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
};

// Generate search suggestions based on query
export const getSearchSuggestions = (
  query: string,
  businesses: BusinessPoint[],
  maxSuggestions: number = 8
): Array<{ type: "business" | "category"; name: string; category?: string }> => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const suggestions: Array<{ type: "business" | "category"; name: string; category?: string }> = [];
  
  // Get unique categories
  const categories = Array.from(new Set(businesses.map(b => b.category)));
  
  // Find matching businesses (now includes tags search)
  const matchingBusinesses = businesses
    .filter(b => {
      const nameMatch = b.name.toLowerCase().includes(lowerQuery);
      const categoryMatch = b.category.toLowerCase().includes(lowerQuery);
      const subcategoryMatch = b.subcategory?.toLowerCase().includes(lowerQuery) || false;
      const tagsMatch = b.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) || false;
      const aiContentMatch = b.aiContent?.toLowerCase().includes(lowerQuery) || false;
      return nameMatch || categoryMatch || subcategoryMatch || tagsMatch || aiContentMatch;
    })
    .slice(0, maxSuggestions);
  
  // Find matching categories
  const matchingCategories = categories
    .filter(cat => {
      const catLower = cat.toLowerCase();
      if (catLower.includes(lowerQuery)) return true;
      
      // Check if query matches any keyword for this category
      const keywords = categoryKeywords[cat] || [];
      return keywords.some(keyword => lowerQuery.includes(keyword));
    })
    .slice(0, 3);
  
  // Add category suggestions first
  matchingCategories.forEach(cat => {
    suggestions.push({ type: "category", name: cat });
  });
  
  // Add business suggestions
  matchingBusinesses.forEach(business => {
    suggestions.push({
      type: "business",
      name: business.name,
      category: business.category,
    });
  });
  
  // If query suggests a category but no exact match, add semantic matches
  const semanticCategory = getCategoryFromQuery(query);
  if (semanticCategory && !matchingCategories.includes(semanticCategory)) {
    suggestions.unshift({ type: "category", name: semanticCategory });
  }
  
  return suggestions.slice(0, maxSuggestions);
};

// Enhanced search filter that understands semantic queries
export const filterBusinessesByQuery = (
  businesses: BusinessPoint[],
  query: string
): BusinessPoint[] => {
  if (!query.trim()) return businesses;
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Get semantic category match
  const semanticCategory = getCategoryFromQuery(lowerQuery);
  
  // Filter businesses
  return businesses.filter(business => {
    // Exact name match
    if (business.name.toLowerCase().includes(lowerQuery)) return true;
    
    // Category match
    if (business.category.toLowerCase().includes(lowerQuery)) return true;
    
    // Subcategory match
    if (business.subcategory?.toLowerCase().includes(lowerQuery)) return true;
    
    // Tags match - search through all business tags
    if (business.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
    
    // AI content match - search through description
    if (business.aiContent?.toLowerCase().includes(lowerQuery)) return true;
    
    // Semantic category match
    if (semanticCategory && business.category === semanticCategory) return true;
    
    // Check if query words match category keywords
    const queryWords = lowerQuery.split(/\s+/);
    const keywords = categoryKeywords[business.category] || [];
    const hasKeywordMatch = queryWords.some(word => 
      keywords.some(keyword => keyword.includes(word) || word.includes(keyword))
    );
    
    if (hasKeywordMatch) return true;
    
    // Check if query words match any business tags
    if (business.tags) {
      const hasTagMatch = queryWords.some(word =>
        business.tags!.some(tag => tag.toLowerCase().includes(word))
      );
      if (hasTagMatch) return true;
    }
    
    return false;
  });
};

