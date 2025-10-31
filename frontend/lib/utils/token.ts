export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  deviceId: string;
  exp: number;
  iat: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  if (typeof atob !== 'undefined') {
    return atob(base64);
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < base64.length) {
    const a = chars.indexOf(base64.charAt(i++));
    const b = chars.indexOf(base64.charAt(i++));
    const c = chars.indexOf(base64.charAt(i++));
    const d = chars.indexOf(base64.charAt(i++));
    
    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (d !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

export function isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return (payload.exp - currentTime) <= thresholdSeconds;
}

export function getTokenTimeRemaining(token: string): number {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - currentTime;
  return Math.max(0, remaining);
}

export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}