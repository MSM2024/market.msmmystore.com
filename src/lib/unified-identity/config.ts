import type { AppName, SessionCookieConfig } from './types';

// Application registry - each subdomain app
export const APP_REGISTRY: Record<AppName, {
  name: string;
  hostname: string;
  cookiePrefix: string;
  sessionSecretEnv: string;
  allowedOrigins: string[];
}> = {
  accounts: { name: 'MSM Accounts', hostname: 'accounts.msmmystore.com', cookiePrefix: '__Host-msm-acc', sessionSecretEnv: 'ACCOUNTS_SESSION_SECRET', allowedOrigins: ['accounts.msmmystore.com', 'localhost:3001'] },
  admin: { name: 'MSM Admin', hostname: 'admin.msmmystore.com', cookiePrefix: '__Host-msm-admin', sessionSecretEnv: 'ADMIN_SESSION_SECRET', allowedOrigins: ['admin.msmmystore.com', 'localhost:3001'] },
  marketplace: { name: 'MSM Marketplace', hostname: 'marketplace.msmmystore.com', cookiePrefix: '__Host-msm-mkt', sessionSecretEnv: 'MARKETPLACE_SESSION_SECRET', allowedOrigins: ['marketplace.msmmystore.com', 'market.msmmystore.com', 'localhost:3001'] },
  zafiro: { name: 'ZAFIRO', hostname: 'zafiro.msmmystore.com', cookiePrefix: '__Host-msm-zafiro', sessionSecretEnv: 'ZAFIRO_SESSION_SECRET', allowedOrigins: ['zafiro.msmmystore.com', 'zafiro-nu.vercel.app', 'localhost:3001'] },
  api: { name: 'MSM API', hostname: 'api.msmmystore.com', cookiePrefix: '__Host-msm-api', sessionSecretEnv: 'API_SESSION_SECRET', allowedOrigins: ['api.msmmystore.com', 'localhost:3001'] },
};

// SSO ticket config
export const SSO_CONFIG = {
  ticketTTLSeconds: 60,
  ticketBytes: 48,
  pepperEnv: 'SSO_TICKET_PEPPER',
};

// Session config per app
export function getSessionConfig(app: AppName): SessionCookieConfig {
  return {
    name: `${APP_REGISTRY[app].cookiePrefix}-session`,
    prefix: APP_REGISTRY[app].cookiePrefix,
    maxAgeSeconds: app === 'admin' ? 900 : 86400, // 15 min for admin, 24h for others
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };
}

// Rate limit configs
export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 5, lockoutMinutes: 15 },
  register: { windowMs: 60 * 60 * 1000, maxAttempts: 3, lockoutMinutes: 30 },
  sso: { windowMs: 5 * 60 * 1000, maxAttempts: 10, lockoutMinutes: 5 },
  passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 3, lockoutMinutes: 30 },
};

// Admin role hierarchy - only these can access admin panel
export const ADMIN_ROLES = ['owner', 'superadmin', 'finance', 'kyc', 'inventory', 'support', 'auditor'] as const;

// Owner-only operations (require MFA)
export const OWNER_ONLY_ROLES = ['owner', 'superadmin'] as const;

// Roles that can access the admin panel
export const ADMIN_ACCESS_ROLES = ['owner', 'superadmin', 'finance', 'kyc', 'inventory', 'support', 'auditor'] as const;

// Helper to determine current app from hostname
export function getCurrentApp(): AppName | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  for (const [key, app] of Object.entries(APP_REGISTRY)) {
    if (hostname === app.hostname || hostname.endsWith(`.${app.hostname}`)) {
      return key as AppName;
    }
  }
  // Development fallback
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'zafiro'; // default for local dev
  }
  return null;
}

// Helper to detect current app on server side
export function getServerApp(hostname: string): AppName | null {
  for (const [key, app] of Object.entries(APP_REGISTRY)) {
    if (hostname === app.hostname || hostname.endsWith(`.${app.hostname}`)) {
      return key as AppName;
    }
  }
  return null;
}
