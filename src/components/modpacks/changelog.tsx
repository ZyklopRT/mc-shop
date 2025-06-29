"use client";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Plus,
  Minus,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useState } from "react";
import { ChangeType, ChangeImpact } from "@prisma/client";
import {
  type ChangelogData,
  type ChangelogEntry,
} from "~/lib/validations/modpack";

interface ChangelogProps {
  changelog: ChangelogData;
  showUnchanged?: boolean;
}

const changeTypeConfig = {
  [ChangeType.ADDED]: {
    label: "Added",
    icon: Plus,
    className: "text-green-600 bg-green-50 border-green-200",
    iconClassName: "text-green-600",
  },
  [ChangeType.UPDATED]: {
    label: "Updated",
    icon: RotateCcw,
    className: "text-blue-600 bg-blue-50 border-blue-200",
    iconClassName: "text-blue-600",
  },
  [ChangeType.REMOVED]: {
    label: "Removed",
    icon: Minus,
    className: "text-red-600 bg-red-50 border-red-200",
    iconClassName: "text-red-600",
  },
  [ChangeType.UNCHANGED]: {
    label: "Unchanged",
    icon: Info,
    className: "text-gray-600 bg-gray-50 border-gray-200",
    iconClassName: "text-gray-600",
  },
};

const impactConfig = {
  [ChangeImpact.MAJOR]: {
    label: "Major",
    icon: AlertTriangle,
    className: "text-red-600",
  },
  [ChangeImpact.MINOR]: {
    label: "Minor",
    icon: Sparkles,
    className: "text-yellow-600",
  },
  [ChangeImpact.PATCH]: {
    label: "Patch",
    icon: Info,
    className: "text-gray-600",
  },
};

export function Changelog({
  changelog,
  showUnchanged = false,
}: ChangelogProps) {
  const [sectionsOpen, setSectionsOpen] = useState({
    [ChangeType.ADDED]: false,
    [ChangeType.UPDATED]: false,
    [ChangeType.REMOVED]: true,
    [ChangeType.UNCHANGED]: false,
  });

  const toggleSection = (changeType: ChangeType) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [changeType]: !prev[changeType],
    }));
  };

  // Group changes by type
  const groupedChanges = {
    [ChangeType.ADDED]: changelog.changes.filter(
      (c) => c.changeType === ChangeType.ADDED,
    ),
    [ChangeType.UPDATED]: changelog.changes.filter(
      (c) => c.changeType === ChangeType.UPDATED,
    ),
    [ChangeType.REMOVED]: changelog.changes.filter(
      (c) => c.changeType === ChangeType.REMOVED,
    ),
    [ChangeType.UNCHANGED]: changelog.changes.filter(
      (c) => c.changeType === ChangeType.UNCHANGED,
    ),
  };

  const hasChanges =
    changelog.summary.added > 0 ||
    changelog.summary.updated > 0 ||
    changelog.summary.removed > 0;

  if (!hasChanges && !showUnchanged) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-muted-foreground text-center">
            <Info className="mx-auto mb-2 h-8 w-8" />
            <p>No changes detected in this version.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What&apos;s New
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {changelog.summary.added > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {changelog.summary.added}
                </div>
                <div className="text-muted-foreground text-sm">Mods Added</div>
              </div>
            )}

            {changelog.summary.updated > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {changelog.summary.updated}
                </div>
                <div className="text-muted-foreground text-sm">
                  Mods Updated
                </div>
              </div>
            )}

            {changelog.summary.removed > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {changelog.summary.removed}
                </div>
                <div className="text-muted-foreground text-sm">
                  Mods Removed
                </div>
              </div>
            )}

            {showUnchanged && changelog.summary.unchanged > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {changelog.summary.unchanged}
                </div>
                <div className="text-muted-foreground text-sm">Unchanged</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Changes */}
      <div className="space-y-3">
        {Object.entries(groupedChanges).map(([changeType, changes]) => {
          if (changes.length === 0) return null;
          if (changeType === ChangeType.UNCHANGED && !showUnchanged)
            return null;

          const config = changeTypeConfig[changeType as ChangeType];
          const IconComponent = config.icon;
          const isOpen = sectionsOpen[changeType as ChangeType];

          return (
            <Card key={changeType}>
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleSection(changeType as ChangeType)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className={`h-5 w-5 ${config.iconClassName}`}
                        />
                        <span>{config.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {changes.length}
                        </Badge>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      {changes.map((change) => (
                        <ChangelogItem key={change.id} change={change} />
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface ChangelogItemProps {
  change: ChangelogEntry;
}

function ChangelogItem({ change }: ChangelogItemProps) {
  const impactConfig_ = impactConfig[change.impact];
  const ImpactIcon = impactConfig_.icon;

  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="font-medium">{change.modName}</h4>

          {change.impact !== ChangeImpact.PATCH && (
            <Badge
              variant="outline"
              className={`text-xs ${impactConfig_.className}`}
            >
              <ImpactIcon className="mr-1 h-3 w-3" />
              {impactConfig_.label}
            </Badge>
          )}
        </div>

        {change.description && (
          <p className="text-muted-foreground mb-2 text-sm">
            {change.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm">
          {change.oldVersion && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">From:</span>
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                v{change.oldVersion}
              </code>
            </div>
          )}

          {change.newVersion && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {change.oldVersion ? "To:" : "Version:"}
              </span>
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                v{change.newVersion}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
