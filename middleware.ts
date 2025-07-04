import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "~/lib/i18n/routing";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Helper function to extract locale from pathname
function extractLocale(pathname: string): string {
  const localeRegex = /^\/([a-z]{2})(?=\/|$)/;
  const localeMatch = localeRegex.exec(pathname);
  return localeMatch?.[1] ?? "en";
}

// Helper function to get pathname without locale prefix
function getPathnameWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
}

// Helper function to check if path matches any of the given routes
function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

// Helper function to create locale-aware redirect URL
function createRedirectUrl(
  pathname: string,
  targetPath: string,
  origin: string,
  callbackUrl?: string,
): URL {
  const locale = extractLocale(pathname);
  const url = new URL(`/${locale}${targetPath}`, origin);

  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }

  return url;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // Skip i18n middleware for API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Handle i18n routing first
  const intlResponse = intlMiddleware(req);

  // If intl middleware wants to redirect, let it
  if (intlResponse?.headers.get("location")) {
    return intlResponse;
  }

  // Get pathname without locale for route checking
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // Define route groups
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/error"];
  const protectedRoutes = ["/test-rcon", "/shops", "/admin"];

  const isPublicRoute = matchesRoutes(pathnameWithoutLocale, publicRoutes);
  const isProtectedRoute = matchesRoutes(
    pathnameWithoutLocale,
    protectedRoutes,
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = createRedirectUrl(
      pathname,
      "/auth/login",
      nextUrl.origin,
      pathname,
    );
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && pathnameWithoutLocale.startsWith("/auth/")) {
    const homeUrl = createRedirectUrl(pathname, "/", nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  return intlResponse || NextResponse.next();
});

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
