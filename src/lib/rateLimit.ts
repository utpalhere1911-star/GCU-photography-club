import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache with automatic cleanup
const memoryStore = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }
}

export interface RateLimitOptions {
  windowMs: number; // e.g. 15 * 60 * 1000 (15 minutes)
  maxRequests: number; // e.g. 5 attempts
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  clientIp: string;
}

/**
 * Extract client IP address safely from standard proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Leftmost IP in X-Forwarded-For is client IP
    const clientIp = xForwardedFor.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Evaluate rate limit for a client request.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
  customIdentifier?: string
): RateLimitResult {
  cleanupExpired();

  const clientIp = getClientIp(req);
  const identifier = customIdentifier ? `${clientIp}:${customIdentifier}` : clientIp;
  const key = `${options.keyPrefix || "rl"}:${identifier}`;
  const now = Date.now();

  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - 1),
      resetInSeconds: Math.ceil(options.windowMs / 1000),
      clientIp,
    };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      clientIp,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - existing.count),
    resetInSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    clientIp,
  };
}

/**
 * Verify that state-changing requests originate from an allowed origin or referer (CSRF protection).
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  // Safe HTTP methods do not require origin checks
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    // If no origin header, check referer
    const referer = req.headers.get("referer");
    if (!referer) {
      // In development, allow localhost tools/Postman if explicitly not in production
      return process.env.NODE_ENV !== "production";
    }
    try {
      const refUrl = new URL(referer);
      return refUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    // Exact match with current host header
    if (originUrl.host === host) {
      return true;
    }

    // Allow localhost/127.0.0.1 in non-production
    if (
      process.env.NODE_ENV !== "production" &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")
    ) {
      return true;
    }

    // Allow Vercel deployment preview domains if host matches
    if (
      host?.endsWith(".vercel.app") &&
      originUrl.host === host
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
