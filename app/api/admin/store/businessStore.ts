import { businessPoints, type BusinessPoint } from "@/lib/businessData";
import { dbBusinesses, type AdminBusiness } from "@/lib/database";
import { logError } from "@/lib/logger";

type BusinessPointsMap = Record<string, any[]>;

export const getBusinesses = async (): Promise<AdminBusiness[]> => {
  try {
    return await dbBusinesses.getAll();
  } catch (error) {
    logError('Database error, falling back to static data:', error);
    // Fallback to static data
    const result: AdminBusiness[] = [];
    const points = businessPoints as BusinessPointsMap;
    
    Object.entries(points).forEach(([location, businesses]) => {
      businesses.forEach((business) => {
        result.push({
          name: business.name,
          category: business.category,
          town: location,
          clicks: 0,
          calls: 0,
          websites: 0,
          directions: 0,
          shares: 0
        });
      });
    });
    return result;
  }
};

export const updateBusinessMetrics = async (name: string, patch: Partial<AdminBusiness>): Promise<AdminBusiness> => {
  try {
    const updated = await dbBusinesses.update(name, patch);
    if (!updated) throw new Error("Business not found");
    return updated;
  } catch (error) {
    logError('Database error:', error);
    throw error;
  }
};

export const updateBusiness = async (name: string, patch: Partial<AdminBusiness>): Promise<AdminBusiness> => {
  return updateBusinessMetrics(name, patch);
};

export const createBusiness = async (business: AdminBusiness): Promise<AdminBusiness> => {
  try {
    return await dbBusinesses.create(business);
  } catch (error) {
    logError('Database error:', error);
    throw error;
  }
};

export const deleteBusiness = async (name: string): Promise<boolean> => {
  try {
    return await dbBusinesses.delete(name);
  } catch (error) {
    logError('Database error:', error);
    return false;
  }
};

