import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";

import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { PageWrapper } from "~/components/ui/page-wrapper";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.homepage" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  const t = useTranslations("homepage");

  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-section.jpeg"
          alt={t("heroAlt")}
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
          priority
          quality={100}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <PageWrapper className="relative z-10 flex flex-col items-center justify-center gap-8 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-[6rem]">
          {t("title")}
        </h1>

        <p className="max-w-2xl text-center text-xl text-white/90 drop-shadow-md">
          {t("subtitle")}
        </p>

        <div className="w-full max-w-2xl">
          <GlobalSearchBar className="w-full" />
        </div>
      </PageWrapper>
    </main>
  );
}
