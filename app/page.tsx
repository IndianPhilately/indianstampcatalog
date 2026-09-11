import { supabase } from '../lib/supabaseClient'

export default async function Home() {
  // Fetch first 5 stamps from Supabase
  const { data: stamps, error } = await supabase
    .from('stamps')
    .select('*')
    .limit(5)

  if (error) {
    return <div>Error loading stamps: {error.message}</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl py-16 px-8">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
          Indian Stamp Catalog
        </h1>
        <ul className="space-y-4">
          {stamps?.map(stamp => (
            <li key={stamp.id} className="p-4 border rounded bg-white dark:bg-zinc-800">
              <p className="font-semibold">{stamp.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Issued: {stamp.issue_date}
              </p>
              {stamp.image_url && (
                <img
                  src={stamp.image_url}
                  alt={stamp.name}
                  className="mt-2 h-24 object-contain"
                />
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
