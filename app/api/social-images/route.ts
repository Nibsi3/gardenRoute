import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logger";

// Cache for social media images
const imageCache = new Map<string, { images: string[]; timestamp: number }>();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const FACEBOOK_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

// Fetch Instagram images using Facebook Graph API for business discovery
// This requires the instagram_basic permission and works for Instagram Business accounts
async function fetchInstagramImages(username: string): Promise<string[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    logInfo("No Instagram access token configured");
    return [];
  }

  try {
    // First, try to find the Instagram Business Account ID using business discovery
    // This requires the account to be a Business or Creator account
    const searchUrl = `https://graph.facebook.com/v18.0/ig_hashtag_search?user_id=17841400000000000&q=${encodeURIComponent(username)}&access_token=${FACEBOOK_ACCESS_TOKEN}`;
    
    // Alternative: Try using the Instagram Basic Display API approach
    // For public profiles, we can try to get the profile picture at least
    const profilePicUrl = `https://www.instagram.com/${username}/?__a=1`;
    
    // Since direct API access to other accounts isn't available without their OAuth,
    // we'll return empty and show the link to their profile
    logInfo(`Instagram @${username}: API access requires business account connection`);
    return [];
  } catch (error) {
    logError(`Error fetching Instagram images for ${username}:`, error);
    return [];
  }
}

// Fetch Facebook page images
async function fetchFacebookImages(pageName: string): Promise<string[]> {
  try {
    // Facebook's public page - try to get cover/profile images
    const response = await fetch(`https://www.facebook.com/${pageName}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    
    // Extract image URLs from og:image and other meta tags
    const images: string[] = [];
    
    // og:image
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogImageMatch) {
      images.push(ogImageMatch[1]);
    }
    
    // Look for high-res images in the page
    const fbImagePattern = /https:\/\/scontent[^"'\s]+\.jpg[^"'\s]*/g;
    let match;
    while ((match = fbImagePattern.exec(html)) !== null && images.length < 6) {
      const url = match[0].replace(/&amp;/g, '&');
      if (!images.includes(url) && !url.includes('emoji') && !url.includes('static')) {
        images.push(url);
      }
    }

    return images.slice(0, 6);
  } catch (error) {
    logError(`Error fetching Facebook images for ${pageName}:`, error);
    return [];
  }
}


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const instagram = searchParams.get("instagram");
  const facebook = searchParams.get("facebook");
  const noCache = searchParams.get("nocache");

  if (!instagram && !facebook) {
    return NextResponse.json({ error: "Instagram or Facebook handle required" }, { status: 400 });
  }

  const cacheKey = instagram || facebook || "";
  
  // Check cache first (unless nocache is set)
  if (!noCache) {
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        images: cached.images,
        source: instagram ? "instagram" : "facebook",
        cached: true,
      });
    }
  }

  let images: string[] = [];
  let source = "";

  // Try Instagram first if provided
  if (instagram) {
    images = await fetchInstagramImages(instagram);
    source = "instagram";
  }

  // If no Instagram images, try Facebook
  if (images.length === 0 && facebook) {
    images = await fetchFacebookImages(facebook);
    source = "facebook";
  }

  // No placeholders - only real images. If none found, return empty array
  // The slider component will hide itself if no images are available

  // Cache the result
  imageCache.set(cacheKey, {
    images,
    timestamp: Date.now(),
  });

  return NextResponse.json({
    images,
    source,
    cached: false,
  });
}
