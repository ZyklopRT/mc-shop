"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { PageWrapper } from "~/components/ui/page-wrapper";

export default function TestItemsPage() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testImport = async () => {
    setIsLoading(true);
    setResult("Starting test...");

    try {
      // Import the action function
      const { bulkImportItemsFromFile } = await import(
        "~/server/actions/item-actions"
      );

      setResult("Running import...");
      const importResult = await bulkImportItemsFromFile();

      if (importResult.success) {
        setResult(
          `Success! Imported: ${importResult.imported}, Updated: ${importResult.updated}, Total: ${importResult.total}`,
        );
      } else {
        setResult(`Error: ${importResult.error}`);
      }
    } catch (error) {
      setResult(
        `Exception: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="mb-8 text-3xl font-bold">Test Items Import</h1>

      <div className="space-y-4">
        <Button onClick={testImport} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Test Import"}
        </Button>

        {result && (
          <div className="rounded-md border bg-gray-50 p-4">
            <h2 className="mb-2 font-semibold">Result:</h2>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
