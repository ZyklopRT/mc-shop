"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { usePathname, useRouter } from "~/lib/i18n/routing";

const locales = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
] as const;

export function LocaleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  console.log("currentLocale", currentLocale);
  const handleLocaleChange = (locale: string) => {
    if (locale === currentLocale) return;

    startTransition(() => {
      const segments = pathname.split("/");
      segments[1] = locale;
      const newPath = segments.join("/");
      router.push(newPath);
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
        {locales.map((locale) => (
          <SelectItem key={locale.code} value={locale.code}>
            {locale.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
