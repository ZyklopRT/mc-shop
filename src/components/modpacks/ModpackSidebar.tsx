import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import {
  Edit,
  Download,
  Cpu,
  FileArchive,
  HardDrive,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ModpackSidebarProps {
  modpack: {
    id: string;
    isPublic: boolean;
    isActive: boolean;
    modLoader: string;
    modLoaderVersion?: string | null;
    fileSize: number;
    checksum: string;
    releaseDate: string | Date;
    createdBy: { mcUsername: string };
    downloadCount: number;
    mods?: { length: number };
  };
}

export function ModpackSidebar({ modpack }: ModpackSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Link
              href={`/admin/modpacks/${modpack.id}/edit`}
              className="w-full"
            >
              <Button className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit Modpack
              </Button>
            </Link>
          </div>
          <div>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download ({(modpack.fileSize / 1024 / 1024).toFixed(1)} MB)
            </Button>
          </div>

          {modpack.isPublic && (
            <div>
              <Link href={`/modpacks/${modpack.id}`} className="w-full">
                <Button variant="ghost" className="w-full">
                  View Public Page
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
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
                  {modpack.modLoaderVersion && ` v${modpack.modLoaderVersion}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
