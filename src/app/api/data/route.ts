import { NextResponse } from "next/server";
import { database } from "@/app/lib/firebaseconfig";
import { ref, query, limitToLast, get } from "firebase/database";

const allowedOrigins = [
  "http://localhost:5500/", // For local testing, remove in production
  "http://localhost:3000/",
  "https://live-trail-server.vercel.app",
  "https://trailsilvania.com",
];

// ✅ Origin validation
function validateOrigin(origin: string | null) {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

// ✅ Simple rate limiting (by IP)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const LIMIT = 60; // requests
const WINDOW = 60 * 1000; // 1 minute

function isRateLimited(identifier: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (now - entry.timestamp > WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (entry.count >= LIMIT) return true;

  entry.count++;
  rateLimitMap.set(identifier, entry);
  return false;
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (!validateOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const trailId = searchParams.get("trailId");

    if (!trailId) {
      return NextResponse.json({ error: "Missing trailId" }, { status: 400 });
    }

    const readingsRef = ref(database, `${trailId}-readings`);
    const lastReadingQuery = query(readingsRef, limitToLast(1));
    const snapshot = await get(lastReadingQuery);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "No readings found" }, { status: 404 });
    }

    const raw = snapshot.val();
    const data = Object.values(raw)[0] as Record<string, unknown>;

    return NextResponse.json({ trailId, ...data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
