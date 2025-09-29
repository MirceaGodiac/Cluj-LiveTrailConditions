import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebaseconfig';
import { ref, get, push, serverTimestamp } from 'firebase/database';

// List of allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://live-trail-server.vercel.app',
  'https://trailsilvania.com',
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

// Interface for trail with historical data
interface TrailData {
  trailId: string;
  latestReading: TrailReading;
  last7Days: TrailReading[];
}

// Validate origin for CORS (more permissive for WordPress)
const validateOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  
  // Always allow trailsilvania.com
  if (origin === 'https://trailsilvania.com') {
    console.log(`Origin validation: ${origin} - allowed`);
    return true;
  }
  
  if (!origin) {
    console.log('No origin header found - allowing for direct access');
    return true; // Allow direct API access without origin
  }
  
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  console.log(`Origin validation: ${origin} - ${isAllowed ? 'allowed' : 'blocked'}`);
  
  return isAllowed;
};

// Add CORS headers to response
const addCorsHeaders = (response: NextResponse, origin: string | null): NextResponse => {
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5500');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  
  return response;
};

// Handle OPTIONS preflight request
export async function OPTIONS(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  
  // Create response with 200 status
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
    const trailsData: TrailData[] = [];

    // Calculate 7 days ago timestamp
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Find all trail reading collections (format: "1-readings", "2-readings", etc.)
    for (const [key, value] of Object.entries(allData)) {
      if (key.match(/^\d+-readings$/) && typeof value === 'object' && value !== null) {
        const trailNumber = key.split('-')[0];
        
        // Get all readings from this trail
        const readings = value as Record<string, Reading>;
        const readingEntries = Object.entries(readings);
        
        if (readingEntries.length > 0) {
          // Convert to TrailReading objects and sort by timestamp (newest first)
          const trailReadings: TrailReading[] = readingEntries
            .map(([readingId, reading]) => ({
              trailId: trailNumber,
              moisture: reading.moisture,
              timestamp: reading.timestamp,
              readingId: readingId
            }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          
          // Get the latest reading
          const latestReading = trailReadings[0];
          
          // Filter readings from the last 7 days
          const last7DaysReadings = trailReadings.filter(
            reading => reading.timestamp >= sevenDaysAgo
          );
          
          trailsData.push({
            trailId: trailNumber,
            latestReading: latestReading,
            last7Days: last7DaysReadings
          });
        }
      }
    }

    // Sort trails by ID for consistent ordering
    trailsData.sort((a, b) => parseInt(a.trailId) - parseInt(b.trailId));

    if (trailsData.length === 0) {
      const response = NextResponse.json(
        { error: 'No trail readings found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      trails: trailsData,
      count: trailsData.length,
      dataRange: {
        from: new Date(sevenDaysAgo).toISOString(),
        to: new Date().toISOString()
      }
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

// Validate API key from environment variable
const validatePostApiKey = (apiKey: string | null) => {
  const validApiKey = process.env.API_KEY;
  if (!validApiKey) {
    console.error('API_KEY not configured in environment variables');
    return false;
  }
  return apiKey === validApiKey;
};

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