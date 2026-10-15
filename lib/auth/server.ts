import { createNeonAuth } from "@neondatabase/auth/next/server";
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! }
});
export async function owner() {
  if (!process.env.ALLOWED_OWNER_EMAIL) return null;
  try {
    const result = await auth.getSession();
    const user = result.data?.user;
    if (!user || user.email?.toLowerCase() !== process.env.ALLOWED_OWNER_EMAIL.toLowerCase()) return null;
    return user.id;
  } catch { return null; }
}
