import { timingSafeEqual } from 'node:crypto';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function isLoopback(address: string): boolean {
  return LOOPBACK.has(address);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function tokenFromAuthorization(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (scheme === 'Bearer' && value) return value;
  if (scheme === 'Basic' && value) {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return decoded.slice(decoded.indexOf(':') + 1);
  }
  return null;
}

export type AdminDecision = 'allow' | 'forbidden' | 'challenge';

export function decideAdminAccess(
  address: string,
  authorization: string | undefined,
  adminToken: string | undefined,
): AdminDecision {
  if (isLoopback(address)) return 'allow';
  if (!adminToken) return 'forbidden';
  const provided = tokenFromAuthorization(authorization);
  return provided !== null && safeEqual(provided, adminToken) ? 'allow' : 'challenge';
}
