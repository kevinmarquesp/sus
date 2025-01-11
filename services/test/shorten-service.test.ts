import { mock } from "@/db/mock";
import { ShortenService } from "../shorten-service";
import { linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { describe, it, expect } from "vitest";

describe("ShortenService", () => {
  it("creates a new shortened URL if the target URL does not exist", async () => {
    await mock(async (db) => {
      const target = "https://example.com";
      const shortenService = new ShortenService(db, { target });

      const result = await shortenService.run();

      // Assert the result matches the expected structure
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("target", target);

      // Verify the database contains the new entry
      const [dbEntry] = await db
        .select()
        .from(linksTable)
        .where(eq(linksTable.target, target));

      expect(dbEntry).toBeDefined();
      expect(dbEntry.target).toBe(target);
    });
  });

  it("returns an existing shortened URL if the target URL already exists", async () => {
    await mock(async (db) => {
      const target = "https://example.com";

      // Insert an existing record
      await db.insert(linksTable).values({ id: "ec451341", target });

      const shortenService = new ShortenService(db, { target });
      const result = await shortenService.run();

      // Assert that the existing record is returned
      expect(result).toHaveProperty("id", "ec451341");
      expect(result).toHaveProperty("target", target);

      // Ensure no duplicate entries were created
      const entries = await db
        .select()
        .from(linksTable)
        .where(eq(linksTable.target, target));

      expect(entries).toHaveLength(1);
    });
  });

  it("throws an error if the target URL is invalid", async () => {
    await mock(async (db) => {
      const target = "invalid-url";

      // Attempt to create a service with an invalid URL
      expect(() => new ShortenService(db, { target })).toThrow();
    });
  });
});
