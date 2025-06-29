"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { env } from "~/env";
import {
  AIGeneratedSummarySchema,
  type AIGeneratedSummary,
  type ChangelogEntry,
  type ChangelogData,
} from "~/lib/validations/modpack";
import { ChangeType } from "@prisma/client";

/**
 * Generate an AI-powered summary of a modpack changelog
 */
export async function generateChangelogSummary(
  changelog: ChangelogData,
  modpackName: string,
  version: string,
): Promise<AIGeneratedSummary | null> {
  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    console.warn(
      "OpenAI API key not configured, skipping AI summary generation",
    );
    return null;
  }

  try {
    // Prepare the data for AI analysis
    const addedMods = changelog.changes.filter(
      (change) => change.changeType === ChangeType.ADDED,
    );
    const updatedMods = changelog.changes.filter(
      (change) => change.changeType === ChangeType.UPDATED,
    );
    const removedMods = changelog.changes.filter(
      (change) => change.changeType === ChangeType.REMOVED,
    );

    // Create a structured prompt with the changelog data
    const prompt = createChangelogPrompt(
      modpackName,
      version,
      addedMods,
      updatedMods,
      removedMods,
      changelog.summary,
    );

    // Generate the AI summary using structured output
    const { object: summary } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AIGeneratedSummarySchema,
      prompt,
      temperature: 0.7,
    });

    return summary;
  } catch (error) {
    console.error("Error generating AI changelog summary:", error);
    return null;
  }
}

/**
 * Create a detailed prompt for the AI to analyze the changelog
 */
function createChangelogPrompt(
  modpackName: string,
  version: string,
  addedMods: ChangelogEntry[],
  updatedMods: ChangelogEntry[],
  removedMods: ChangelogEntry[],
  summary: {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
  },
): string {
  const prompt = `
Du bist ein Experte für Minecraft-Modpacks. Analysiere das folgende Changelog für "${modpackName}" Version ${version} und erstelle eine prägnante, informative Zusammenfassung auf Deutsch.

## Changelog Übersicht:
- Hinzugefügt: ${summary.added} Mods
- Aktualisiert: ${summary.updated} Mods  
- Entfernt: ${summary.removed} Mods
- Unverändert: ${summary.unchanged} Mods

## Hinzugefügte Mods:
${addedMods.length > 0 ? addedMods.map((mod) => `- ${mod.modName} (${mod.newVersion})`).join("\n") : "Keine"}

## Aktualisierte Mods:
${updatedMods.length > 0 ? updatedMods.map((mod) => `- ${mod.modName}: ${mod.oldVersion} → ${mod.newVersion}`).join("\n") : "Keine"}

## Entfernte Mods:
${removedMods.length > 0 ? removedMods.map((mod) => `- ${mod.modName} (${mod.oldVersion})`).join("\n") : "Keine"}

## Anweisungen:
Bestimme basierend auf den Mod-Namen und Änderungen:

1. **Focus**: Worauf sich dieses Update hauptsächlich konzentriert (z.B., "Magie und Zauberei", "Technologie und Automatisierung", "Abenteuer und Erkundung", etc.)

2. **Description**: Schreibe 1-2 ansprechende Sätze auf Deutsch, die beschreiben, was dieses Update den Spielern bringt

3. **Categories**: Wähle 1-3 Hauptkategorien, die dieses Update am besten repräsentieren:
   - MAGIC (Zaubersprüche, Magie, Verzauberungs-Mods)
   - TECHNOLOGY (Maschinen, Automatisierung, Tech-Mods)
   - ADVENTURE (Dungeons, Bosse, Erkundung)
   - EXPLORATION (Biome, Dimensionen, Weltgenerierung)
   - BUILDING (Dekoration, Konstruktion, Ästhetik)
   - UTILITY (Werkzeuge, Lebensqualität, Hilfsmittel)
   - OPTIMIZATION (Performance, Bug-Fixes)
   - COSMETIC (Visuelle Verbesserungen, Shader)
   - GAMEPLAY (Mechanik-Änderungen, Balance)
   - PERFORMANCE (Optimierungs-Mods)
   - CONTENT (Neue Items, Blöcke, Features)
   - BUGFIX (Stabilitätsverbesserungen)
   - MIXED (Diverse Änderungen verschiedener Kategorien)

4. **Highlights**: Liste 2-4 wichtige Highlights oder bemerkenswerte Ergänzungen/Änderungen auf, über die sich Spieler am meisten freuen würden

5. **Impact**: Bewerte die Gesamtauswirkung:
   - LOW: Kleine Updates, wenige Änderungen
   - MEDIUM: Moderate Updates, einige neue Inhalte
   - HIGH: Große Updates, bedeutende neue Inhalte oder Änderungen

Konzentriere dich auf das, was Spieler am meisten interessiert - neue Gameplay-Möglichkeiten, aufregende Features und Verbesserungen ihrer Spielerfahrung.

WICHTIG: Antworte komplett auf Deutsch!
`;

  return prompt;
}

/**
 * Generate a summary for a brand new modpack (no previous version)
 */
export async function generateNewModpackSummary(
  mods: Array<{
    modId: string;
    name: string;
    version: string;
    displayName?: string | null;
  }>,
  modpackName: string,
  version: string,
): Promise<AIGeneratedSummary | null> {
  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    console.warn(
      "OpenAI API key not configured, skipping AI summary generation",
    );
    return null;
  }

  try {
    const prompt = `
Du bist ein Experte für Minecraft-Modpacks. Analysiere das folgende brandneue Modpack "${modpackName}" Version ${version} und erstelle eine umfassende Zusammenfassung auf Deutsch.

## Modpack Inhalt:
Gesamte Mods: ${mods.length}

## Mod-Liste:
${mods
  .slice(0, 50)
  .map((mod) => `- ${mod.displayName ?? mod.name} (${mod.version})`)
  .join("\n")}
${mods.length > 50 ? `... und ${mods.length - 50} weitere Mods` : ""}

## Anweisungen:
Bestimme basierend auf den Mod-Namen, was dieses Modpack bietet:

1. **Focus**: Worauf sich dieses Modpack hauptsächlich konzentriert (z.B., "Magie und Abenteuer", "Technologie und Bauen", etc.)

2. **Description**: Schreibe 1-2 ansprechende Sätze auf Deutsch, die beschreiben, was dieses Modpack den Spielern bietet

3. **Categories**: Wähle 2-4 Hauptkategorien, die dieses Modpack am besten repräsentieren

4. **Highlights**: Liste 3-4 wichtige Features oder Mod-Kategorien auf, die dieses Modpack besonders machen

5. **Impact**: Da dies ein neues Modpack ist, bewerte basierend auf dem Inhaltsumfang:
   - LOW: Einfaches, fokussiertes Modpack
   - MEDIUM: Ausgewogenes Modpack mit guter Vielfalt
   - HIGH: Umfassendes Modpack mit extensivem Inhalt

Konzentriere dich darauf, was dieses Modpack einzigartig und ansprechend für Spieler macht.

WICHTIG: Antworte komplett auf Deutsch!
`;

    const { object: summary } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AIGeneratedSummarySchema,
      prompt,
      temperature: 0.7,
    });

    return summary;
  } catch (error) {
    console.error("Error generating AI new modpack summary:", error);
    return null;
  }
}
