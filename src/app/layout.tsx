import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { auth } from "~/server/auth";
import { Navigation } from "~/components/navigation";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "MC Shop Admin",
  description: "Minecraft Shop Administration Panel",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider session={session}>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
