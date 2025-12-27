// Environment configuration
export const config = {
  nextAuth: {
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
  },
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://itnpydhppfajlwofjouv.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnB5ZGhwcGZhamx3b2Zqb3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDA5NTcsImV4cCI6MjA4MjMxNjk1N30.HVYkujExIsaaOdY3SrMGVtF4BavfjRgyy4z-NNt2RYA",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnB5ZGhwcGZhamx3b2Zqb3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MDk1NywiZXhwIjoyMDgyMzE2OTU3fQ.hl1KB06ikCs9US-Y8pgclHqVkV6jptTGPokIO_2p6Yg",
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
  },
};
