import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@huggingface/transformers";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSIONS = 384;
const BATCH_SIZE = 50;
const MAX_DESCRIPTION_LENGTH = 1200;
const PROJECT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

type StampEmbeddingSource = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
};

loadEnvConfig(PROJECT_ROOT);

function getArguments(): { refreshAll: boolean; help: boolean } {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter(
    (arg) => arg !== "--refresh" && arg !== "--help"
  );

  if (unknownArgs.length > 0) {
    throw new Error(`Unsupported argument(s): ${unknownArgs.join(", ")}`);
  }

  return {
    refreshAll: args.includes("--refresh"),
    help: args.includes("--help"),
  };
}

function getEmbeddingText(stamp: StampEmbeddingSource): string {
  const fields = [
    `Title: ${stamp.name.trim()}`,
    stamp.theme?.trim() ? `Theme: ${stamp.theme.trim()}` : null,
    stamp.description?.trim()
      ? `Description: ${stamp.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)}`
      : null,
  ];

  return fields.filter((field): field is string => field !== null).join("\n");
}

async function main() {
  const { refreshAll, help } = getArguments();
  if (help) {
    console.log(
      "Usage: npm run embeddings:update [-- --refresh]\n" +
        "Default: generate embeddings for rows where embedding is null.\n" +
        "--refresh: regenerate embeddings for all stamp rows."
    );
    return;
  }
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local or the process environment."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const embed = await pipeline("feature-extraction", MODEL_ID, {
    device: "cpu",
  });

  let lastId: string | null = null;
  let processed = 0;
  let failures = 0;

  console.log(
    `${refreshAll ? "Refreshing all" : "Generating missing"} stamp embeddings with ${MODEL_ID}.`
  );

  while (true) {
    let query = supabase
      .from("stamps")
      .select("id, name, theme, description")
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (lastId) {
      query = query.gt("id", lastId);
    }
    if (!refreshAll) {
      query = query.is("embedding", null);
    }

    const { data: stamps, error: fetchError } = await query;
    if (fetchError) {
      throw new Error(`Unable to fetch stamp records: ${fetchError.message}`);
    }
    if (!stamps) {
      throw new Error("The stamp query returned no data.");
    }
    if (stamps.length === 0) {
      break;
    }

    for (const stamp of stamps) {
      lastId = stamp.id;

      try {
        const output = await embed(getEmbeddingText(stamp), {
          pooling: "mean",
          normalize: true,
        });
        const embedding = Array.from(output.data);

        if (
          embedding.length !== EMBEDDING_DIMENSIONS ||
          !embedding.every(Number.isFinite)
        ) {
          throw new Error(
            `Expected ${EMBEDDING_DIMENSIONS} finite values; received ${embedding.length}.`
          );
        }

        const vector = `[${embedding.join(",")}]`;
        const { error: updateError } = await supabase
          .from("stamps")
          .update({ embedding: vector })
          .eq("id", stamp.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        processed++;
      } catch (error) {
        failures++;
        console.error(
          `Failed to update embedding for stamp ${stamp.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`Processed ${processed}; failures ${failures}.`);
  }

  console.log(`Embedding run finished: ${processed} updated; ${failures} failed.`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    "Embedding update failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
