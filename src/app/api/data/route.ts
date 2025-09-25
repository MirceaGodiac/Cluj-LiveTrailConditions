// app/api/public-trail/route.ts
import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebaseconfig';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

// Configure allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://trailsilvania.com/',
  'https://live-trail-server.vercel.app/',
];

// Simple in-memory rate limiting (consider Redis for production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Filter out old requests
  const recentRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

export async function GET(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Get trail ID from query parameters
    const { searchParams } = new URL(request.url);
    const trailId = searchParams.get('trailId');
    
    if (!trailId) {
      return NextResponse.json(
        { error: 'Trail ID required' },
        { status: 400 }
      );
    }
    
    // Validate trail ID format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(trailId)) {
      return NextResponse.json(
        { error: 'Invalid trail ID format' },
        { status: 400 }
      );
    }
    
    // Get origin for CORS
    const origin = request.headers.get('origin');
    
    // Fetch latest reading from Firebase
    const readingsRef = ref(database, `${trailId}-readings`);
    const recentQuery = query(readingsRef, orderByChild('timestamp'), limitToLast(1));
    const snapshot = await get(recentQuery);
    
    let latestReading = null;
    if (snapshot.exists()) {
      const data = snapshot.val();
      const key = Object.keys(data)[0];
      latestReading = {
        moisture: data[key].moisture,
        battery: data[key].battery,
        timestamp: data[key].timestamp,
      };
    }
    
    // Create response
    const response = NextResponse.json({
      trailId,
      reading: latestReading,
      cached: false,
    });
    
    // Set CORS headers if origin is allowed
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    // Cache for 30 seconds to reduce load
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching trail data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  return response;
}