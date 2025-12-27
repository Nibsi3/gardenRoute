# Garden Route Defaults Engine

A comprehensive business directory and blog platform for the Garden Route, South Africa.

## Features

- 🗺️ **Interactive Map**: Explore businesses across the Garden Route with 3D terrain and smooth animations
- 📝 **Blog System**: AI-powered blog content with SEO optimization
- 👥 **Admin Panel**: Complete admin dashboard with authentication
- 📊 **Analytics**: Track business interactions (clicks, calls, directions, shares)
- 📧 **Email Reports**: Automated business performance reports
- 🗄️ **Database**: Supabase-powered data persistence
- 🔐 **Authentication**: Secure admin access with NextAuth.js

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Email**: Resend
- **Maps**: Mapbox GL JS
- **Styling**: Glassmorphism design system

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration
RESEND_API_KEY=re_your-resend-api-key

# Mapbox (existing)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase project's SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the query to create all tables

3. **Get your API keys**:
   - Go to Settings > API in your Supabase dashboard
   - Copy the URL and anon key to your `.env.local`

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed Initial Data

The application will automatically create initial blog and business data when you first run it. To generate sample analytics data:

```bash
node generate-sample-data.js
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Admin Access

- **Login URL**: `http://localhost:3000/admin/login`
- **Default Credentials**: admin / admin123
- **Admin Dashboard**: `http://localhost:3000/admin`

## Key Features

### Public Site
- Interactive map with business locations
- Business cards with contact info and directions
- Blog posts with SEO optimization
- Automatic metric tracking for all interactions

### Admin Panel
- **Dashboard**: KPI overview and analytics charts
- **Blogs**: Create, edit, delete, and feature blog posts
- **Businesses**: Manage all business listings and categories
- **Categories**: Organize businesses by category and town
- **Analytics**: View detailed metrics and export reports
- **Reports**: Send automated email reports to businesses

### API Endpoints

#### Public Metrics Tracking
- `POST /api/metrics/business` - Track business interactions
- `POST /api/metrics/blog` - Track blog reads and shares

#### Admin APIs
- `GET/POST/PUT/DELETE /api/admin/blogs` - Blog management
- `POST /api/admin/blogs/featured` - Set featured blog
- `GET /api/admin/businesses` - Business listings
- `GET /api/admin/categories` - Category management
- `GET /api/admin/analytics/business` - Business metrics
- `GET /api/admin/analytics/blogs` - Blog metrics
- `POST /api/admin/reports/business` - Send business reports

## Database Schema

### Tables
- `blogs` - Blog posts with content, metadata, and SEO fields
- `businesses` - Business listings with location and contact info
- `categories` - Business categories with display ordering
- `business_metrics` - Daily interaction tracking for businesses
- `blog_metrics` - Daily read/share tracking for blogs
- `featured_blog` - Currently featured blog post

### Key Features
- Row Level Security (RLS) enabled
- Automatic timestamps with triggers
- Indexed for performance
- Foreign key relationships

## Deployment

### Environment Variables for Production
Make sure to set strong, unique values for:
- `NEXTAUTH_SECRET`
- `ADMIN_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

### Database Migration
When deploying, you'll need to run the schema SQL in your production Supabase instance.

## Development

### Adding New Businesses
Edit the `businessPoints` object in `components/AttentionMap.tsx` and the database will be updated automatically.

### Adding Blog Posts
Use the admin panel to create new blog posts, or edit the `POSTS` array in `app/blogs/posts.ts` for initial seeding.

### Customizing Analytics
Modify the metric tracking endpoints and admin dashboard components to add new analytics features.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.