import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

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
    const moisture = Number(data.moisture);

    // Validate the request data
    if (!data.trailId || isNaN(moisture)) {
      console.log('Validation failed:', { trailId: data.trailId, moisture });
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Use admin database reference
    const readingsRef = adminDb.ref(`${data.trailId}-readings`);

    // Add new reading with server timestamp
    await readingsRef.push({
      moisture: moisture,
      timestamp: adminDb.ServerValue.TIMESTAMP
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