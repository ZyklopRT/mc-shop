import { Suspense } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { ArrowLeft } from "lucide-react";
import { Link } from "~/lib/i18n/routing";
import { auth } from "~/server/auth";
import {
  getRequestDetails,
  createOffer,
  updateOffer,
  sendNegotiationMessage,
  completeRequest,
  deleteRequest,
} from "~/server/actions/requests";
import { RequestDetails } from "~/components/requests";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface RequestDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const { id } = await params;
  const t = await getTranslations("page.requests-id");

  return (
    <PageWrapper className="max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToRequests")}
          </Link>
        </Button>
      </div>

      <Suspense fallback={<RequestDetailsLoading />}>
        <RequestDetailsContent requestId={id} />
      </Suspense>
    </PageWrapper>
  );
}

async function RequestDetailsContent({ requestId }: { requestId: string }) {
  const session = await auth();
  const t = await getTranslations("page.requests-id");

  try {
    const result = await getRequestDetails({ requestId });

    if (!result.success) {
      if (result.error === "Request not found") {
        notFound();
      }
      throw new Error(result.error);
    }

    const request = result.data.request;

    // For ACCEPTED requests, only allow access to requester and accepted offerer
    if (request.status === "ACCEPTED" && session?.user?.id) {
      const isRequester = session.user.id === request.requesterId;

      // Find the accepted offerer from negotiation messages
      const acceptedOffererMessage = request.negotiation?.messages.find(
        (msg) =>
          msg.messageType === "ACCEPT" && msg.sender.id !== request.requesterId,
      );
      const isAcceptedOfferer =
        acceptedOffererMessage?.sender.id === session.user.id;

      if (!isRequester && !isAcceptedOfferer) {
        notFound();
      }
    }

    return (
      <RequestDetails
        initialRequest={request}
        currentUserId={session?.user?.id}
        actions={{
          createOffer,
          updateOffer,
          sendNegotiationMessage,
          completeRequest,
          deleteRequest,
        }}
      />
    );
  } catch (error) {
    console.error("Error loading request:", error);
    return (
      <div className="py-12 text-center">
        <h2 className="text-foreground mb-2 text-xl font-semibold">
          {t("errorLoadingRequest")}
        </h2>
        <p className="text-muted-foreground">{t("failedToLoadRequest")}</p>
        <Button asChild className="mt-4">
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToRequests")}
          </Link>
        </Button>
      </div>
    );
  }
}

function RequestDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <Skeleton className="mb-3 h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <Skeleton className="mb-3 h-6 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="py-8 text-center">
          <Skeleton className="mx-auto h-5 w-64" />
        </div>
      </div>
    </div>
  );
}
