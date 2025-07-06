"use client";

import { useTranslations } from "next-intl";
import { ModeToggle } from "~/components/mode-toggle";
import { LocaleSelector } from "~/components/locale-selector";
import { Link } from "~/lib/i18n/routing";
import { Separator } from "~/components/ui/separator";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background mt-auto border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand/About Section */}
            <div className="space-y-4">
              <Link href="/" className="text-foreground text-xl font-bold">
                MC <span className="text-primary">Shop</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                {t("description")}
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold">
                {t("quickLinks")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/shops/browse"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t("browseShops")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/requests"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t("requestBoard")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shops"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t("myShops")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold">
                {t("settings")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t("theme")}
                  </span>
                  <ModeToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t("language")}
                  </span>
                  <LocaleSelector />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <Separator className="my-8" />
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="text-muted-foreground text-sm">
              © {currentYear} MC Shop. {t("allRightsReserved")}
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
