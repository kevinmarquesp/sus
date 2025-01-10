import { createClient } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";

/** Used to create a inmemory context for unit testing. */
const mock = async (exec: (db: LibSQLDatabase) => Promise<void>) => {
  const client = createClient({
    url: "file::memory:?cache=shared",
  });

  const db = drizzle({ client });

  await exec(db);

  client.close();
};

export { mock };
