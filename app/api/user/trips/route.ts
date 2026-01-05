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
    const trips = await dbUser.getTrips(userId);
    
    return NextResponse.json({ trips });
  } catch (error) {
    logError('Failed to fetch user trips:', error);
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
    const body = await request.json();
    const { action } = body;

    if (action === 'save') {
      const { trip } = body;
      const savedTrip = await dbUser.saveTrip({
        ...trip,
        user_id: userId,
      });
      return NextResponse.json({ success: true, trip: savedTrip });
    } else if (action === 'delete') {
      const { tripId } = body;
      await dbUser.deleteTrip(userId, tripId);
      return NextResponse.json({ success: true });
    } else if (action === 'sync') {
      const { trips } = body;
      await dbUser.syncTrips(userId, trips);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logError('Failed to update user trips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
