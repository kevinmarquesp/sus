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
    const { id, updatedAt, children } = await this.retrieveCurrentGroupData();

    // Unlink the removed children and update the remaining ones.
    const [_, updatedChildren] = await this.db.batch([
      this.updateRemovedChildrenReferenceQuery(children, id),
      this.updateUntouchedChildrenQuery(children, id),
    ]);

    // Compare the new children list to the old one to get which one as added.
    const newChildren = this.props.children.filter((child) =>
      !children.map(({ target }) => target).includes(child));

    const reusedChildren = await this.retrieveReusedUngroupedLinks(newChildren, id);

    // And now compare it to the reused ones, the remaining should be created.
    const toCreateChildren = newChildren.filter((child) =>
      !reusedChildren.map(({ target }) => target).includes(child));

    const createdChildren = await this.insertNewChildrenQueries(toCreateChildren, id);

    return {
      id,
      updatedAt,
      children: [
        ...updatedChildren,
        ...reusedChildren,
        ...createdChildren,
      ],
    };
  }

  private async retrieveCurrentGroupData(): Promise<PublicGroupsSchema & { children: PublicLinksSchema[] }> {
    const [[group], ...children] = await this.db.batch([
      this.selectGroupByIdAndPasswordQuery(this.props.id, this.props.password),
      this.selectGroupChildrenByGroupIdQuery(this.props.id),
    ]);

    assert.ok(group, "Group ID not found or incorrect password");

    return { ...group, children: children.flat() };
  }

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

  private updateRemovedChildrenReferenceQuery(currentChildren: PublicLinksSchema[], groupId: string) {
    const children = currentChildren.filter(({ target }) =>
      !this.props.children.includes(target));

    return this.db
      .update(linksTable)
      .set({ groupId: null })
      .where(or(
        ...children.map(({ id }) => and(
          eq(linksTable.groupId, groupId),
          eq(linksTable.id, id),
        ))));
  }

  private updateUntouchedChildrenQuery(currentChildren: PublicLinksSchema[], groupId: string) {
    const children = currentChildren.filter(({ target }) =>
      this.props.children.includes(target));

    return this.db
      .update(linksTable)
      .set({ groupId, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(or(
        ...children.map(({ id }) =>
          eq(linksTable.id, id)),
      ))
      .returning(publicLinksSchema);
  }

  private async retrieveReusedUngroupedLinks(children: string[], groupId: string) {
    return await this.db
      .update(linksTable)
      .set({ groupId, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(and(
        isNull(linksTable.groupId),
        or(...children.map((child) =>
          eq(linksTable.target, child))),
      ))
      .returning(publicLinksSchema);
  }

  private async insertNewChildrenQueries(children: string[], groupId: string): Promise<PublicLinksSchema[]> {
    const queries = children.map((child) =>
      this.db
        .insert(linksTable)
        .values({
          id: nanoid(8),
          groupId,
          target: child,
        })
        .returning(publicLinksSchema));

    const [_, result] = await this.db.batch([
      this.db.run(sql`SELECT 'noop'`),
      ...queries,
    ]);

    return result.flat();
  }
}

export {
  type EditGroupServiceProps,
  EditGroupService,
};
