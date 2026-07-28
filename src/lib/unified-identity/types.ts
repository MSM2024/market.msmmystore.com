export type AppName = 'accounts' | 'admin' | 'marketplace' | 'zafiro' | 'api';

export type PlatformRole =
  | 'owner'
  | 'superadmin'
  | 'finance'
  | 'kyc'
  | 'inventory'
  | 'support'
  | 'auditor'
  | 'vendor'
  | 'customer';

export type OrgRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'blocked';

export type OrgType = 'business' | 'admin' | 'platform';

export type LoginEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'mfa_success'
  | 'mfa_failed'
  | 'password_reset'
  | 'account_locked'
  | 'sso_issued'
  | 'sso_consumed';

// ── Core DB interfaces ──────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: PlatformRole;
  status: UserStatus;
  organization_id?: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  preferred_language?: string;
  timezone?: string;
  last_login_at?: string;
  last_login_ip?: string;
  login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  owner_id: string;
  status: UserStatus;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrgRole;
  status: UserStatus;
  invited_by?: string;
  created_at: string;
}

export interface SSOTicket {
  id: string;
  user_id: string;
  ticket_hash: string;
  ticket_jti: string;
  target_app: AppName;
  origin_app: AppName;
  expires_at: string;
  consumed_at?: string;
  consumed_from_ip?: string;
  one_time: boolean;
  created_at: string;
}

export interface AppSession {
  id: string;
  user_id: string;
  app_name: AppName;
  session_token_hash: string;
  cookie_name: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  is_mfa_session: boolean;
  expires_at: string;
  last_active_at?: string;
  revoked_at?: string;
  created_at: string;
}

export interface LoginEvent {
  id: string;
  user_id?: string;
  email: string;
  event_type: LoginEventType;
  app_name: AppName;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  country?: string;
  city?: string;
  failure_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  actor_email: string;
  app_name: AppName;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  reason?: string;
  request_id?: string;
  created_at: string;
}

// ── SSO flow ────────────────────────────────────────────────────────

export interface IssueSSORequest {
  userId: string;
  targetApp: AppName;
  originApp: AppName;
}

export interface IssueSSOResponse {
  ticket: string;
  expiresAt: string;
  targetApp: AppName;
}

export interface ConsumeSSORequest {
  ticket: string;
  app: AppName;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface ConsumeSSOResponse {
  userId: string;
  sessionId: string;
  cookieName: string;
  cookieValue: string;
  expiresAt: string;
}

// ── Session cookie config per app ───────────────────────────────────

export interface SessionCookieConfig {
  name: string;
  prefix: string;
  maxAgeSeconds: number;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  httpOnly: boolean;
}

// ── Audit action constants ──────────────────────────────────────────

export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_MFA_ENABLE: 'auth.mfa_enable',
  AUTH_MFA_DISABLE: 'auth.mfa_disable',
  AUTH_MFA_VERIFY: 'auth.mfa_verify',
  SSO_ISSUE: 'sso.issue',
  SSO_CONSUME: 'sso.consume',
  SESSION_CREATE: 'session.create',
  SESSION_REVOKE: 'session.revoke',
  SESSION_REVOKE_ALL: 'session.revoke_all',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_AVATAR: 'profile.avatar',
  ROLE_CHANGE: 'role.change',
  ORG_CREATE: 'org.create',
  ORG_UPDATE: 'org.update',
  ORG_MEMBER_ADD: 'org.member_add',
  ORG_MEMBER_REMOVE: 'org.member_remove',
  ORG_MEMBER_ROLE: 'org.member_role_change',
  ADMIN_USER_SUSPEND: 'admin.user_suspend',
  ADMIN_USER_UNBAN: 'admin.user_unban',
  ADMIN_USER_DELETE: 'admin.user_delete',
  ADMIN_SETTINGS_CHANGE: 'admin.settings_change',
  KYC_SUBMIT: 'kyc.submit',
  KYC_APPROVE: 'kyc.approve',
  KYC_REJECT: 'kyc.reject',
  PAYMENT_SENSITIVE: 'payment.sensitive_operation',
  DATA_EXPORT: 'data.export',
  DATA_DELETE: 'data.delete_request',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// ── Rate limiting ───────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  lockoutMinutes: number;
}

// ── Sensitive operations requiring elevated verification ─────────────

export const SENSITIVE_OPERATIONS = [
  'payment.sensitive_operation',
  'data.export',
  'data.delete_request',
  'role.change',
  'admin.user_delete',
  'admin.settings_change',
  'org.member_remove',
] as const;

export type SensitiveOperation = (typeof SENSITIVE_OPERATIONS)[number];

// ── Generic API response ────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
