const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateAnalyticsData() {
  console.log('📊 Generating sample analytics data...');

  try {
    // Get all businesses
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('name, town, category');

    if (businessesError) {
      console.error('❌ Error fetching businesses:', businessesError);
      return;
    }

    console.log(`📍 Found ${businesses.length} businesses across ${new Set(businesses.map(b => b.town)).size} towns`);

    // Generate data for the past 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const metricsData = [];

    for (const business of businesses) {
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];

        // Generate realistic metrics based on business type and day of week
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseMultiplier = isWeekend ? 1.5 : 1;

        const clicks = Math.floor(Math.random() * 50 * baseMultiplier);
        const directions = Math.floor(Math.random() * 20 * baseMultiplier);
        const calls = Math.floor(Math.random() * 10 * baseMultiplier);
        const websites = Math.floor(Math.random() * 15 * baseMultiplier);
        const shares = Math.floor(Math.random() * 5 * baseMultiplier);

        if (clicks > 0 || directions > 0 || calls > 0 || websites > 0 || shares > 0) {
          metricsData.push({
            business_name: business.name,
            date: dateStr,
            clicks,
            directions,
            calls,
            websites,
            shares
          });
        }
      }
    }

    console.log(`📈 Generated ${metricsData.length} data points`);

    // Insert data in batches to avoid timeout
    const batchSize = 1000;
    for (let i = 0; i < metricsData.length; i += batchSize) {
      const batch = metricsData.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('business_metrics')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(metricsData.length / batchSize)}`);
      }
    }

    // Generate some blog metrics too
    console.log('📝 Generating blog analytics data...');

    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('slug, title');

    if (!blogsError && blogs) {
      const blogMetricsData = [];

      for (const blog of blogs) {
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0];
          const reads = Math.floor(Math.random() * 30);
          const shares = Math.floor(Math.random() * 5);

          if (reads > 0 || shares > 0) {
            blogMetricsData.push({
              blog_slug: blog.slug,
              date: dateStr,
              reads,
              shares
            });
          }
        }
      }

      console.log(`📖 Generated ${blogMetricsData.length} blog metrics data points`);

      // Insert blog metrics in batches
      for (let i = 0; i < blogMetricsData.length; i += batchSize) {
        const batch = blogMetricsData.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('blog_metrics')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Error inserting blog metrics batch ${i / batchSize + 1}:`, insertError);
        } else {
          console.log(`✅ Inserted blog metrics batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(blogMetricsData.length / batchSize)}`);
        }
      }
    }

    console.log('🎉 Analytics data generation complete!');
    console.log('📊 Your dashboard should now show real metrics data');

  } catch (error) {
    console.error('❌ Error generating analytics data:', error);
  }
}

generateAnalyticsData();
