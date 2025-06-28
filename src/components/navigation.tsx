"use client";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getMinecraftAvatarUrl } from "~/lib/utils/minecraft-api";

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const avatarUrl = getMinecraftAvatarUrl(session?.user?.mcUUID ?? "");

  const isActive = (path: string) => {
    if (path === "/shops/browse") {
      return pathname === path;
    }
    if (path === "/requests") {
      return pathname.startsWith(path);
    }
    if (path === "/shops") {
      return pathname === path;
    }
    if (path === "/admin/modpacks") {
      return pathname.startsWith(path);
    }
    if (path === "/modpacks") {
      return (
        pathname.startsWith(path) && !pathname.startsWith("/admin/modpacks")
      );
    }
    return false;
  };

  const linkClass = (path: string) =>
    `transition-all duration-200 ${
      isActive(path)
        ? "text-gray-900 font-medium shadow-[inset_0_-2px_0_0] shadow-blue-500"
        : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              MC Shop Admin
            </Link>

            <div className="hidden items-center space-x-6 md:flex">
              <Link href="/shops/browse" className={linkClass("/shops/browse")}>
                Browse Shops
              </Link>
              <Link href="/modpacks" className={linkClass("/modpacks")}>
                Modpacks
              </Link>
              <Link href="/requests" className={linkClass("/requests")}>
                Request Board
              </Link>
              {session?.user && (
                <>
                  <Link href="/shops" className={linkClass("/shops")}>
                    My Shops
                  </Link>
                  {session.user.isAdmin && (
                    <Link
                      href="/admin/modpacks"
                      className={linkClass("/admin/modpacks")}
                    >
                      Manage Modpacks
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <Avatar className="rounded-full">
                  <AvatarImage src={avatarUrl} alt={session.user.name ?? ""} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
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
