import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { dbUser } from '@/lib/database';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const favorites = await dbUser.getFavorites(userId);
    
    return NextResponse.json({ favorites });
  } catch (error) {
    logError('Failed to fetch user favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { townId, businessName, action } = await request.json();

    if (action === 'add') {
      await dbUser.addFavorite({
        user_id: userId,
        town_id: townId,
        business_name: businessName,
      });
    } else if (action === 'remove') {
      await dbUser.removeFavorite(userId, townId, businessName);
    } else if (action === 'sync') {
      const { favorites } = await request.json();
      await dbUser.syncFavorites(userId, favorites);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Failed to update user favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
