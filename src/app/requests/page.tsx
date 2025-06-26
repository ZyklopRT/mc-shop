import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getRequests } from "~/server/actions/requests/get-requests";
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

      <Suspense fallback={<RequestsLoading />}>
        <RequestsList />
      </Suspense>
    </div>
  );
}

async function RequestsList() {
  try {
    // Get current user session
    const session = await auth();

    // Fetch requests from database
    const result = await getRequests({
      limit: 20,
      offset: 0,
      orderBy: "createdAt",
      orderDirection: "desc",
      status: "OPEN", // Show open requests by default
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
      return (
        <div className="py-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
            <Sparkles className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No requests yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a request and start trading!
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
