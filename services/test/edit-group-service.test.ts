import { mock } from "@/db/mock";
import { groupsTable, linksTable, publicLinksSchema } from "@/db/schema";
import { describe, expect, it } from "vitest";
import { EditGroupService } from "../edit-group-service";
import { eq } from "drizzle-orm";

describe("EditGroupService", () => {
  it("updates a group's children, including reusing and creating new links", () => mock(async (db) => {
    const groupId = "f7eb9516";
    const password = "securepassword";

    const initialLinks = [
      { id: "ee210fe2", target: "https://link1.com", groupId },
      { id: "38d876ef", target: "https://link2.com", groupId },
    ];

    // Insert group and initial links
    await db.insert(groupsTable).values({ id: groupId, password });
    await db.insert(linksTable).values(initialLinks);

    const newChildren = [
      "https://link2.com", // Existing link
      "https://link3.com", // New link
    ];

    const service = new EditGroupService(db, { id: groupId, password, children: newChildren });
    const result = await service.run();

    // Verify the group's children are updated
    expect(result).toHaveProperty("children");
    expect(result.children).toHaveLength(newChildren.length);

    // Ensure link1 was unlinked
    const [unlinkedLink] = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.target, "https://link1.com"));

    expect(unlinkedLink.groupId).toBeNull();

    // Ensure link2 was retained
    const [updatedLink] = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.target, "https://link2.com"));

    expect(updatedLink.groupId).toBe(groupId);

    // Ensure link3 was created
    const [newLink] = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.target, "https://link3.com"));

    expect(newLink.groupId).toBe(groupId);
  }));

  it("throws an error if the group ID or password is incorrect", () => mock(async (db) => {
    const groupId = "invalid-id";
    const password = "wrongpassword";

    const children = ["https://example.com", "https://another.com"];

    expect(() =>
      new EditGroupService(db, {
        id: groupId,
        password,
        children,
      })).toThrow();
  }));

  it("throws an error if less than two unique children are provided", () => mock(async (db) => {
    const groupId = "700b2a89";
    const password = "securepassword";

    const children = ["https://example.com", "https://example.com"];

    await db
      .insert(groupsTable)
      .values({ id: groupId, password });

    expect(() =>
      new EditGroupService(db, {
        id: groupId,
        password,
        children,
      }),
    ).toThrow("At least two unique children are required after filtering duplicates");
  }));

  it("handles children with duplicates and ensures no duplicate links are created", () => mock(async (db) => {
    const groupId = "38430a67";
    const password = "securepassword";

    const initialLinks = [{
      id: "link1",
      target: "https://existing.com",
      groupId,
    }];

    // Insert group and initial link
    await db.insert(groupsTable).values({ id: groupId, password });
    await db.insert(linksTable).values(initialLinks);

    const children = [
      "https://existing.com",
      "https://duplicate.com",
      "https://duplicate.com",
    ];

    const service = new EditGroupService(db, { id: groupId, password, children });
    const result = await service.run();

    // Verify the group's children are updated without duplicates
    expect(result.children).toHaveLength(2);

    const links = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.groupId, groupId));

    expect(links).toHaveLength(2);
  }));

  it("handles reusing ungrouped links", () => mock(async (db) => {
    const groupId = "9976df01";
    const password = "securepassword";

    const ungroupedLink = {
      id: "ungrouped1",
      target: "https://reuse.com",
      groupId: null,
    };

    // Insert group and ungrouped link
    await db.insert(groupsTable).values({ id: groupId, password });
    await db.insert(linksTable).values(ungroupedLink);

    const children = ["https://reuse.com", "https://newlink.com"];

    const service = new EditGroupService(db, { id: groupId, password, children });
    await service.run();

    // Verify the ungrouped link is reused
    const [reusedLink] = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.target, "https://reuse.com"));
    expect(reusedLink.groupId).toBe(groupId);

    // Verify the new link is created
    const [newLink] = await db
      .select()
      .from(linksTable)
      .where(eq(linksTable.target, "https://newlink.com"));
    expect(newLink.groupId).toBe(groupId);
  }));
});
