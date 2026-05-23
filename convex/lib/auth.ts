import { ConvexError } from "convex/values";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isValidAdminToken(token: string): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return timingSafeEqual(token, expected);
}

export function assertAdmin(token: string): void {
  if (!isValidAdminToken(token)) {
    throw new ConvexError("Unauthorized");
  }
}
