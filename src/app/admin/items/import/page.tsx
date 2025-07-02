"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import {
  bulkImportItemsFromFile,
  getItemsStats,
} from "~/server/actions/item-actions";

interface ImportResult {
  success: boolean;
  error?: string;
  total?: number;
  imported?: number;
  updated?: number;
}

interface ItemStats {
  total: number;
  availableInShops: number;
  withoutShops: number;
}

export default function ImportItemsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ItemStats | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await bulkImportItemsFromFile();
      setImportResult(result);

      // Refresh stats after import
      if (result.success) {
        const statsResult = await getItemsStats();
        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const loadStats = async () => {
    const statsResult = await getItemsStats();
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    }
  };

  return (
    <PageWrapper className="max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold">Import Minecraft Items</h1>

      {/* Current Stats */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Current Database Stats</h2>
        {stats ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-muted-foreground text-sm">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.availableInShops}
              </div>
              <div className="text-muted-foreground text-sm">In Shops</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-2xl font-bold">
                {stats.withoutShops}
              </div>
              <div className="text-muted-foreground text-sm">Not in Shops</div>
            </div>
          </div>
        ) : (
          <Button onClick={loadStats} variant="outline">
            Load Stats
          </Button>
        )}
      </Card>

      {/* Import Section */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Import Items from JSON</h2>
        <p className="text-muted-foreground mb-4">
          This will import all items from the{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5">
            public/items.json
          </code>{" "}
          file. Existing items will be updated with new data.
        </p>

        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? "Importing..." : "Start Import"}
        </Button>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Import Results</h2>
          {importResult.success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-green-800">
                <h3 className="font-semibold">Import Successful!</h3>
                <ul className="mt-2 space-y-1">
                  <li>Total items processed: {importResult.total}</li>
                  <li>New items imported: {importResult.imported}</li>
                  <li>Existing items updated: {importResult.updated}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-red-800">
                <h3 className="font-semibold">Import Failed</h3>
                <p className="mt-2">{importResult.error}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Instructions</h2>
        <div className="text-muted-foreground space-y-3 text-sm">
          <p>
            1. Make sure your{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              public/items.json
            </code>{" "}
            file contains the item data in the correct format.
          </p>
          <p>
            2. Ensure the corresponding image files are in the{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              public/items/default/
            </code>{" "}
            and{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              public/items/sphax/
            </code>{" "}
            directories.
          </p>
          <p>
            3. Click &ldquo;Start Import&rdquo; to begin the import process.
            This may take a few minutes for large datasets.
          </p>
          <p>
            4. The import process will create new items or update existing ones
            based on their ID.
          </p>
        </div>
      </Card>
    </PageWrapper>
  );
}
