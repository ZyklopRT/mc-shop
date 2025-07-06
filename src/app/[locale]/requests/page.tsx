import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PageHeader } from "~/components/ui/page-header";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { Plus, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "~/lib/i18n/routing";
import { getRequests } from "~/server/actions/requests/get-requests";
import { auth } from "~/server/auth";
import type { RequestWithDetails } from "~/lib/types/request";
import { RequestCard } from "~/components/requests/request-card";

// Force dynamic rendering since we use auth() which internally uses headers()
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  return (
    <PageWrapper>
      <PageHeader
        icon={<MessageSquare className="h-8 w-8" />}
        title="Request Board"
        description="Request items or services from other players"
        actions={
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="open" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="bg-muted text-muted-foreground inline-flex h-10 w-max items-center justify-center rounded-md p-1">
            <TabsTrigger value="open" className="whitespace-nowrap">
              Open
            </TabsTrigger>
            <TabsTrigger value="negotiation" className="whitespace-nowrap">
              In Negotiation
            </TabsTrigger>
            <TabsTrigger value="accepted" className="whitespace-nowrap">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Completed
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="whitespace-nowrap">
              My Requests
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="accepted">
          <Suspense fallback={<RequestsLoading />}>
            <RequestsList status="ACCEPTED" />
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
      </Tabs>
    </PageWrapper>
  );
}

interface RequestsListProps {
  status?: "OPEN" | "IN_NEGOTIATION" | "ACCEPTED" | "COMPLETED";
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
    case "ACCEPTED":
      return {
        title: "No accepted requests",
        description:
          "Requests that have been agreed upon and are awaiting completion will appear here.",
      };
    case "COMPLETED":
      return {
        title: "No completed requests",
        description: "Completed requests and transactions will appear here.",
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
