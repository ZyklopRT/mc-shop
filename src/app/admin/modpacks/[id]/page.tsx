import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "~/lib/utils/admin-utils";
import { getModpackById } from "~/server/actions/modpacks";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Edit,
  Package,
  FileArchive,
  Calendar,
  User,
  Cpu,
  HardDrive,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";

interface ModpackDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ModpackDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params as required by Next.js 15
  const { id } = await params;

  // Check authentication and admin permissions
  try {
    await requireAdmin();
  } catch {
    redirect("/modpacks?error=admin_required");
  }

  // Fetch modpack details with mods
  const result = await getModpackById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const modpack = result.data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/admin/modpacks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Modpacks
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{modpack.name}</h1>
            <p className="text-muted-foreground mt-2">
              Version {modpack.version} • {modpack.modLoader} • MC{" "}
              {modpack.minecraftVersion}
            </p>
          </div>

          <div className="flex gap-2">
            {modpack.isFeatured && <Badge variant="secondary">Featured</Badge>}
            {modpack.isActive ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
            {!modpack.isPublic && <Badge variant="destructive">Private</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {modpack.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{modpack.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Release Notes */}
          {modpack.releaseNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Release Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {modpack.releaseNotes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mods List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Mods ({modpack.mods?.length ?? 0})
              </CardTitle>
              <CardDescription>Detected mods in this modpack</CardDescription>
            </CardHeader>
            <CardContent>
              {!modpack.mods || modpack.mods.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-medium">No mods detected</h3>
                  <p className="text-muted-foreground">
                    No mods were found or could be parsed in this modpack.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modpack.mods.map((mod, index) => (
                    <div
                      key={mod.id || index}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      {/* Mod Logo */}
                      <div className="flex-shrink-0">
                        <span className="relative block h-8 w-8">
                          {mod.logoPath ? (
                            <Image
                              src={
                                mod.logoPath.startsWith("/")
                                  ? mod.logoPath
                                  : "/" + mod.logoPath
                              }
                              alt={`${mod.name} logo`}
                              width={32}
                              height={32}
                              className="absolute inset-0 h-8 w-8 object-contain"
                              unoptimized
                            />
                          ) : null}
                          <Package className="text-muted-foreground pointer-events-none absolute inset-0 m-auto h-6 w-6 opacity-30" />
                        </span>
                      </div>

                      {/* Mod Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {mod.displayName ?? mod.name}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              {mod.modId} • v{mod.version}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {mod.modLoader}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {mod.side}
                            </Badge>
                          </div>
                        </div>

                        {mod.description && (
                          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                            {mod.description}
                          </p>
                        )}

                        {mod.author && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            by {mod.author}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/admin/modpacks/${modpack.id}/edit`}
                className="w-full"
              >
                <Button className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Modpack
                </Button>
              </Link>

              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download ({(modpack.fileSize / 1024 / 1024).toFixed(1)} MB)
              </Button>

              {modpack.isPublic && (
                <Link href={`/modpacks/${modpack.id}`} className="w-full">
                  <Button variant="ghost" className="w-full">
                    View Public Page
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Cpu className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Mod Loader</p>
                    <p className="text-muted-foreground text-sm">
                      {modpack.modLoader}
                      {modpack.modLoaderVersion &&
                        ` v${modpack.modLoaderVersion}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileArchive className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">File Size</p>
                    <p className="text-muted-foreground text-sm">
                      {(modpack.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HardDrive className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Checksum</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {typeof modpack.checksum === "string" && modpack.checksum
                        ? `${modpack.checksum.substring(0, 12)}...`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Release Date</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(modpack.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-muted-foreground text-sm">
                      {modpack.createdBy.mcUsername}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Downloads</span>
                  <span className="text-muted-foreground text-sm">
                    {modpack.downloadCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mods</span>
                  <span className="text-muted-foreground text-sm">
                    {modpack.mods?.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-1">
                    {modpack.isActive ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-muted-foreground text-sm">
                      {modpack.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
         