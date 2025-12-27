import type { BusinessPoint } from "@/components/AttentionMap";

// Semantic mapping of search terms to categories
const categoryKeywords: Record<string, string[]> = {
  "Eat": ["restaurant", "food", "dining", "eat", "meal", "cafe", "bistro", "diner", "cuisine", "dog friendly", "pet friendly", "family friendly"],
  "Coffee": ["coffee", "cafe", "espresso", "latte", "cappuccino", "brew", "roastery"],
  "Stay": ["hotel", "accommodation", "stay", "lodge", "resort", "guesthouse", "bed", "sleep", "overnight"],
  "Car Hire": ["car", "rental", "hire", "vehicle", "automobile", "transport", "drive"],
  "Dental": ["dental", "dentist", "teeth", "oral", "tooth"],
  "Optometrist": ["optometrist", "eye", "vision", "glasses", "contact", "sight"],
  "Kids": ["kids", "children", "childcare", "daycare", "nursery", "school", "learning"],
  "Spa": ["spa", "massage", "wellness", "relaxation", "therapy", "beauty"],
  "Kitchen": ["kitchen", "cabinets", "renovation", "remodel"],
  "Blinds": ["blinds", "curtains", "window", "shades"],
  "Flooring": ["flooring", "floors", "carpet", "tiles", "wood"],
  "Interiors": ["interior", "design", "decor", "furniture"],
  "Tours": ["tour", "tours", "excursion", "sightseeing", "adventure"],
  "Waste": ["waste", "rubbish", "garbage", "trash", "removal"],
  "Storage": ["storage", "warehouse", "locker", "unit"],
  "Craft": ["craft", "art", "handmade", "artisan"],
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
  
  // Find matching businesses
  const matchingBusinesses = businesses
    .filter(b => {
      const nameMatch = b.name.toLowerCase().includes(lowerQuery);
      const categoryMatch = b.category.toLowerCase().includes(lowerQuery);
      return nameMatch || categoryMatch;
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
    
    // Semantic category match
    if (semanticCategory && business.category === semanticCategory) return true;
    
    // Check if query words match category keywords
    const queryWords = lowerQuery.split(/\s+/);
    const keywords = categoryKeywords[business.category] || [];
    const hasKeywordMatch = queryWords.some(word => 
      keywords.some(keyword => keyword.includes(word) || word.includes(keyword))
    );
    
    if (hasKeywordMatch) return true;
    
    return false;
  });
};

