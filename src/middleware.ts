import createMiddleware from "next-intl/middleware";
import { routing } from "~/lib/i18n/routing";

export default createMiddleware(routing);

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - _vercel (Vercel internals)
     * - files with extensions (static files like images, CSS, JS)
     */
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
