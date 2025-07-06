"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { ArrowLeft } from "lucide-react";
import { Link } from "~/lib/i18n/routing";
import { useRouter } from "~/lib/i18n/routing";
import { useTranslations } from "next-intl";
import { createRequest } from "~/server/actions/requests";
import { RequestForm } from "~/components/requests";

export default function NewRequestPage() {
  const router = useRouter();
  const t = useTranslations("page.requests-new");

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToRequests")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.cardTitle")}</CardTitle>
          <CardDescription>{t("form.cardDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <RequestForm
            mode="create"
            createRequestAction={createRequest}
            onSuccess={(requestId) => {
              router.push(`/requests/${requestId}`);
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
