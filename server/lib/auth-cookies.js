export const ACCESS_TOKEN_COOKIE = "lumilibras_access_token";
export const REFRESH_TOKEN_COOKIE = "lumilibras_refresh_token";

const isProduction = process.env.NODE_ENV === "production";
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

export function setAuthCookies(response, session) {
  response.cookie(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...baseCookieOptions,
    maxAge: Math.max(session.expires_in - 30, 60) * 1000,
  });
  response.cookie(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(response) {
  response.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  response.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}
