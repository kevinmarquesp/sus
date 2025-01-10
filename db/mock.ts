import { createClient } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

/** Used to create a in-memory context for unit testing with Drizzle and Sqlite3. */
const mock = async (exec: (db: LibSQLDatabase) => Promise<void>) => {
  const client = createClient({
    url: "file::memory:",
  });

  const db = drizzle({ client });

  await migrate(db, { migrationsFolder: "./drizzle" });
  await exec(db);

  client.close();
};

export { mock };
