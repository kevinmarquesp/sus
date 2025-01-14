import { mock } from "@/db/mock";
import { CreateGroupService } from "../create-group-service";
import { linksTable } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";
import { describe, it, expect } from "vitest";

describe("CreateGroupService", () => {
  it("creates a new group with new and existing links", () => {
    mock(async (db) => {
      const children = [
        "https://existing-link.com",
        "https://new-link.com",
      ];

      const existingLinkId = "0c750fbc";

      // Insert an existing link
      await db.insert(linksTable).values({
        id: existingLinkId,
        target: children[0],
      });

      const service = new CreateGroupService(db, {
        password: "securepassword",
        children,
      });

      const result = await service.run();

      // Verify the group creation
      expect(result).toHaveProperty("id");
      expect(result.children).toHaveLength(2);

      const [updatedLink] = await db
        .select()
        .from(linksTable)
        .where(eq(linksTable.id, existingLinkId));

      // Verify existing link was updated
      expect(updatedLink.groupId).toBe(result.id);

      const [newLink] = await db
        .select()
        .from(linksTable)
        .where(eq(linksTable.target, children[1]));

      // Verify new link was created
      expect(newLink).toBeDefined();
      expect(newLink.groupId).toBe(result.id);
    });
  });

  it("throws an error if the filtered children's lenght is lesser than two", () => {
    mock(async (db) => {
      const children = ["https://example.com", "https://example.com"];

      expect(() => new CreateGroupService(db, {
        password: "securepassword",
        children,
      })).toThrow();
    });
  });

  it("handles duplicate children URLs", () => {
    mock(async (db) => {
      const children = [
        "https://duplicate-link.com",
        "https://duplicate-link.com",
        "https://unique-link.com",
      ];

      const service = new CreateGroupService(db, {
        password: "securepassword",
        children,
      });

      const result = await service.run();

      // Verify the group creation
      expect(result).toHaveProperty("id");
      expect(result.children).toHaveLength(2);

      const links = await db
        .select()
        .from(linksTable)
        .where(or(...children.map((child) => eq(linksTable.target, child))));

      // Ensure no duplicate entries in the database
      expect(links).toHaveLength(2);
    });
  });

  it("throws an error if the password is missing", () => {
    mock(async (db) => {
      const children = ["https://example.com"];

      expect(() => new CreateGroupService(db, { password: "", children })).toThrow();
    });
  });

  it("throws an error if less than two children are provided", () => {
    mock(async (db) => {
      const children = ["https://example.com"];

      expect(() =>
        new CreateGroupService(db, {
          password: "securepassword",
          children,
        })).toThrow();
    });
  });

  it("throws an error if children URLs are invalid", () => {
    mock(async (db) => {
      const children = ["invalid-url", "https://valid-url.com"];

      expect(() =>
        new CreateGroupService(db, {
          password: "securepassword",
          children,
        }),
      ).toThrow();
    });
  });

  it("creates new links if any can be reused", () => {
    mock(async (db) => {
      const children = [
        "https://link1.com",
        "https://link2.com",
      ];

      // Create the first group
      const service1 = new CreateGroupService(db, {
        password: "securepassword",
        children,
      });

      const result1 = await service1.run();

      // Verify the group and links were created
      expect(result1).toHaveProperty("id");
      expect(result1.children).toHaveLength(2);

      // Create the second group with the same children
      const service2 = new CreateGroupService(db, {
        password: "anotherpassword",
        children,
      });

      const result2 = await service2.run();

      // Verify the second group was created with new links
      expect(result2).toHaveProperty("id");
      expect(result2.children).toHaveLength(2);
      expect(result2.id).not.toBe(result1.id);

      // Ensure the links have different group IDs
      const links = await db
        .select()
        .from(linksTable)
        .where(or(...children.map((child) =>
          eq(linksTable.target, child))));

      const groupIds = new Set(links.map((link) => link.groupId));

      expect(links.length).toBe(4);
      expect(groupIds.size).toBe(2); // Each group should have its own group ID
    });
  });
});
