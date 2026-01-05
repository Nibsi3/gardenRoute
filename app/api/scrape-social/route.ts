import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logger";

// Cache for scraped social media links (in-memory, resets on server restart)
const socialCache = new Map<string, { instagram?: string; facebook?: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Common patterns for finding social media links on websites
// Order matters - more specific patterns first
const instagramPatterns = [
  // Direct href links (most reliable)
  /href=["']https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?["']/gi,
  // Links in text
  /instagram\.com\/([a-zA-Z0-9._]{1,30})\/?(?=["'\s<>])/gi,
  // Short links
  /instagr\.am\/([a-zA-Z0-9._]{1,30})\/?/gi,
];

const facebookPatterns = [
  // Direct href links (most reliable)
  /href=["']https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]{1,50})\/?["']/gi,
  // Links in text
  /facebook\.com\/([a-zA-Z0-9._-]{1,50})\/?(?=["'\s<>])/gi,
  // Short links
  /fb\.com\/([a-zA-Z0-9._-]{1,50})\/?/gi,
];

// Invalid usernames to filter out
const invalidInstagramHandles = new Set([
  'p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'about', 
  'legal', 'api', 'developer', 'press', 'blog', 'help', 'privacy',
  'terms', 'locations', 'directory', 'profiles', 'tags', 'tv', 'igtv'
]);

const invalidFacebookPages = new Set([
  'sharer', 'share', 'dialog', 'plugins', 'tr', 'login', 'help',
  'policies', 'privacy', 'terms', 'about', 'pages', 'groups', 
  'events', 'marketplace', 'gaming', 'watch', 'profile.php'
]);

async function scrapeWebsite(url: string): Promise<{ instagram?: string; facebook?: string }> {
  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fullUrl = `https://${url}`;
    }

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SpotlightBot/1.0; +https://spotlight.co.za)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      logInfo(`Failed to fetch ${fullUrl}: ${response.status}`);
      return {};
    }

    const html = await response.text();
    
    let instagram: string | undefined;
    let facebook: string | undefined;

    // Find Instagram - collect all matches and pick the best one
    const instagramMatches: string[] = [];
    for (const pattern of instagramPatterns) {
      let match;
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        const username = match[1]?.toLowerCase().replace(/\/$/, "");
        if (username && !invalidInstagramHandles.has(username) && username.length > 1) {
          instagramMatches.push(username);
        }
      }
    }
    // Pick the most common match (likely the real handle)
    if (instagramMatches.length > 0) {
      const counts = instagramMatches.reduce((acc, h) => {
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      instagram = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Find Facebook - collect all matches and pick the best one
    const facebookMatches: string[] = [];
    for (const pattern of facebookPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        const pageName = match[1]?.replace(/\/$/, "");
        if (pageName && !invalidFacebookPages.has(pageName.toLowerCase()) && pageName.length > 1) {
          facebookMatches.push(pageName);
        }
      }
    }
    // Pick the most common match
    if (facebookMatches.length > 0) {
      const counts = facebookMatches.reduce((acc, h) => {
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      facebook = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }

    return { instagram, facebook };
  } catch (error) {
    logError(`Error scraping ${url}:`, error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const website = searchParams.get("website");

  if (!website) {
    return NextResponse.json({ error: "Website parameter required" }, { status: 400 });
  }

  // Check cache first
  const cached = socialCache.get(website);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      instagram: cached.instagram,
      facebook: cached.facebook,
      cached: true,
    });
  }

  // Scrape the website
  const result = await scrapeWebsite(website);

  // Cache the result
  socialCache.set(website, {
    ...result,
    timestamp: Date.now(),
  });

  return NextResponse.json({
    instagram: result.instagram,
    facebook: result.facebook,
    cached: false,
  });
}

// POST endpoint for batch scraping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const websites: string[] = body.websites;

    if (!websites || !Array.isArray(websites)) {
      return NextResponse.json({ error: "Websites array required" }, { status: 400 });
    }

    const results: Record<string, { instagram?: string; facebook?: string }> = {};

    // Process in parallel with limit
    const batchSize = 5;
    for (let i = 0; i < websites.length; i += batchSize) {
      const batch = websites.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (website) => {
          // Check cache first
          const cached = socialCache.get(website);
          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return { website, ...cached };
          }

          const result = await scrapeWebsite(website);
          socialCache.set(website, { ...result, timestamp: Date.now() });
          return { website, ...result };
        })
      );

      batchResults.forEach((r) => {
        results[r.website] = { instagram: r.instagram, facebook: r.facebook };
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    logError("Batch scrape error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
