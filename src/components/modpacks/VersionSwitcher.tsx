"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ChevronDown, ChevronRight, History } from "lucide-react";

interface ModpackVersion {
  id: string;
  name: string;
  version: string;
  releaseDate: string | Date;
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
}

interface VersionSwitcherProps {
  currentVersion: ModpackVersion;
  allVersions: ModpackVersion[];
}

export function VersionSwitcher({
  currentVersion,
  allVersions,
}: VersionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sort versions by release date (newest first)
  const sortedVersions = allVersions.sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  );

  const otherVersions = sortedVersions.filter(
    (v) => v.id !== currentVersion.id,
  );

  if (otherVersions.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <History className="mr-2 h-4 w-4" />
          {allVersions.length} versions available
          {isOpen ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        <div className="bg-muted/30 rounded-lg border p-4">
          <h4 className="text-muted-foreground mb-3 text-sm font-medium">
            All Versions
          </h4>
          <div className="space-y-2">
            {sortedVersions.map((version) => (
              <div
                key={version.id}
                className={`flex items-center justify-between rounded-md p-2 text-sm transition-colors ${
                  version.id === currentVersion.id
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    v{version.version}
                  </Badge>

                  <span className="text-muted-foreground">
                    {new Date(version.releaseDate).toLocaleDateString()}
                  </span>

                  <div className="flex gap-1">
                    {version.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {version.isFeatured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                    {version.id === currentVersion.id && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>

                {version.id !== currentVersion.id && (
                  <Link href={`/modpacks/${version.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
