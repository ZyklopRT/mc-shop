import type {
  Request,
  RequestOffer,
  RequestNegotiation,
  NegotiationMessage,
  User,
  MinecraftItem,
  RequestType,
  RequestStatus,
  OfferStatus,
  NegotiationStatus,
  MessageType,
} from "@prisma/client";

// Base types with relations
export type RequestWithDetails = Request & {
  requester: Pick<User, "id" | "mcUsername">;
  item?: MinecraftItem | null;
  _count: {
    offers: number;
  };
};

export type RequestWithOffers = Request & {
  requester: Pick<User, "id" | "mcUsername">;
  item?: MinecraftItem | null;
  offers: (RequestOffer & {
    offerer: Pick<User, "id" | "mcUsername">;
  })[];
};

export type RequestWithFullDetails = Request & {
  requester: Pick<User, "id" | "mcUsername">;
  item?: MinecraftItem | null;
  offers: (RequestOffer & {
    offerer: Pick<User, "id" | "mcUsername">;
  })[];
  negotiation?:
    | (RequestNegotiation & {
        messages: (NegotiationMessage & {
          sender: Pick<User, "id" | "mcUsername">;
        })[];
      })
    | null;
};

export type RequestOfferWithDetails = RequestOffer & {
  offerer: Pick<User, "id" | "mcUsername">;
  request: Pick<Request, "id" | "title" | "requesterId" | "status">;
  currency: string;
};

export type NegotiationWithDetails = RequestNegotiation & {
  request: Request & {
    requester: Pick<User, "id" | "mcUsername">;
    item?: MinecraftItem | null;
  };
  messages: (NegotiationMessage & {
    sender: Pick<User, "id" | "mcUsername">;
  })[];
};

export type NegotiationMessageWithSender = NegotiationMessage & {
  sender: Pick<User, "id" | "mcUsername">;
};

// Action result types (following your pattern)
export type RequestActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

// List response types
export type RequestListResponse = {
  requests: RequestWithDetails[];
  total: number;
  hasMore: boolean;
};

export type RequestDetailsResponse = {
  request: RequestWithFullDetails;
};

// Search result types
export type RequestSearchResult = {
  id: string;
  title: string;
  description: string;
  requestType: RequestType;
  status: RequestStatus;
  suggestedPrice?: number | null;
  currency: string;
  createdAt: Date;
  requester: {
    id: string;
    mcUsername: string;
  };
  item?: {
    id: string;
    nameEn: string;
    filename: string;
  } | null;
  offerCount: number;
};

// Form types for UI components
export type RequestFormData = {
  title: string;
  description: string;
  requestType: RequestType;
  itemId?: string;
  itemQuantity?: number;
  suggestedPrice?: number;
  currency: "emeralds" | "emerald_blocks";
};

export type OfferFormData = {
  requestId: string;
  offeredPrice?: number;
  message?: string;
};

export type NegotiationMessageFormData = {
  negotiationId: string;
  messageType: MessageType;
  content: string;
  priceOffer?: number;
};

// Filter and sorting types
export type RequestFilters = {
  status?: RequestStatus;
  requestType?: RequestType;
  requesterId?: string;
  itemId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type RequestSortOptions = {
  orderBy: "createdAt" | "updatedAt" | "suggestedPrice";
  orderDirection: "asc" | "desc";
};

// Utility types
export type RequestSummary = {
  id: string;
  title: string;
  status: RequestStatus;
  requestType: RequestType;
  createdAt: Date;
  offerCount: number;
};

export type UserRequestStats = {
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  totalOffers: number;
  acceptedOffers: number;
};

// Status transition types
export type RequestStatusTransition = {
  from: RequestStatus;
  to: RequestStatus;
  allowedBy: "requester" | "offerer" | "system";
};

export type OfferStatusTransition = {
  from: OfferStatus;
  to: OfferStatus;
  allowedBy: "requester" | "offerer";
};

// Export enums for convenience
export type {
  RequestType,
  RequestStatus,
  OfferStatus,
  NegotiationStatus,
  MessageType,
};
