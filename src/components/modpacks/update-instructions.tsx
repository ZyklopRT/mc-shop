"use client";

import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

interface UpdateInstructionsProps {
  modpackName: string;
  modpackVersion: string;
  downloadUrl: string;
  previousModLoaderVersion?: string;
  currentModLoaderVersion?: string;
}

export function UpdateInstructions({
  modpackName,
  modpackVersion,
  downloadUrl,
  previousModLoaderVersion,
  currentModLoaderVersion,
}: UpdateInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const modLoaderChanged = previousModLoaderVersion !== currentModLoaderVersion;

  const instructions = `Freunde des gepflegten Minecrafts:

Für das Update auf ${modpackName} v${modpackVersion} müsst Ihr folgende Schritte durchführen.
Tipp: Vielleicht vorher nochmal ein Backup anlegen. (Rechtsklick auf das CurseForge Profil und dann "Ordner öffnen" und alles aus diesem Ordner an einem sicheren Ort kopieren)

${modLoaderChanged ? `⚠️ WICHTIG: Die Mod Loader Version hat sich geändert (${previousModLoaderVersion} → ${currentModLoaderVersion}). Möglicherweise müsst ihr ein neues Profil erstellen.\n` : ""}
1. Besucht folgenden Link: ${downloadUrl}
   und ladet euch die ZIP-Datei herunter.
2. Öffnet CurseForge
3. Macht Rechtsklick auf euer Profil über das ihr das Modpack aktuell startet.
4. Wählt "Ordner öffnen" / "Open Folder" aus
5. Löscht den mods Ordner
6. Öffnet die eben heruntergeladene ZIP-Datei
7. Kopiert den mods Ordner aus der ZIP-Datei an die Stelle wo ihr den anderen eben gelöscht habt
8. Viel Spaß!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      toast.success("Anleitung in die Zwischenablage kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Fehler beim Kopieren in die Zwischenablage");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Update-Anleitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="font-mono text-sm whitespace-pre-wrap">
            <p className="font-semibold">Freunde des gepflegten Minecrafts:</p>
            <br />
            <p>
              Für das Update auf{" "}
              <strong>
                {modpackName} v{modpackVersion}
              </strong>{" "}
              müsst Ihr folgende Schritte durchführen.
            </p>
            <p className="text-muted-foreground">
              Tipp: Vielleicht vorher nochmal ein Backup anlegen. (Rechtsklick
              auf das CurseForge Profil und dann &quot;Ordner öffnen&quot; und
              alles aus diesem Ordner an einem sicheren Ort kopieren)
            </p>
            <br />

            {modLoaderChanged && (
              <div className="mb-4 rounded border-l-4 border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ WICHTIG: Die Mod Loader Version hat sich geändert (
                  {previousModLoaderVersion} → {currentModLoaderVersion}).
                  Möglicherweise müsst ihr ein neues Profil erstellen.
                </p>
              </div>
            )}

            <ol className="list-decimal space-y-2 pl-6">
              <li>
                Besucht folgenden Link: <strong>{downloadUrl}</strong>
                <br />
                und ladet euch die ZIP-Datei herunter.
              </li>
              <li>Öffnet CurseForge</li>
              <li>
                Macht Rechtsklick auf euer Profil über das ihr das Modpack
                aktuell startet.
              </li>
              <li>
                Wählt &quot;Ordner öffnen&quot; / &quot;Open Folder&quot; aus
              </li>
              <li>Löscht den mods Ordner</li>
              <li>Öffnet die eben heruntergeladene ZIP-Datei</li>
              <li>
                Kopiert den mods Ordner aus der ZIP-Datei an die Stelle wo ihr
                den anderen eben gelöscht habt
              </li>
              <li>Viel Spaß!</li>
            </ol>
          </div>
        </div>

        <Button variant="outline" onClick={copyToClipboard} className="w-full">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Kopiert!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Anleitung kopieren (für WhatsApp)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
