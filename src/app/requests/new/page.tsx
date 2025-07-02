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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRequest } from "~/server/actions/requests";
import { RequestForm } from "~/components/requests";

export default function NewRequestPage() {
  const router = useRouter();

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Request</h1>
        <p className="text-muted-foreground">
          Request items or services from other players
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Fill out the form below to create your request. Be specific about
            what you need.
          </CardDescription>
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
