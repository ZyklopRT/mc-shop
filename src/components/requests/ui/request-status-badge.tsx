"use client";

import { Badge } from "~/components/ui/badge";
import {
  getRequestStatusConfig,
  getOfferStatusConfig,
  getRequestTypeConfig,
} from "~/lib/utils/request-status";
import type {
  RequestStatus,
  OfferStatus,
  RequestType,
} from "~/lib/types/request";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function RequestStatusBadge({
  status,
  className,
}: RequestStatusBadgeProps) {
  const config = getRequestStatusConfig(status);

  return (
    <div className={`flex h-6 items-center gap-2 ${className ?? ""}`}>
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      <span className="text-muted-foreground text-sm">{config.label}</span>
    </div>
  );
}

interface OfferStatusBadgeProps {
  status: OfferStatus;
  className?: string;
}

export function OfferStatusBadge({ status, className }: OfferStatusBadgeProps) {
  const config = getOfferStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} ${className ?? ""}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface RequestTypeBadgeProps {
  type: RequestType;
  className?: string;
}

export function RequestTypeBadge({ type, className }: RequestTypeBadgeProps) {
  const config = getRequestTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`h-6 ${className ?? ""}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
