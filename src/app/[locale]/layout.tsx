import "~/styles/globals.css";

import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "~/server/auth";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/theme-provider";
import { routing } from "~/lib/i18n/routing";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Define the supported locales
const locales = ["en", "de"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const session = await auth();

  return (
    <html
      lang={locale}
      className={`${geist.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider session={session}>
              <Navigation />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
