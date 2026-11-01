/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AgentGuard — Enterprise Admin Authentication & Role-Based Access Control (RBAC)
 * Hardened security module featuring:
 * - PBKDF2 HMAC-SHA256 Password Hashing (100,000 iterations + cryptographically secure salt)
 * - Timing-safe constant-time hash comparisons (prevents timing side-channel attacks)
 * - Cryptographic session token generation & expiration
 * - Role-Based Access Control (RBAC): admin, operator, auditor
 */

import crypto from 'crypto';

export type UserRole = 'admin' | 'operator' | 'auditor';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  salt: string;
  passwordHash: string;
  createdAt: number;
}

export interface SessionTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

// In-memory token blacklist for revoked sessions
const revokedTokens = new Set<string>();

// Master secret for session token signing (falls back to runtime-generated secure secret)
const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Hash password with salt using PBKDF2 (100,000 iterations)
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, generatedSalt, 100000, 32, 'sha256')
    .toString('hex');
  return { hash, salt: generatedSalt };
}

// Verify password using timingSafeEqual to defeat timing attacks
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 100000, 32, 'sha256')
      .toString('hex');

    const computedBuffer = Buffer.from(computedHash, 'utf8');
    const storedBuffer = Buffer.from(storedHash, 'utf8');

    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

// Generate pre-hashed default administrative users
const initialAdmin = hashPassword('AgentGuard@2026!Admin');
const initialOperator = hashPassword('Operator@2026!Pass');
const initialAuditor = hashPassword('Auditor@2026!View');

export const USERS_DATABASE: Record<string, AuthUser> = {
  admin: {
    id: 'usr_admin_01',
    username: 'admin',
    role: 'admin',
    salt: initialAdmin.salt,
    passwordHash: initialAdmin.hash,
    createdAt: Date.now(),
  },
  operator: {
    id: 'usr_oper_02',
    username: 'operator',
    role: 'operator',
    salt: initialOperator.salt,
    passwordHash: initialOperator.hash,
    createdAt: Date.now(),
  },
  auditor: {
    id: 'usr_audit_03',
    username: 'auditor',
    role: 'auditor',
    salt: initialAuditor.salt,
    passwordHash: initialAuditor.hash,
    createdAt: Date.now(),
  },
};

// Generate signed session token with 4-hour expiration
export function generateSessionToken(user: AuthUser, ttlMs = 4 * 60 * 60 * 1000): string {
  const now = Date.now();
  const payload: SessionTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    issuedAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `ag_sec_${payloadB64}.${signature}`;
}

// Validate session token and check signature + expiry
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionTokenPayload; error?: string } {
  if (!token || !token.startsWith('ag_sec_')) {
    return { valid: false, error: 'Malformed token structure' };
  }

  if (revokedTokens.has(token)) {
    return { valid: false, error: 'Token has been revoked' };
  }

  const raw = token.slice('ag_sec_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token signature partition' };
  }

  const [payloadB64, signature] = parts;

  // Verify HMAC signature in constant time
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expBuffer = Buffer.from(expectedSig, 'utf8');

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return { valid: false, error: 'Invalid cryptographic signature' };
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionTokenPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

// Revoke a session token
export function revokeSessionToken(token: string): boolean {
  if (token) {
    revokedTokens.add(token);
    return true;
  }
  return false;
}

// RBAC Permission Check
export function checkRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    auditor: 1,
    operator: 2,
    admin: 3,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
