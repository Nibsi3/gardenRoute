// Simplified authentication - check credentials manually
import { config } from "./config";

export async function authenticateUser(username: string, password: string) {
  if (username === config.admin.username && password === config.admin.password) {
    return {
      id: "admin",
      name: "Admin",
      email: "admin@gardenroute.com",
      role: "admin"
    };
  }
  return null;
}

// Mock auth function for middleware
export async function auth() {
  // For now, just return authenticated for admin routes
  // In production, you'd check session cookies or JWT tokens
  return { user: { id: "admin", name: "Admin", role: "admin" } };
}
