const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://itnpydhppfajlwofjouv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnB5ZGhwcGZhamx3b2Zqb3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MDk1NywiZXhwIjoyMDgyMzE2OTU3fQ.hl1KB06ikCs9US-Y8pgclHqVkV6jptTGPokIO_2p6Yg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🧪 Testing Supabase connection...');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('blogs')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log('📋 Tables not found. Please run the SQL schema manually.');
      console.log('📝 Go to: https://supabase.com/dashboard/project/itnpydhppfajlwofjouv/sql');
      console.log('📄 Copy and paste the contents of supabase-schema.sql');
      console.log('▶️  Click "Run" to create the database tables');
      return;
    }

    if (error) {
      console.log('❌ Connection error:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Database is ready for use.');

    // Test seeding some sample data
    console.log('🌱 Testing data seeding...');

    // Add a sample blog
    const { error: blogError } = await supabase
      .from('blogs')
      .upsert({
        slug: 'test-blog-post',
        title: 'Test Blog Post',
        excerpt: 'This is a test blog post to verify database functionality.',
        content: '<p>This is test content for the blog post.</p>',
        author: 'Admin',
        category: 'Test',
        status: 'published'
      }, { onConflict: 'slug' });

    if (blogError) {
      console.log('⚠️  Sample blog creation failed:', blogError.message);
    } else {
      console.log('✅ Sample blog created successfully');
    }

    // Add a sample business
    const { error: businessError } = await supabase
      .from('businesses')
      .upsert({
        name: 'Test Business',
        category: 'Test',
        town: 'George',
        phone: '044 123 4567',
        description: 'A test business for database verification'
      }, { onConflict: 'name' });

    if (businessError) {
      console.log('⚠️  Sample business creation failed:', businessError.message);
    } else {
      console.log('✅ Sample business created successfully');
    }

    console.log('🎉 Database setup and testing complete!');
    console.log('🚀 Your Garden Route Defaults Engine is ready to use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
