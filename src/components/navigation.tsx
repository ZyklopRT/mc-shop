"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              MC Shop Admin
            </Link>

            <div className="hidden items-center space-x-6 md:flex">
              <Link
                href="/shops/browse"
                className="text-gray-600 transition-colors hover:text-gray-900"
              >
                Browse Shops
              </Link>
              {session?.user && (
                <Link
                  href="/shops"
                  className="text-gray-600 transition-colors hover:text-gray-900"
                >
                  My Shops
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user.mcUsername || session.user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
