import { createClient } from "@/lib/supabase/server";

// A minimal first query: cities are public data (RLS policy
// "Public can view cities" — see the initial_schema migration),
// so this works even with no user logged in.
export default async function Home() {
  const supabase = await createClient();

  const { data: cities, error } = await supabase
    .from("cities")
    .select("id, name, slug, areas(count), societies(count)")
    .order("name");

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 py-16 px-16 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          OwnerToBuyer — Supabase connection check
        </h1>

        {error ? (
          <p className="text-red-600">
            Query failed: {error.message}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cities?.map((city) => (
              <li
                key={city.id}
                className="rounded border border-black/[.08] px-4 py-3 text-black dark:border-white/[.145] dark:text-zinc-50"
              >
                <span className="font-medium">{city.name}</span>{" "}
                <span className="text-zinc-500">({city.slug})</span> —{" "}
                {city.areas[0]?.count ?? 0} areas,{" "}
                {city.societies[0]?.count ?? 0} societies
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
