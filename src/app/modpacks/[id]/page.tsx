import { notFound } from "next/navigation";
import { getModpackById } from "~/server/actions/modpacks";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ModList } from "~/components/modpacks/ModList";
import { ModpackSidebar } from "~/components/modpacks/ModpackSidebar";
import { PageContainer } from "~/components/ui/page-container";

export default async function PublicModpackPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const session = await auth();

  const result = await getModpackById(id);
  if (!result.success || !result.data) {
    notFound();
  }
  const modpack = result.data;

  // Determine edit permission
  let canEdit = false;
  if (session?.user?.id) {
    if (modpack.createdBy.id === session.user.id) {
      canEdit = true;
    } else {
      // Check admin flag
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      });
      if (user?.isAdmin) canEdit = true;
    }
  }

  return (
    <PageContainer size="large">
      <div className="mb-8 flex flex-col gap-4">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/modpacks">
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
            {modpack.isFeatured && (
              <span className="badge badge-secondary">Featured</span>
            )}
            {modpack.isActive ? (
              <span className="badge badge-default">Active</span>
            ) : (
              <span className="badge badge-outline">Inactive</span>
            )}
            {!modpack.isPublic && (
              <span className="badge badge-destructive">Private</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Mods ({modpack.mods?.length ?? 0})
              </CardTitle>
              <CardDescription>Detected mods in this modpack</CardDescription>
            </CardHeader>
            <CardContent>
              <ModList mods={modpack.mods} />
            </CardContent>
          </Card>
        </div>
        <ModpackSidebar modpack={modpack} canEdit={canEdit} />
      </div>
    </PageContainer>
  );
}
