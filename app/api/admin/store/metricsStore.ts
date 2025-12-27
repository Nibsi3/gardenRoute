import { dbMetrics, type BusinessMetric, type BlogMetric } from "@/lib/database";

export { type BusinessMetric, type BlogMetric };

export const getBusinessMetrics = async (
  name?: string,
  startDate?: string,
  endDate?: string
): Promise<BusinessMetric[]> => {
  try {
    return await dbMetrics.getBusinessMetrics(name, startDate, endDate);
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
};

export const getBlogMetrics = async (
  slug?: string,
  startDate?: string,
  endDate?: string
): Promise<BlogMetric[]> => {
  try {
    return await dbMetrics.getBlogMetrics(slug, startDate, endDate);
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
};

export const addBusinessMetric = async (metric: BusinessMetric): Promise<void> => {
  try {
    await dbMetrics.addBusinessMetric(metric);
  } catch (error) {
    console.error('Database error:', error);
  }
};

export const addBlogMetric = async (metric: BlogMetric): Promise<void> => {
  try {
    await dbMetrics.addBlogMetric(metric);
  } catch (error) {
    console.error('Database error:', error);
  }
};

// Generate sample data for demo
export const generateSampleData = async (): Promise<void> => {
  const businesses = [
    "George Blinds & Awnings",
    "George Car Hire",
    "Garden Route Dental",
    "George Pharmacy",
    "Knysna Waterfront Hotel"
  ];

  const blogs = [
    "the-best-blinds-in-george",
    "top-car-hire-options-in-george",
    "garden-route-dental-guide",
    "essential-pharmacies-in-george",
    "luxury-hotels-knysna"
  ];

  const today = new Date();

  // Generate last 90 days of data
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Add business metrics
    for (const name of businesses) {
      await addBusinessMetric({
        business_name: name,
        date: dateStr,
        clicks: Math.floor(Math.random() * 50) + 10,
        directions: Math.floor(Math.random() * 20) + 5,
        calls: Math.floor(Math.random() * 15) + 3,
        websites: Math.floor(Math.random() * 25) + 5,
        shares: Math.floor(Math.random() * 10) + 1
      });
    }

    // Add blog metrics
    for (const slug of blogs) {
      await addBlogMetric({
        blog_slug: slug,
        date: dateStr,
        reads: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 15) + 2
      });
    }
  }
};
