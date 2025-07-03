"use client";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getMinecraftAvatarUrl } from "~/lib/utils/minecraft-api";
import { ModeToggle } from "~/components/mode-toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Settings, Menu } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (path === "/admin") {
      return pathname.startsWith(path);
    }
    return false;
  };

  const linkClass = (path: string) =>
    `transition-all duration-200 ${
      isActive(path)
        ? "text-foreground font-medium shadow-[inset_0_-2px_0_0] shadow-primary"
        : "text-muted-foreground hover:text-foreground"
    }`;

  const mobileLinkClass = (path: string) =>
    `w-full justify-start transition-colors ${
      isActive(path)
        ? "text-foreground font-medium bg-muted"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`;

  const navigationItems = [
    { href: "/shops/browse", label: "Browse Shops" },
    { href: "/requests", label: "Request Board" },
    ...(session?.user ? [{ href: "/shops", label: "My Shops" }] : []),
    ...(session?.user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-background border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-foreground text-xl font-bold">
              MC <span className="text-primary">Shop</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-6 md:flex">
              <Link href="/shops/browse" className={linkClass("/shops/browse")}>
                Browse Shops
              </Link>
              <Link href="/requests" className={linkClass("/requests")}>
                Request Board
              </Link>
              {session?.user && (
                <Link href="/shops" className={linkClass("/shops")}>
                  My Shops
                </Link>
              )}
              {session?.user?.isAdmin && (
                <Link href="/admin" className={linkClass("/admin")}>
                  <div className="flex items-center space-x-1">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ModeToggle />

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>
                      Navigate through the MC Shop system
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    {/* Navigation Links */}
                    <div className="space-y-2">
                      {navigationItems.map((item) => (
                        <Button
                          key={item.href}
                          variant="ghost"
                          asChild
                          className={mobileLinkClass(item.href)}
                          onClick={closeMobileMenu}
                        >
                          <Link href={item.href}>
                            {item.label === "Admin" && (
                              <Settings className="mr-2 h-4 w-4" />
                            )}
                            {item.label}
                          </Link>
                        </Button>
                      ))}
                    </div>

                    {/* User Section */}
                    <div className="space-x-4 border-t px-4 pt-4">
                      {status === "loading" ? (
                        <div className="bg-muted h-12 w-full animate-pulse rounded"></div>
                      ) : session?.user ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="rounded-full">
                              <AvatarImage
                                src={avatarUrl}
                                alt={session.user.name ?? ""}
                              />
                              <AvatarFallback>
                                {session.user.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground text-sm font-medium">
                                {session.user.mcUsername || session.user.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {session.user.isAdmin
                                  ? "Administrator"
                                  : "User"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              void signOut({ callbackUrl: "/" });
                              closeMobileMenu();
                            }}
                          >
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            onClick={closeMobileMenu}
                          >
                            <Link href="/auth/login">Sign In</Link>
                          </Button>
                          <Button
                            asChild
                            className="w-full"
                            onClick={closeMobileMenu}
                          >
                            <Link href="/auth/register">Register</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop User Section */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {status === "loading" ? (
                <div className="bg-muted h-8 w-16 animate-pulse rounded"></div>
              ) : session?.user ? (
                <div className="flex items-center space-x-4">
                  <Avatar className="rounded-full">
                    <AvatarImage
                      src={avatarUrl}
                      alt={session.user.name ?? ""}
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-sm">
                    Welcome, {session.user.mcUsername || session.user.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void signOut({ callbackUrl: "/" })}
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
      </div>
    </nav>
  );
}
