import { Badge } from "~/components/ui/badge";
import { Package } from "lucide-react";
import Image from "next/image";

export interface Mod {
  id: string;
  modId: string;
  name: string;
  displayName?: string | null;
  version: string;
  author?: string | null;
  description?: string | null;
  modLoader: string;
  side: string;
  logoPath?: string | null;
}

interface ModListProps {
  mods: Mod[];
}

export function ModList({ mods }: ModListProps) {
  if (!mods || mods.length === 0) {
    return (
      <div className="py-8 text-center">
        <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No mods detected</h3>
        <p className="text-muted-foreground">
          No mods were found or could be parsed in this modpack.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mods.map((mod, index) => (
        <div
          key={mod.id || index}
          className="flex items-start gap-4 rounded-lg border p-4"
        >
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
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{mod.displayName ?? mod.name}</h4>
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
  );
}
