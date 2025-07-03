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
  Settings,
  Database,
  Upload,
  TestTube,
  Users,
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
    <PageWrapper className="max-w-6xl">
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
          Manage your Minecraft shop system with administrative tools and
          features.
        </p>
      </div>

      {/* Welcome Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Welcome, {session.user.mcUsername}!
          </CardTitle>
          <CardDescription>
            You have administrative access to manage the MC Shop system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">Admin</div>
              <div className="text-muted-foreground text-sm">Role</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">
                {session.user.mcUUID ? "Linked" : "Pending"}
              </div>
              <div className="text-muted-foreground text-sm">MC Account</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">Active</div>
              <div className="text-muted-foreground text-sm">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Item Management */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Item Management
            </CardTitle>
            <CardDescription>
              Manage Minecraft items and their metadata
            </CardDescription>
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
              <p>• Bulk import and update capabilities</p>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Global Settings
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Shield className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>• RCON configuration</p>
              <p>• Currency settings</p>
              <p>• System maintenance</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/shops">
                <Database className="mr-2 h-4 w-4" />
                View All Shops
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/requests">
                <Users className="mr-2 h-4 w-4" />
                Manage Requests
              </Link>
            </Button>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>• Monitor system activity</p>
              <p>• Review user requests</p>
              <p>• System health checks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-muted-foreground text-sm">Database</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-muted-foreground text-sm">Auth System</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">Unknown</div>
              <div className="text-muted-foreground text-sm">RCON Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Ready</div>
              <div className="text-muted-foreground text-sm">File System</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
