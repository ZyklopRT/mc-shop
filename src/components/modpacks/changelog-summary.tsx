"use client";

import { Badge } from "~/components/ui/badge";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { type ChangelogData } from "~/lib/validations/modpack";

interface ChangelogSummaryProps {
  changelog: ChangelogData | null;
  className?: string;
}

export function ChangelogSummary({
  changelog,
  className,
}: ChangelogSummaryProps) {
  if (
    !changelog ||
    (changelog.summary.added === 0 &&
      changelog.summary.updated === 0 &&
      changelog.summary.removed === 0)
  ) {
    return null;
  }

  const { summary } = changelog;
  const hasChanges =
    summary.added > 0 || summary.updated > 0 || summary.removed > 0;

  if (!hasChanges) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-muted-foreground text-xs font-medium">
        Changes:
      </span>

      {summary.added > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Plus className="mr-1 h-3 w-3 text-green-600" />
          {summary.added}
        </Badge>
      )}

      {summary.updated > 0 && (
        <Badge variant="secondary" className="text-xs">
          <RotateCcw className="mr-1 h-3 w-3 text-blue-600" />
          {summary.updated}
        </Badge>
      )}

      {summary.removed > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Minus className="mr-1 h-3 w-3 text-red-600" />
          {summary.removed}
        </Badge>
      )}
    </div>
  );
}
