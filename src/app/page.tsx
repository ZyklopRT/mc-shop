import { GlobalSearchBar } from "~/components/search/global-search-bar";

export default async function HomePage() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-foreground text-5xl font-extrabold tracking-tight sm:text-[6rem]">
          MC <span className="text-primary">Shop</span>
        </h1>

        <p className="text-muted-foreground max-w-2xl text-center text-xl">
          Search for players and items across Minecraft shops
        </p>

        <div className="w-full max-w-2xl">
          <GlobalSearchBar className="w-full" />
        </div>
      </div>
    </main>
  );
}
