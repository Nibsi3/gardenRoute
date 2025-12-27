import { NextResponse } from "next/server";
import { dbBusinesses } from "@/lib/database";

export async function GET() {
  try {
    const businesses = await dbBusinesses.getAll();
    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

