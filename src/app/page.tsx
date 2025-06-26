import { GlobalSearchBar } from "~/components/search/global-search-bar";

export default async function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-[6rem]">
          MC <span className="text-blue-600">Shop</span>
        </h1>

        <p className="max-w-2xl text-center text-xl text-gray-600">
          Search for players and items across Minecraft shops
        </p>

        <div className="w-full max-w-2xl">
          <GlobalSearchBar className="w-full" />
        </div>
      </div>
    </main>
  );
}
