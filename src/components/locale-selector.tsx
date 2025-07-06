"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/lib/i18n/routing";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Languages } from "lucide-react";
import { useTransition } from "react";

const locales = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
] as const;

export function LocaleSelector() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === currentLocale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select
      value={currentLocale}
      onValueChange={handleLocaleChange}
      disabled={isPending}
    >
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
