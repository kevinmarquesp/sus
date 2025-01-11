import { mock } from "@/db/mock";
import { RetrieveGroupService } from "@/services/retrieve-group-service";
import { groupsTable, linksTable } from "@/db/schema";
import { describe, it, expect } from "vitest";
import { LibSQLDatabase } from "drizzle-orm/libsql";

describe("RetrieveGroupService", () => {
  it("retrieves a group and its children if they exist", () => {
    mock(async (db) => {
      const groupId = "group123";
      const group = {
        id: groupId,
        password: "securepassword",
      };
      const children = [
        { id: "9b235dbb", groupId, target: "https://example1.com" },
        { id: "8e720b89", groupId, target: "https://example2.com" },
      ];

      // Insert mock data
      await db.insert(groupsTable).values(group);
      await db.insert(linksTable).values(children);

      const retrieveGroupService = new RetrieveGroupService(db, { id: groupId });
      const result = await retrieveGroupService.run();

      // Assertions
      expect(result).toHaveProperty("id", groupId);

      result.children.forEach((child, key) => {
        expect(child).toHaveProperty("id", children[key].id);
        expect(child).toHaveProperty("target", children[key].target);
        expect(child).toHaveProperty("groupId", groupId);
      });
    });
  });

  it("throws an error if the group does not exist", () => {
    mock(async (db) => {
      const groupId = "051987bf";
      const retrieveGroupService = new RetrieveGroupService(db, { id: groupId });

      await expect(retrieveGroupService.run()).rejects.toThrow();
    });
  });

  it("throws an error if the group exists but has no children", () => {
    mock(async (db) => {
      const groupId = "954e0d6c";
      const group = {
        id: groupId,
        password: "securepassword",
      };

      // Insert mock data
      await db.insert(groupsTable).values(group);

      const retrieveGroupService = new RetrieveGroupService(db, { id: groupId });

      // Assertions
      await expect(retrieveGroupService.run()).rejects.toThrow();
    });
  });

  it("throws an error if the input ID is invalid", () => {
    const invalidIds = ["", "short", "invalid-id!"];
    invalidIds.forEach((id) => {
      expect(() => new RetrieveGroupService({} as LibSQLDatabase, { id })).toThrow();
    });
  });
});
