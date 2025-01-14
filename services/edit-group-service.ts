import { groupsTable, linksTable, PublicGroupsSchema, publicGroupsSchema, PublicLinksSchema, publicLinksSchema } from "@/db/schema";
import { Service } from "@/entities/service";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import assert from "node:assert";
import { z } from "zod";

const editGroupServicePropsValidator = z.object({
  id: z.string().length(8).regex(/[\d\b-_]+/).nonempty(),
  password: z.string().nonempty(),
  children: z
    .array(z.string().trim().url())
    .transform((children) => Array.from(new Set(children)))
    .refine((c) => c.length >= 2, {
      message: "At least two unique children are required after filtering duplicates",
    }),
});

type EditGroupServiceProps = z.infer<typeof editGroupServicePropsValidator>;

/** Updates a group children's list by creating/updating link entries. */
class EditGroupService extends Service {
  constructor(
    private readonly db: LibSQLDatabase,
    private readonly props: EditGroupServiceProps,
  ) {
    super();

    this.props = editGroupServicePropsValidator.parse(props);
  }

  public async run(): Promise<PublicGroupsSchema & { children: PublicLinksSchema[] }> {
    const [[group], ...children] = await this.db.batch([
      this.selectGroupByIdAndPasswordQuery(this.props.id, this.props.password),
      this.selectGroupChildrenByGroupIdQuery(this.props.id),
    ]);

    assert.ok(group, "Group ID not found or incorrect password");

    const oldGroup = { ...group, children: children.flat() };

    // Unlink removed children.

    const removedChildren = oldGroup.children.filter(({ target }) =>
      !this.props.children.includes(target));

    await this.db.batch([
      this.db.run(sql`SELECT 'noop'`),
      ...removedChildren.map(({ id }) =>
        this.db
          .update(linksTable)
          .set({ groupId: null })
          .where(eq(linksTable.id, id))),
    ]);

    // Update the untouched ones and sotre them.

    const toUpdateChildren = oldGroup.children.filter(({ target }) =>
      this.props.children.includes(target));

    const [_, ...updatedChildren] = await this.db.batch([
      this.db.run(sql`SELECT 'noop'`),
      ...toUpdateChildren.map(({ id }) =>
        this.db
          .update(linksTable)
          .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(eq(linksTable.id, id))
          .returning(publicLinksSchema)),
    ]);

    // Create the new links and store those results as well.

    const newChildren = this.props.children.filter((c) =>
      !oldGroup.children.map(({ target }) => target).includes(c));

    // -- Find for ungrouped links to reuse.

    const reusedChildren = await this.db
      .update(linksTable)
      .set({
        groupId: this.props.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(isNull(linksTable.groupId), or(...newChildren.map((child) =>
        eq(linksTable.target, child)))))
      .returning(publicLinksSchema);

    // -- Create a new entry if any can be found.

    const toCreateChildren = newChildren.filter((child) =>
      !reusedChildren.map(({ target }) => target).includes(child));

    const [__, ...createdChildren] = await this.db.batch([
      this.db.run(sql`SELECT 'noop'`),
      ...toCreateChildren.map((child) =>
        this.db
          .insert(linksTable)
          .values({
            id: nanoid(8),
            groupId: this.props.id,
            target: child,
          })
          .returning(publicLinksSchema),
      ),
    ]);

    // Compare the untouched and the created to fix the order.

    const finalChildren = [
      ...updatedChildren,
      ...reusedChildren,
      ...createdChildren,
    ].flat();

    return { ...group, children: finalChildren };
  }

  // Private methods to get the Drizzle queries to batch it all together.

  private selectGroupByIdAndPasswordQuery(id: string, password: string) {
    return this.db
      .update(groupsTable)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(and(eq(groupsTable.id, id), eq(groupsTable.password, password)))
      .returning(publicGroupsSchema);
  }

  private selectGroupChildrenByGroupIdQuery(groupId: string) {
    return this.db
      .select(publicLinksSchema)
      .from(linksTable)
      .where(eq(linksTable.groupId, groupId));
  }
}

export {
  type EditGroupServiceProps,
  EditGroupService,
};
