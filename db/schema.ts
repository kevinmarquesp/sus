import { InferSelectModel, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const groupsTable = sqliteTable("Groups", {
  id: text({ length: 8 }).unique().notNull(),
  password: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

type GroupsTable = InferSelectModel<typeof groupsTable>;

const publicGroupsSchema = {
  id: groupsTable.id,
  updatedAt: groupsTable.updatedAt,
};

type PublicGroupsSchema = { [K in keyof typeof publicGroupsSchema]: GroupsTable[K] };

const linksTable = sqliteTable("Links", {
  id: text({ length: 8 }).unique().notNull(),
  groupId: text({ length: 8 }).references(() => groupsTable.id),
  target: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

type LinksTable = InferSelectModel<typeof linksTable>;

const publicLinksSchema = {
  id: linksTable.id,
  groupId: linksTable.groupId,
  target: linksTable.target,
  updatedAt: linksTable.updatedAt,
};

type PublicLinksSchema = { [K in keyof typeof publicLinksSchema]: LinksTable[K] };

export {
  groupsTable,
  type GroupsTable,
  publicGroupsSchema,
  type PublicGroupsSchema,
  linksTable,
  type LinksTable,
  publicLinksSchema,
  type PublicLinksSchema,
};
