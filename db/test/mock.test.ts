import { describe, expect, it } from "vitest";
import { mock } from "../mock";
import { sql } from "drizzle-orm";
import { linksTable } from "../schema";

describe("Check the mocked database context function.", () => {
  console.log("asdfafsd");

  it("should create the correct tables during the migration.", () => {
    mock(async (db) => {
      const result = await db.run(sql`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
      `);

      result.rows.forEach(({ name }) => {
        expect(["__drizzle_migrations", "Groups", "Links"])
          .toContain(name);
      });
    });
  });

  it("should insert an entry without any problem.", () => {
    const values = { id: "7a02e72b", target: "https://example.com" };

    // Execute it two times to check if those two are isolated or not.
    for (let i = 0; i < 2; ++i)
      mock(async (db) => {
        await db
          .insert(linksTable)
          .values(values);

        const [result] = await db
          .select({
            id: linksTable.id,
            target: linksTable.target,
          })
          .from(linksTable);

        expect(result).toStrictEqual(values);
      });
  });
});
