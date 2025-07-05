import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "~/lib/i18n/routing";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // Handle root path redirect to default locale
  if (pathname === "/") {
    const defaultLocaleUrl = new URL(
      `/${routing.defaultLocale}`,
      nextUrl.origin,
    );
    return NextResponse.redirect(defaultLocaleUrl);
  }

  // Skip i18n middleware for API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Handle i18n routing first (this will redirect to default locale when needed)
  const intlResponse = intlMiddleware(req);

  // If intl middleware wants to redirect, let it handle locale routing
  if (intlResponse?.headers.get("location")) {
    return intlResponse;
  }

  // Extract locale from pathname for auth route checking
  const localeRegex = /^\/([a-z]{2})(\/.*)?$/;
  const localeMatch = localeRegex.exec(pathname);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathWithoutLocale = localeMatch?.[2] ?? pathname;

  // Define protected and auth routes
  const protectedRoutes = ["/test-rcon", "/shops", "/admin"];
  const authRoutes = ["/auth/login", "/auth/register", "/auth/error"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route),
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/auth/login`, nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to home
  if (isLoggedIn && isAuthRoute) {
    const homeUrl = new URL(`/${locale}/`, nextUrl.origin);
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
