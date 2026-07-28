import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Generate a random ticket string (URL-safe base64)
export function generateTicketString(bytes: number = 48): string {
  return randomBytes(bytes).toString('base64url');
}

// Hash a ticket with SHA-256 + pepper
export function hashTicket(ticket: string, pepper: string): string {
  return createHash('sha256').update(ticket + pepper).digest('hex');
}

// Compare two hashes in constant time (timing-safe)
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// Generate session token
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

// Hash a session token for storage
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Extract client IP from request headers
export function extractIP(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '0.0.0.0';
}

// Extract user agent
export function extractUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}

// Anonymize IP for storage (zero last octet for IPv4)
export function anonymizeIP(ip: string): string {
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  // IPv6 - zero last 80 bits
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 5).join(':') + '::';
  }
  return ip;
}

// Simple HMAC-like token for additional security
export function createSignedToken(payload: string, secret: string, expiresMs: number): string {
  const data = `${payload}:${Date.now() + expiresMs}`;
  const signature = createHash('sha256').update(data + secret).digest('hex').substring(0, 16);
  return Buffer.from(`${data}:${signature}`).toString('base64url');
}

// Verify and decode a signed token
export function verifySignedToken(token: string, secret: string): { payload: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const expiresAt = parseInt(parts[parts.length - 2], 10);
    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -2).join(':');
    const expected = createHash('sha256').update(`${payload}:${expiresAt}` + secret).digest('hex').substring(0, 16);
    if (!safeCompare(signature, expected)) return null;
    if (Date.now() > expiresAt) return null;
    return { payload, expiresAt };
  } catch {
    return null;
  }
}
