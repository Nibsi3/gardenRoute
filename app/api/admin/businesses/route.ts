import { NextRequest, NextResponse } from 'next/server';
import { dbBusinesses } from '@/lib/database';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const businesses = await dbBusinesses.getAll();
    return NextResponse.json({ businesses });
  } catch (error) {
    logError('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

