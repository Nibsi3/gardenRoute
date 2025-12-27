import { businessPoints } from "@/lib/businessData";
import type { BusinessPoint } from "@/components/AttentionMap";
import { dbBusinesses, type AdminBusiness } from "@/lib/database";

export const getBusinesses = async (): Promise<AdminBusiness[]> => {
  try {
    return await dbBusinesses.getAll();
  } catch (error) {
    console.error('Database error, falling back to static data:', error);
    // Fallback to static data
    return Object.entries(businessPoints).flatMap(([town, list]) =>
      list.map((b) => ({
        ...b,
        town,
        clicks: b.clicks ?? 0,
        calls: b.calls ?? 0,
        websites: b.websites ?? 0,
        directions: 0,
        shares: 0,
      })),
    );
  }
};

export const updateBusinessMetrics = async (name: string, patch: Partial<AdminBusiness>): Promise<AdminBusiness> => {
  try {
    const updated = await dbBusinesses.update(name, patch);
    if (!updated) throw new Error("Business not found");
    return updated;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

export const createBusiness = async (business: AdminBusiness): Promise<AdminBusiness> => {
  try {
    return await dbBusinesses.create(business);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

export const updateBusiness = async (name: string, patch: Partial<AdminBusiness>): Promise<AdminBusiness> => {
  return updateBusinessMetrics(name, patch);
};

export const deleteBusiness = async (name: string): Promise<boolean> => {
  try {
    return await dbBusinesses.delete(name);
  } catch (error) {
    console.error('Database error:', error);
    return false;
  }
};

