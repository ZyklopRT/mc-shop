"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PageWrapper } from "~/components/ui/page-wrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Link } from "~/lib/i18n/routing";
import { toast } from "sonner";
import {
  getRequestDetails,
  updateRequest,
  deleteRequest,
} from "~/server/actions/requests";
import { RequestForm } from "~/components/requests";
import type { RequestFormData } from "~/lib/hooks/use-request-form";
import { canDeleteRequest } from "~/lib/utils/request-status";
import type { RequestWithFullDetails } from "~/lib/types/request";

interface EditRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRequestPage({ params }: EditRequestPageProps) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<RequestFormData>>({});
  const [requestData, setRequestData] = useState<RequestWithFullDetails | null>(
    null,
  );
  const router = useRouter();
  const t = useTranslations("page.requests-edit");

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      setRequestId(id);
    };
    void loadParams();
  }, [params]);

  const loadRequestData = useCallback(
    async (id: string) => {
      try {
        const result = await getRequestDetails({ requestId: id });

        if (!result.success) {
          if (result.error === "Request not found") {
            notFound();
          }
          throw new Error(result.error);
        }

        const request = result.data.request;

        setRequestData(request);
        setInitialData({
          title: request.title,
          description: request.description,
          requestType: request.requestType,
          selectedItem: request.item,
          itemQuantity: request.itemQuantity ?? undefined,
          suggestedPrice: request.suggestedPrice ?? undefined,
          currency: request.currency as "emeralds" | "emerald_blocks",
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading request:", error);
        toast.error(t("toast.loadFailed"));
        router.push("/requests");
      }
    },
    [router],
  );

  useEffect(() => {
    if (requestId) {
      void loadRequestData(requestId);
    }
  }, [requestId, loadRequestData]);

  const handleDeleteRequest = async () => {
    if (!requestId) return;

    setIsDeleting(true);
    try {
      const result = await deleteRequest(requestId);
      if (result.success) {
        toast.success(t("toast.deleted"));
        router.push("/requests");
      } else {
        toast.error(result.error || t("toast.deleteFailed"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("toast.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !requestId) {
    return (
      <PageWrapper className="max-w-2xl">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToRequests")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t("loading")}</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" asChild className="mb-4">
              <Link href={`/requests/${requestId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToRequest")}
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          {/* Delete Request Button */}
          {requestData && canDeleteRequest(requestData.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {t("deleteRequest")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteDialog.description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("deleteDialog.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteRequest}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("deleteDialog.deleteRequest")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.cardTitle")}</CardTitle>
          <CardDescription>{t("form.cardDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <RequestForm
            mode="edit"
            requestId={requestId}
            initialData={initialData}
            updateRequestAction={updateRequest}
            onSuccess={(id) => {
              router.push(`/requests/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
