import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { AppName } from './types';
import { getSessionConfig, APP_REGISTRY } from './config';
import { generateSessionToken, hashSessionToken } from './crypto';

// Set session cookie on response
export function setSessionCookie(response: NextResponse, app: AppName, token: string, maxAge: number): NextResponse {
  const config = getSessionConfig(app);
  response.cookies.set(config.name, token, {
    maxAge,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
  });
  return response;
}

// Delete session cookie
export function deleteSessionCookie(response: NextResponse, app: AppName): NextResponse {
  const config = getSessionConfig(app);
  response.cookies.set(config.name, '', { maxAge: 0, path: '/' });
  return response;
}

// Read session cookie from request
export async function readSessionCookie(app: AppName): Promise<string | null> {
  const cookieStore = await cookies();
  const config = getSessionConfig(app);
  return cookieStore.get(config.name)?.value || null;
}

// Create a new session: generate token, hash it, return both
export function createSessionToken(): { token: string; hash: string } {
  const token = generateSessionToken();
  const hash = hashSessionToken(token);
  return { token, hash };
}

// Get session secret for app
export function getSessionSecret(app: AppName): string {
  const envName = APP_REGISTRY[app].sessionSecretEnv;
  const secret = process.env[envName];
  if (!secret || secret.length < 64) {
    throw new Error(`Missing or weak session secret for ${app}: set ${envName} (min 64 chars)`);
  }
  return secret;
}

// Validate cookie name format (__Host- prefix in production)
export function isValidCookieName(name: string, app: AppName): boolean {
  const config = getSessionConfig(app);
  if (process.env.NODE_ENV === 'production') {
    return name.startsWith('__Host-') && name === config.name;
  }
  return name === config.name;
}
