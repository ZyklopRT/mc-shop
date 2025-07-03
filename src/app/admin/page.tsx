"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { Alert, AlertDescription } from "~/components/ui/alert";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Upload,
  TestTube,
  Shield,
  AlertTriangle,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check admin access
  if (status === "loading") {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-64 rounded"></div>
          <div className="bg-muted h-32 w-full rounded"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <PageWrapper className="max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Access denied. This page requires administrator privileges.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-4xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="mb-2 flex items-center gap-3">
          <Shield className="text-primary h-8 w-8" />
          <h1 className="text-foreground text-3xl font-bold">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          Administrative tools for managing the MC Shop system.
        </p>
      </div>

      {/* Welcome Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome, {session.user.mcUsername}!</CardTitle>
          <CardDescription>
            You have administrator access to the MC Shop system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">
                {session.user.mcUUID ? "✓ Linked" : "⚠ Pending"}
              </div>
              <div className="text-muted-foreground text-sm">MC Account</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">Active</div>
              <div className="text-muted-foreground text-sm">Admin Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools - Only Implemented Features */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Item Management */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Item Management
            </CardTitle>
            <CardDescription>Import and manage Minecraft items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/admin/items/import">
                <Upload className="mr-2 h-4 w-4" />
                Import Items (ZIP)
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/items/test">
                <TestTube className="mr-2 h-4 w-4" />
                Test Import
              </Link>
            </Button>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>• Upload ZIP files with items + images</p>
              <p>• Automatic texture management</p>
              <p>• Support for default and Sphax textures</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/shops/browse">
                <Database className="mr-2 h-4 w-4" />
                View All Shops
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/requests">
                <Database className="mr-2 h-4 w-4" />
                View Requests
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/items">
                <Database className="mr-2 h-4 w-4" />
                Browse Items
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>Current system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">
                ✓ Online
              </div>
              <div className="text-muted-foreground text-sm">System Status</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">
                ✓ Ready
              </div>
              <div className="text-muted-foreground text-sm">Import System</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">
                ✓ Connected
              </div>
              <div className="text-muted-foreground text-sm">Database</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
