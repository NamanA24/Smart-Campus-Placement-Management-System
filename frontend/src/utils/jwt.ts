import type { User, UserRole } from '../types/models';

interface JwtPayload {
  sub?: string;
  role?: string;
  scope?: string;
  exp?: number;
}

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const userFromToken = (token: string): User | null => {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    return null;
  }

  const rawRole = payload.role || payload.scope || 'ROLE_STUDENT';
  const role = rawRole.replace('ROLE_', '') as UserRole;

  return {
    id: payload.sub,
    username: payload.sub,
    email: payload.sub,
    role,
  };
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 <= Date.now();
};
