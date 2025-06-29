import { getModpacks } from "~/server/actions/modpacks";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import Link from "next/link";
import { Download, Package, Users, Calendar } from "lucide-react";
import { PageHeader } from "~/components/ui/page-header";

export default async function ModpacksPage() {
  // Fetch public modpacks
  const modpacksResult = await getModpacks({
    isPublic: true,
    isActive: true,
    limit: 50,
    offset: 0,
  });

  const modpacks = modpacksResult.success
    ? (modpacksResult.data?.modpacks ?? [])
    : [];

  // Group modpacks by name and show only latest version
  const modpackGroups = modpacks.reduce(
    (groups: Record<string, typeof modpacks>, modpack) => {
      groups[modpack.name] ??= [];
      groups[modpack.name]!.push(modpack);
      return groups;
    },
    {},
  );

  // Sort versions within each group by release date (newest first) and get latest
  const latestModpacks = Object.entries(modpackGroups).map(([, versions]) => {
    const sortedVersions = versions.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
    const latestVersion = sortedVersions[0]!;
    const totalDownloads = versions.reduce(
      (sum, v) => sum + v.downloadCount,
      0,
    );

    return {
      ...latestVersion,
      versionCount: versions.length,
      totalDownloads,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <PageHeader
        icon={<Package className="h-8 w-8" />}
        title="Modpacks"
        description="Download the latest modpacks for our Minecraft server"
      />

      {/* Available Modpacks */}
      {latestModpacks.length > 0 && (
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Available Modpacks</h2>
          <div className="space-y-4">
            {latestModpacks.map((modpack) => (
              <Card
                key={modpack.name}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {modpack.name}
                        </h3>
                        <Badge variant="outline">v{modpack.version}</Badge>
                        {modpack.versionCount > 1 && (
                          <Badge variant="secondary">
                            {modpack.versionCount} versions
                          </Badge>
                        )}
                        <Badge variant="secondary">{modpack.modLoader}</Badge>
                      </div>

                      {modpack.description && (
                        <p className="text-muted-foreground mt-2 text-sm">
                          {modpack.description}
                        </p>
                      )}

                      <div className="text-muted-foreground mt-3 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {modpack._count?.mods ?? 0} mods
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {modpack.totalDownloads} downloads
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {modpack.createdBy.mcUsername}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(modpack.releaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/modpacks/${modpack.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                      <Link href={`/modpacks/${modpack.id}/download`}>
                        <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download Latest
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {latestModpacks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="text-muted-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-medium">No modpacks available</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              There are currently no public modpacks available for download.
              Check back later or contact the server administrators.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      <div className="bg-muted mt-12 rounded-lg p-6">
        <h3 className="mb-4 text-lg font-medium">Getting Started</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">How to Install</h4>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>Download the modpack ZIP file</li>
              <li>Extract it to your Minecraft mods folder</li>
              <li>Make sure you have the correct mod loader installed</li>
              <li>Launch Minecraft and enjoy!</li>
            </ol>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Need Help?</h4>
            <p className="text-muted-foreground text-sm">
              If you&apos;re having trouble installing or using modpacks, check
              our documentation or ask for help on Discord.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm">
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                Discord Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
