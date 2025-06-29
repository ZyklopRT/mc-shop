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
import { PageContainer } from "~/components/ui/page-container";
import { PageHeader } from "~/components/ui/page-header";

export default async function ModpackManagementPage() {
  // Check authentication and admin permissions
  try {
    await requireAdmin();
  } catch {
    redirect("/modpacks?error=admin_required");
  }

  // Fetch modpacks (keeping the existing approach for now)
  const modpacksResult = await getModpacks({
    limit: 50, // Increased to get more modpacks for grouping
    offset: 0,
  });

  const modpacks = modpacksResult.success
    ? (modpacksResult.data?.modpacks ?? [])
    : [];

  // Group modpacks by name for display
  const modpackGroups = modpacks.reduce(
    (groups: Record<string, typeof modpacks>, modpack) => {
      groups[modpack.name] ??= [];
      groups[modpack.name]!.push(modpack);
      return groups;
    },
    {},
  );

  // Sort versions within each group by release date (newest first)
  Object.values(modpackGroups).forEach((versions) => {
    versions.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
  });

  const groupCount = Object.keys(modpackGroups).length;
  const totalModpacks = modpacks.length;
  const activeModpacks = Object.values(modpackGroups).filter((versions) =>
    versions.some((v) => v.isActive),
  ).length;
  const featuredModpacks = Object.values(modpackGroups).filter((versions) =>
    versions.some((v) => v.isFeatured),
  ).length;

  return (
    <PageContainer>
      <PageHeader
        icon={<Package className="h-8 w-8" />}
        title="Modpack Management"
        description="Upload and manage Minecraft modpacks for your server"
        actions={
          <Link href="/admin/modpacks/upload">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload New Modpack
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Versions
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModpacks}</div>
            <p className="text-muted-foreground text-xs">
              Across {groupCount} modpack{groupCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Modpacks
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-muted-foreground h-4 w-4"
            >
              ✓
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModpacks}</div>
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
            <div className="text-2xl font-bold">{featuredModpacks}</div>
            <p className="text-muted-foreground text-xs">
              Highlighted modpacks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modpack Groups List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modpacks</h2>

        {Object.keys(modpackGroups).length === 0 ? (
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
          <div className="space-y-4">
            {Object.entries(modpackGroups).map(([name, versions]) => {
              const latestVersion = versions[0]!;
              const totalDownloads = versions.reduce(
                (sum, v) => sum + v.downloadCount,
                0,
              );
              const hasActive = versions.some((v) => v.isActive);
              const hasFeatured = versions.some((v) => v.isFeatured);
              const hasPublic = versions.some((v) => v.isPublic);

              return (
                <Card key={name} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{name}</CardTitle>
                          <Badge variant="outline">
                            {versions.length} version
                            {versions.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="secondary">
                            Latest: v{latestVersion.version}
                          </Badge>
                        </div>
                        <CardDescription>
                          {latestVersion.modLoader} • MC{" "}
                          {latestVersion.minecraftVersion}
                          {latestVersion.description &&
                            ` • ${latestVersion.description}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {hasActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        {!hasPublic && (
                          <Badge variant="destructive">Private</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {latestVersion._count?.mods ?? 0} mods
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {totalDownloads} downloads
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {latestVersion.createdBy.mcUsername}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/modpacks/${latestVersion.id}`}>
                          <Button variant="outline" size="sm">
                            View Latest
                          </Button>
                        </Link>
                        <Link
                          href={`/admin/modpacks/upload?existing=${encodeURIComponent(name)}`}
                        >
                          <Button variant="ghost" size="sm">
                            Add Version
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* All Versions List */}
                    {versions.length > 1 && (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm font-medium">All Versions:</h4>
                        <div className="grid gap-2">
                          {versions.map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between rounded-lg border p-3 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                  v{version.version}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {new Date(
                                    version.releaseDate,
                                  ).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1">
                                  {version.isActive && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Active
                                    </Badge>
                                  )}
                                  {version.isFeatured && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/modpacks/${version.id}`}>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </Link>
                                <Link
                                  href={`/admin/modpacks/${version.id}/edit`}
                                >
                                  <Button variant="ghost" size="sm">
                                    Edit
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
