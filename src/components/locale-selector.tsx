"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "~/lib/i18n/routing";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Languages } from "lucide-react";

const locales = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
] as const;

export function LocaleSelector() {
  const pathname = usePathname(); // provided by next-intl, strips locale prefix
  const currentLocale = useLocale();

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === currentLocale) return;

    const segments = pathname.split("/").filter(Boolean);
    segments[0] = nextLocale;
    const newPath = `/${segments.join("/")}`;

    // Force full reload to re-trigger Next.js layout + message loading
    window.location.href = newPath;
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="h-9 w-[120px]">
        <Languages className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
