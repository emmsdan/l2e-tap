import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.LOVABLE_DB_MIGRATION_URL;

let client: ReturnType<typeof postgres> | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!connectionString) {
    return null;
  }

  if (!dbInstance) {
    // Disable prefetch as recommended for serverless / edge environments
    client = postgres(connectionString, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

export { schema };
