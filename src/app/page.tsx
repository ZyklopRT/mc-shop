import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { PageWrapper } from "~/components/ui/page-wrapper";
import Image from "next/image";

export default async function HomePage() {
  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-section.jpeg"
          alt="Minecraft landscape background"
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
          MC <span className="text-primary">Shop</span>
        </h1>

        <p className="max-w-2xl text-center text-xl text-white/90 drop-shadow-md">
          Search for players and items across Minecraft shops
        </p>

        <div className="w-full max-w-2xl">
          <GlobalSearchBar className="w-full" />
        </div>
      </PageWrapper>
    </main>
  );
}
