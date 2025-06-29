"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Download } from "lucide-react";
import { DownloadModal } from "./download-modal";

interface DownloadLatestButtonProps {
  modpackName: string;
  modpackVersion: string;
  fileSize?: number;
}

export function DownloadLatestButton({
  modpackName,
  modpackVersion,
  fileSize,
}: DownloadLatestButtonProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  return (
    <>
      <Button onClick={handleDownloadClick}>
        <Download className="mr-2 h-4 w-4" />
        Download Latest
      </Button>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        downloadUrl={`/api/modpacks/latest/${encodeURIComponent(modpackName)}/download`}
        fileName={`${modpackName}-${modpackVersion}-mods.zip`}
        fileSize={fileSize}
      />
    </>
  );
}
