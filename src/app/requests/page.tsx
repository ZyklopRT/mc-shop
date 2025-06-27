import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getRequests } from "~/server/actions/requests/get-requests";
import { getUserAcceptedOffers } from "~/server/actions/requests";
import { auth } from "~/server/auth";
import type { RequestWithDetails } from "~/lib/types/request";
import { RequestCard } from "~/components/requests/request-card";

// Force dynamic rendering since we use auth() which internally uses headers()
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Board</h1>
          <p className="text-muted-foreground mt-1">
            Request items or services from other players
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="negotiation">In Negotiation</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="accepted-offers">Accepted Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Suspense fallback={<RequestsLoading />}>
            <RequestsList status="OPEN" />
          </Suspense>
        </TabsContent>

        <TabsContent value="negotiation">
          <Suspense fallback={<RequestsLoading />}>
            <RequestsList status="IN_NEGOTIATION" />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed">
          <Suspense fallback={<RequestsLoading />}>
            <RequestsList status="COMPLETED" />
          </Suspense>
        </TabsContent>

        <TabsContent value="my-requests">
          <Suspense fallback={<RequestsLoading />}>
            <MyRequestsList />
          </Suspense>
        </TabsContent>

        <TabsContent value="accepted-offers">
          <Suspense fallback={<RequestsLoading />}>
            <AcceptedOffersList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RequestsListProps {
  status?: "OPEN" | "IN_NEGOTIATION" | "COMPLETED";
}

async function RequestsList({ status }: RequestsListProps) {
  try {
    // Fetch requests from database
    const result = await getRequests({
      limit: 20,
      offset: 0,
      orderBy: "createdAt",
      orderDirection: "desc",
      status: status,
    });

    if (!result.success) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load requests: {result.error}
          </p>
        </div>
      );
    }

    const { requests } = result.data as { requests: RequestWithDetails[] };

    if (!requests.length) {
      const emptyMessage = getEmptyMessage(status);
      return (
        <div className="py-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
            <Sparkles className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{emptyMessage.title}</h3>
          <p className="text-muted-foreground mb-4">
            {emptyMessage.description}
          </p>
          {status === "OPEN" && (
            <Button asChild>
              <Link href="/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Request
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return <RequestGrid requests={requests} />;
  } catch (error) {
    console.error("Error fetching requests:", error);
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          An error occurred while loading requests. Please try again later.
        </p>
      </div>
    );
  }
}

async function MyRequestsList() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please log in to view your requests.
          </p>
        </div>
      );
    }

    // Fetch user's requests from database
    const result = await getRequests({
      limit: 20,
      offset: 0,
      orderBy: "createdAt",
      orderDirection: "desc",
      requesterId: session.user.id,
    });

    if (!result.success) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load your requests: {result.error}
          </p>
        </div>
      );
    }

    const { requests } = result.data as { requests: RequestWithDetails[] };

    if (!requests.length) {
      return (
        <div className="py-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
            <Sparkles className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No requests yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first request to start trading!
          </p>
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create First Request
            </Link>
          </Button>
        </div>
      );
    }

    return <RequestGrid requests={requests} />;
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          An error occurred while loading your requests. Please try again later.
        </p>
      </div>
    );
  }
}

async function AcceptedOffersList() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please log in to view your accepted offers.
          </p>
        </div>
      );
    }

    // Fetch requests where user has accepted offers
    const result = await getUserAcceptedOffers();

    if (!result.success) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load your accepted offers: {result.error}
          </p>
        </div>
      );
    }

    const { requests } = result.data;

    if (!requests.length) {
      return (
        <div className="py-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
            <Sparkles className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No accepted offers yet</h3>
          <p className="text-muted-foreground mb-4">
            When your offers are accepted by request owners, they will appear
            here.
          </p>
        </div>
      );
    }

    return <RequestGrid requests={requests} />;
  } catch (error) {
    console.error("Error fetching accepted offers:", error);
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          An error occurred while loading your accepted offers. Please try again
          later.
        </p>
      </div>
    );
  }
}

interface RequestGridProps {
  requests: RequestWithDetails[];
}

async function RequestGrid({ requests }: RequestGridProps) {
  const session = await auth();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          id={request.id}
          title={request.title}
          description={request.description}
          type={request.requestType}
          status={request.status}
          price={request.suggestedPrice ?? undefined}
          currency={request.currency as "emeralds" | "emerald_blocks"}
          requester={request.requester.mcUsername ?? "Unknown User"}
          offerCount={request._count.offers}
          createdAt={new Date(request.createdAt).toLocaleDateString()}
          item={request.item}
          itemQuantity={request.itemQuantity}
          isOwner={session?.user?.id === request.requesterId}
        />
      ))}
    </div>
  );
}

function getEmptyMessage(status?: string) {
  switch (status) {
    case "IN_NEGOTIATION":
      return {
        title: "No negotiations active",
        description:
          "Requests in negotiation will appear here once offers are accepted.",
      };
    case "COMPLETED":
      return {
        title: "No completed requests",
        description: "Completed requests and transactions will appear here.",
      };
    case "ACCEPTED_OFFERS":
      return {
        title: "No accepted offers",
        description:
          "When your offers are accepted by request owners, they will appear here.",
      };
    case "OPEN":
    default:
      return {
        title: "No open requests",
        description: "Be the first to create a request and start trading!",
      };
  }
}

function RequestsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
