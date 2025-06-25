import Link from "next/link";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[6rem]">
          MC <span className="text-yellow-300">Shop</span> Admin
        </h1>

        <p className="max-w-2xl text-center text-xl text-blue-100">
          Minecraft Server Shop Administration Panel - Manage your virtual shops
          through RCON integration
        </p>

        {session?.user ? (
          <Card className="w-full max-w-md border-white/20 bg-white/10 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-center text-white">
                Welcome Back!
              </CardTitle>
              <CardDescription className="text-center text-blue-100">
                Logged in as {session.user.mcUsername || session.user.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
              >
                <Link href="/test-rcon">Test RCON Connection</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/shops">Manage Shops</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md border-white/20 bg-white/10 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-center text-white">
                Get Started
              </CardTitle>
              <CardDescription className="text-center text-blue-100">
                Sign in or create an account to manage your Minecraft shops
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
              >
                <Link href="/auth/register">Create Account</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Card className="border-white/20 bg-white/10 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">
                🎮 Server Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100">
                Direct integration with your Minecraft server via RCON for
                real-time shop management
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/10 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">🛒 Shop Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100">
                Create and manage virtual shops, set prices, and handle
                inventory through an intuitive interface
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
