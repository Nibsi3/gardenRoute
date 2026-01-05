import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, location, action } = body;

    // action can be: 'view' (spotlight shown) or 'click' (business clicked from spotlight)
    if (!businessName || !location || !action) {
      return NextResponse.json(
        { error: 'businessName, location, and action are required' },
        { status: 400 }
      );
    }

    if (!['view', 'click'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "view" or "click"' },
        { status: 400 }
      );
    }

    if (!supabase) {
      logInfo('Supabase not configured, skipping spotlight metric');
      return NextResponse.json({ success: true, message: 'Metric logged (no DB)' });
    }

    // Insert spotlight metric
    const { error } = await supabase
      .from('spotlight_metrics')
      .insert({
        business_name: businessName,
        location: location,
        action: action,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logError('Supabase error:', error);
      // Don't fail the request, just log the error
      return NextResponse.json({ success: true, message: 'Metric logged with error' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error tracking spotlight metric:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      logInfo('Supabase not configured');
      return NextResponse.json({ data: [], message: 'Supabase not configured' });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const businessName = searchParams.get('businessName');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, all

    // Calculate date range
    let startDate: Date | null = null;
    if (period === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    let query = supabase
      .from('spotlight_metrics')
      .select('*');

    if (location) {
      query = query.eq('location', location);
    }

    if (businessName) {
      query = query.eq('business_name', businessName);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logError('Supabase error:', error);
      return NextResponse.json({ data: [], error: error.message });
    }

    // Aggregate data
    const aggregated: Record<string, { views: number; clicks: number; location: string }> = {};
    
    for (const row of data || []) {
      const key = row.business_name;
      if (!aggregated[key]) {
        aggregated[key] = { views: 0, clicks: 0, location: row.location };
      }
      if (row.action === 'view') {
        aggregated[key].views++;
      } else if (row.action === 'click') {
        aggregated[key].clicks++;
      }
    }

    const result = Object.entries(aggregated).map(([name, stats]) => ({
      businessName: name,
      location: stats.location,
      views: stats.views,
      clicks: stats.clicks,
      clickRate: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0',
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    logError('Spotlight metrics GET error:', error);
    return NextResponse.json({ data: [], error: 'Failed to fetch metrics' });
  }
}
