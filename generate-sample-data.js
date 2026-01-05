const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateSampleData() {
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
  const metrics = { businesses: [], blogs: [] };

  // Generate last 90 days of data
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    businesses.forEach(name => {
      metrics.businesses.push({
        name,
        date: dateStr,
        clicks: Math.floor(Math.random() * 50) + 10,
        directions: Math.floor(Math.random() * 20) + 5,
        calls: Math.floor(Math.random() * 15) + 3,
        websites: Math.floor(Math.random() * 25) + 5,
        shares: Math.floor(Math.random() * 10) + 1
      });
    });

    blogs.forEach(slug => {
      metrics.blogs.push({
        slug,
        date: dateStr,
        reads: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 15) + 2
      });
    });
  }

  fs.writeFileSync(path.join(DATA_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));
  console.log('Sample metrics data generated successfully!');
}

generateSampleData();
