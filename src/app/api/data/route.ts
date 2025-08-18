import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebaseconfig';
import { ref, push, serverTimestamp } from 'firebase/database';

// Validate API key from environment variable
const validateApiKey = (apiKey: string | null) => {
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
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the incoming request
    const data = await request.json();
    
    // Convert moisture to number if it's a string
    const moisture = Number(data.moisture);

    // Validate the request data
    if (!data.trailId || isNaN(moisture)) {
      console.log('Validation failed:', { trailId: data.trailId, moisture });
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
      timestamp: serverTimestamp()
    });

    return NextResponse.json(
      { success: true, moisture },
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