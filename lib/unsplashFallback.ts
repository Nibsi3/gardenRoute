// Unsplash fallback images based on business category/subcategory
// These are used when a business doesn't have a Google Places photo

export interface FallbackImage {
  url: string;
  isPlaceholder: true;
}

// Category-based Unsplash image mappings
const categoryImages: Record<string, string[]> = {
  // Eat & Drink
  "Fine Dining": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop&q=80",
  ],
  "Casual & Family": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&q=80",
  ],
  "Coffee & Breakfast": [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&q=80",
  ],
  "Pubs & Bars": [
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop&q=80",
  ],
  "Bakeries & Delis": [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop&q=80",
  ],
  "Seafood": [
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&h=300&fit=crop&q=80",
  ],
  
  // Stay
  "Hotels & Resorts": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop&q=80",
  ],
  "Guesthouses & B&B": [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop&q=80",
  ],
  "Self-Catering": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&q=80",
  ],
  "Lodges & Eco-Stays": [
    "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618767689160-da3fb810aad7?w=400&h=300&fit=crop&q=80",
  ],
  
  // Experience
  "Adventure": [
    "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop&q=80",
  ],
  "Nature & Wildlife": [
    "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop&q=80",
  ],
  "Water Activities": [
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80",
  ],
  "Tours & Sightseeing": [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop&q=80",
  ],
  "Golf & Sports": [
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop&q=80",
  ],
  "Wellness & Spa": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop&q=80",
  ],
  
  // Shop
  "Shopping": [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop&q=80",
  ],
  "Markets": [
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=300&fit=crop&q=80",
  ],
  "Art & Crafts": [
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=300&fit=crop&q=80",
  ],
  
  // Services
  "Services": [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80",
  ],
  "Healthcare": [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop&q=80",
  ],
  "Transport": [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop&q=80",
  ],
};

// Parent category fallbacks
const parentCategoryImages: Record<string, string[]> = {
  "Eat & Drink": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  ],
  "Stay": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop&q=80",
  ],
  "Experience": [
    "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop&q=80",
  ],
  "Shop": [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop&q=80",
  ],
  "Services": [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80",
  ],
};

// Default fallback if nothing matches
const defaultImages = [
  "https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=400&h=300&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&q=80",
];

/**
 * Get a fallback Unsplash image URL based on category/subcategory
 * Uses a hash of the business name to consistently pick the same image
 */
export function getFallbackImageUrl(
  businessName: string,
  category?: string,
  subcategory?: string
): FallbackImage {
  // Simple hash function to pick consistent image per business
  const hash = businessName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Try subcategory first
  if (subcategory && categoryImages[subcategory]) {
    const images = categoryImages[subcategory];
    return {
      url: images[hash % images.length],
      isPlaceholder: true,
    };
  }
  
  // Try parent category
  if (category && parentCategoryImages[category]) {
    const images = parentCategoryImages[category];
    return {
      url: images[hash % images.length],
      isPlaceholder: true,
    };
  }
  
  // Default fallback
  return {
    url: defaultImages[hash % defaultImages.length],
    isPlaceholder: true,
  };
}

/**
 * Check if an image URL is a placeholder/fallback
 */
export function isPlaceholderImage(url: string): boolean {
  return url.includes('images.unsplash.com');
}
