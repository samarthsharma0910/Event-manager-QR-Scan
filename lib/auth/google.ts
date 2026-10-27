import { appUrl } from "@/lib/mail";

/** "Continue with Google" is only offered when both credentials are configured. */
export const googleEnabled = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const GOOGLE_STATE_COOKIE = "gb_oauth";
export const googleRedirectUri = () => `${appUrl()}/api/auth/google/callback`;

export type GoogleProfile = { email: string; email_verified: boolean; name?: string; picture?: string };

/** Exchanges the authorization code and reads the signed-in person's profile (server to server, over HTTPS). */
export async function fetchGoogleProfile(code: string): Promise<GoogleProfile | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return null;
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return null;
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` }, cache: "no-store" });
  if (!infoRes.ok) return null;
  const p = (await infoRes.json()) as Partial<GoogleProfile>;
  if (!p.email) return null;
  return { email: p.email.toLowerCase(), email_verified: p.email_verified === true, name: p.name, picture: p.picture };
}
