/**
 * Parses Supabase auth tokens (access_token / refresh_token) from a
 * deep-link URL. Supabase puts them in the URL fragment for implicit
 * flows, or in the query string for some verify flows — check both.
 * Returns null when either token is missing or the URL is unparseable.
 */
export function parseAuthTokens(url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  try {
    const parsed = new URL(url);

    const fromFragment = new URLSearchParams(parsed.hash.slice(1));

    const accessToken =
      fromFragment.get("access_token") ?? parsed.searchParams.get("access_token");
    const refreshToken =
      fromFragment.get("refresh_token") ?? parsed.searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) return null;
    return { access_token: accessToken, refresh_token: refreshToken };
  } catch {
    return null;
  }
}
