import { requireAdmin } from "~/lib/utils/admin-utils";
import { redirect } from "next/navigation";
import { getModpacks } from "~/server/actions/modpacks";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import { PlusCircle, Download, Users, Package } from "lucide-react";

export default async function ModpackManagementPage() {
  // Check authentication and admin permissions
  try {
    await requireAdmin();
  } catch {
    redirect("/modpacks?error=admin_required");
  }

  // Fetch modpacks
  const modpacksResult = await getModpacks({
    limit: 20,
    offset: 0,
  });

  const modpacks = modpacksResult.success
    ? (modpacksResult.data?.modpacks ?? [])
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modpack Management</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage Minecraft modpacks for your server
          </p>
        </div>
        <Link href="/admin/modpacks/upload">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload New Modpack
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Modpacks
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modpacks.length}</div>
            <p className="text-muted-foreground text-xs">Across all versions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Versions
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-muted-foreground h-4 w-4"
            >
              ✓
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modpacks.filter((m) => m.isActive).length}
            </div>
            <p className="text-muted-foreground text-xs">
              Available for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Badge
              variant="secondary"
              className="text-muted-foreground h-4 w-4"
            >
              ⭐
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modpacks.filter((m) => m.isFeatured).length}
            </div>
            <p className="text-muted-foreground text-xs">
              Highlighted versions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modpack List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modpack Versions</h2>

        {modpacks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium">No modpacks found</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-center">
                Get started by uploading your first modpack. You can upload ZIP
                files containing mod directories and we&apos;ll automatically
                analyze the contents.
              </p>
              <Link href="/admin/modpacks/upload">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload First Modpack
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {modpacks.map((modpack) => (
              <Card
                key={modpack.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{modpack.name}</CardTitle>
                      <CardDescription>
                        Version {modpack.version} • {modpack.modLoader} • MC{" "}
                        {modpack.minecraftVersion}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {modpack.isFeatured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      {modpack.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {!modpack.isPublic && (
                        <Badge variant="destructive">Private</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {modpack.description && (
                    <p className="text-muted-foreground mb-4 text-sm">
                      {modpack.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {modpack._count?.mods ?? 0} mods
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {modpack.downloadCount} downloads
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {modpack.createdBy.mcUsername}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/modpacks/${modpack.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/admin/modpacks/${modpack.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-muted mt-12 rounded-lg p-6">
        <h3 className="mb-4 text-lg font-medium">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload New Version</CardTitle>
              <CardDescription>
                Add a new modpack version or update an existing one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/modpacks/upload">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload Modpack
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Browse Public Modpacks
              </CardTitle>
              <CardDescription>
                View modpacks as users would see them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/modpacks">
                <Button variant="outline" className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Public View
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
