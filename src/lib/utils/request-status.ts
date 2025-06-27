import {
  Package,
  MessageCircle,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  HandHeart,
} from "lucide-react";
import type {
  RequestStatus,
  RequestType,
  OfferStatus,
  MessageType,
} from "~/lib/types/request";

export const REQUEST_STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
  IN_NEGOTIATION: {
    label: "In Negotiation",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  },
} as const;

export const OFFER_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "border-yellow-300 text-yellow-600",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "border-green-300 text-green-600",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "border-red-300 text-red-600",
    icon: XCircle,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "border-gray-300 text-gray-600",
    icon: XCircle,
  },
} as const;

export const REQUEST_TYPE_CONFIG = {
  ITEM: {
    label: "Item Request",
    icon: Package,
    variant: "default" as const,
  },
  GENERAL: {
    label: "Service Request",
    icon: MessageCircle,
    variant: "secondary" as const,
  },
} as const;

export const MESSAGE_TYPE_CONFIG = {
  MESSAGE: {
    label: "Message",
    icon: MessageCircle,
    color: "text-blue-600",
  },
  COUNTER_OFFER: {
    label: "Counter Offer",
    icon: DollarSign,
    color: "text-orange-600",
  },
  ACCEPT: {
    label: "Accepted",
    icon: CheckCircle,
    color: "text-green-600",
  },
  REJECT: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600",
  },
  OFFER: {
    label: "Offer",
    icon: HandHeart,
    color: "text-purple-600",
  },
} as const;

export const CURRENCY_CONFIG = {
  emeralds: {
    label: "Emeralds",
    shortLabel: "E",
    icon: Coins,
    iconColor: "text-green-500",
    bgColor: "bg-green-500",
  },
  emerald_blocks: {
    label: "Emerald Blocks",
    shortLabel: "EB",
    icon: "emerald_block" as const,
    iconColor: "text-green-600",
    bgColor: "bg-green-600",
  },
} as const;

export function getRequestStatusConfig(status: RequestStatus) {
  return REQUEST_STATUS_CONFIG[status];
}

export function getOfferStatusConfig(status: OfferStatus) {
  return OFFER_STATUS_CONFIG[status];
}

export function getRequestTypeConfig(type: RequestType) {
  return REQUEST_TYPE_CONFIG[type];
}

export function getMessageTypeConfig(type: MessageType) {
  return MESSAGE_TYPE_CONFIG[type];
}

export function getCurrencyConfig(currency: string) {
  if (currency === "emerald_blocks") {
    return CURRENCY_CONFIG.emerald_blocks;
  }
  return CURRENCY_CONFIG.emeralds;
}

export function formatPrice(
  price: number | null | undefined,
  currency: string,
): string {
  if (price === null || price === undefined) {
    return "Not specified";
  }

  const currencyConfig = getCurrencyConfig(currency);
  return `${price.toLocaleString()} ${currencyConfig.label}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function canEditRequest(status: RequestStatus): boolean {
  return ["OPEN", "CANCELLED"].includes(status);
}

export function canDeleteRequest(status: RequestStatus): boolean {
  return ["OPEN", "CANCELLED"].includes(status);
}

export function canMakeOffer(status: RequestStatus): boolean {
  return status === "OPEN";
}

export function canUpdateOffer(
  offerStatus: OfferStatus,
  requestStatus: RequestStatus,
): boolean {
  return (
    offerStatus === "PENDING" &&
    (requestStatus === "OPEN" || requestStatus === "IN_NEGOTIATION")
  );
}
