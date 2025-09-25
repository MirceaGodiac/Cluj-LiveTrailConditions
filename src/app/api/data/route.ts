import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebaseconfig';
import { ref, push, serverTimestamp, get } from 'firebase/database';

// Validate API key from environment variable
const validatePostApiKey = (apiKey: string | null) => {
  const validApiKey = process.env.API_KEY;
  if (!validApiKey) {
    console.error('API_KEY not configured in environment variables');
    return false;
  }
  return apiKey === validApiKey;
};

// List of allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'https://live-trail-server.vercel.app',
  // Add your production domain here
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com'
];

// Interface for Firebase reading data
interface Reading {
  moisture: number;
  battery: number;
  timestamp: number;
}

// Interface for trail reading response
interface TrailReading {
  trailId: string;
  moisture: number;
  timestamp: number;
  readingId: string;
}

// Validate origin for CORS
const validateOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    console.log('No origin header found');
    return false;
  }
  
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  console.log(`Origin validation: ${origin} - ${isAllowed ? 'allowed' : 'blocked'}`);
  
  return isAllowed;
};

// Add CORS headers to response
const addCorsHeaders = (response: NextResponse, origin: string | null): NextResponse => {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  return response;
};

// Handle OPTIONS preflight request
export async function OPTIONS(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export async function GET(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  
  try {
    // Check origin validation
    if (!validateOrigin(request)) {
      const response = NextResponse.json(
        { error: 'Unauthorized origin' },
        { status: 403 }
      );
      return addCorsHeaders(response, origin);
    }

    // Get all trail readings by scanning the database
    const rootRef = ref(database, '/');
    const snapshot = await get(rootRef);

    if (!snapshot.exists()) {
      const response = NextResponse.json(
        { error: 'No data found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const allData = snapshot.val() as Record<string, Record<string, Reading> | unknown>;
    const trailReadings: TrailReading[] = [];

    // Find all trail reading collections (format: "1-readings", "2-readings", etc.)
    for (const [key, value] of Object.entries(allData)) {
      if (key.match(/^\d+-readings$/) && typeof value === 'object' && value !== null) {
        const trailNumber = key.split('-')[0];
        
        // Get the last reading from this trail
        const readings = value as Record<string, Reading>;
        const readingEntries = Object.entries(readings);
        
        if (readingEntries.length > 0) {
          // Sort by timestamp to get the latest reading
          const sortedReadings = readingEntries.sort(([, a], [, b]) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
          });
          
          const [latestKey, latestReading] = sortedReadings[0];
          
          trailReadings.push({
            trailId: trailNumber,
            moisture: latestReading.moisture,
            timestamp: latestReading.timestamp,
            readingId: latestKey
          });
        }
      }
    }

    // Sort trails by ID for consistent ordering
    trailReadings.sort((a, b) => parseInt(a.trailId) - parseInt(b.trailId));

    if (trailReadings.length === 0) {
      const response = NextResponse.json(
        { error: 'No trail readings found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      trails: trailReadings,
      count: trailReadings.length
    }, { status: 200 });
    
    return addCorsHeaders(response, origin);

  } catch (error) {
    console.error('Error fetching trail readings:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

export async function POST(request: Request) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    if (!validatePostApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the incoming request
    const data = await request.json();
    
    // Convert moisture and battery to numbers if they're strings
    const moisture = Number(data.moisture);
    const battery = Number(data.battery);

    // Validate the request data
    if (!data.trailId || isNaN(moisture) || isNaN(battery)) {
      console.log('Validation failed:', { 
        trailId: data.trailId, 
        moisture,
        battery
      });
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Reference to the specific trail's readings
    const readingsRef = ref(database, `${data.trailId}-readings`);

    // Add new reading to Firebase
    await push(readingsRef, {
      moisture: moisture,
      battery: battery,
      timestamp: serverTimestamp()
    });

    return NextResponse.json(
      { success: true, moisture, battery },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing reading:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



