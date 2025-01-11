import { describe, it, expect } from "vitest";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { RetrieveService } from "../retrieve-service";
import { linksTable } from "@/db/schema";
import { mock } from "@/db/mock";
import { eq } from "drizzle-orm";

describe("RetrieveService", () => {
  it("should throw an error with valid props", () => {
    const mockDb = {} as LibSQLDatabase;
    const invalidProps = { id: "1234-5678" };

    expect(() => new RetrieveService(mockDb, invalidProps)).toThrow();
  });

  it("should not throw an error with valid props", () => {
    const mockDb = {} as LibSQLDatabase;
    const validProps = { id: "f3_923-3" };

    expect(() => new RetrieveService(mockDb, validProps)).not.toThrow();
  });

  it("retrieves and updates a record when a valid ID is provided", () => {
    mock(async (db) => {
      const id = "ed8b6d12";

      // Insert a record to retrieve
      await db.insert(linksTable).values({
        id,
        target: "https://example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const retrieveService = new RetrieveService(db, { id });
      const result = await retrieveService.run();

      // Assert the result matches the expected structure
      expect(result).toHaveProperty("id", id);
      expect(result).toHaveProperty("groupId");
      expect(result).toHaveProperty("target", "https://example.com");
      expect(result).toHaveProperty("createdAt");

      // Verify the updated timestamp
      const [dbEntry] = await db
        .select()
        .from(linksTable)
        .where(eq(linksTable.id, id));

      expect(dbEntry).toBeDefined();
      expect(new Date(dbEntry.updatedAt).getTime())
        .toBeGreaterThan(new Date(dbEntry.createdAt).getTime());
    });
  });

  it("throws an error if the ID does not exist", () => {
    mock(async (db) => {
      const id = "487d9c00";
      const retrieveService = new RetrieveService(db, { id });

      await expect(retrieveService.run()).rejects.toThrow("Target ID not found");
    });
  });
});
