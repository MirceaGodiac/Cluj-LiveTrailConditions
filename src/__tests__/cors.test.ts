import { describe, it, expect, vi } from 'vitest';

// Mock Firebase before importing the route
vi.mock('@/app/lib/firebaseconfig', () => ({ database: {} }));
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn().mockResolvedValue({ exists: () => false }),
  push: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Import after mocks are set up
const { OPTIONS, GET } = await import('@/app/api/data/route');

function makeRequest(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost:3000/api/data', {
    method: 'GET',
    headers,
  });
}

function makeOptionsRequest(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost:3000/api/data', {
    method: 'OPTIONS',
    headers,
  });
}

describe('CORS headers', () => {
  describe('OPTIONS preflight', () => {
    it('returns 204 with CORS headers for an allowed origin', async () => {
      const res = await OPTIONS(makeOptionsRequest('https://trailsilvania.com'));
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://trailsilvania.com');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('returns 403 for a disallowed origin', async () => {
      const res = await OPTIONS(makeOptionsRequest('https://evil.com'));
      expect(res.status).toBe(403);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('returns 204 with no ACAO header when no origin is sent', async () => {
      const res = await OPTIONS(makeOptionsRequest());
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('GET request', () => {
    it('sets CORS header for an allowed origin', async () => {
      const res = await GET(makeRequest('https://live-trail-server.vercel.app'));
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://live-trail-server.vercel.app');
    });

    it('returns 403 for a disallowed origin', async () => {
      const res = await GET(makeRequest('https://evil.com'));
      expect(res.status).toBe(403);
    });

    it('does not set wildcard (*) CORS header', async () => {
      const res = await GET(makeRequest('https://evil.com'));
      expect(res.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
    });
  });
});
