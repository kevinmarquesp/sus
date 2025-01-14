import { groupsTable, linksTable, publicGroupsSchema, PublicGroupsSchema, PublicLinksSchema, publicLinksSchema } from "@/db/schema";
import { Service } from "@/entities/service";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import { z } from "zod";

const createGroupServicePropsValidator = z.object({
  password: z.string().nonempty(),
  children: z
    .array(z.string().trim().url())
    .transform((children) => Array.from(new Set(children)))
    .refine((c) => c.length >= 2, {
      message: "At least two unique children are required after filtering duplicates",
    }),
});

type CreateGroupServiceProps = z.infer<typeof createGroupServicePropsValidator>;

/** Creates a new group, reusing entries if the groupId propperty is empty. */
class CreateGroupService extends Service {
  constructor(
    private readonly db: LibSQLDatabase,
    private readonly props: CreateGroupServiceProps,
  ) {
    super();

    this.props = createGroupServicePropsValidator.parse(props);
  }

  public async run(): Promise<PublicGroupsSchema & { children: PublicLinksSchema[] }> {
    const groupId = nanoid(8);

    const existing = await this.db
      .select({ id: linksTable.id, target: linksTable.target })
      .from(linksTable)
      .where(and(
        isNull(linksTable.groupId),
        or(...this.props.children.map((child) =>
          eq(linksTable.target, child))),
      ));

    const existingIds = existing.map(({ id }) => id);
    const existingTargets = existing.map(({ target }) => target);
    const nonexistingTargets = this.props.children.filter((c) => !existingTargets.includes(c));

    const [[group], ...children] = await this.db.batch([
      this.insertGroupQuery(groupId),
      ...this.updateExistingLinksQueries(existingIds, groupId),
      ...this.createNewLinksQueries(nonexistingTargets, groupId),
    ]);

    return { ...group, children: children.flat() };
  }

  // Private methods to get the Drizzle queries to batch it all together.

  private insertGroupQuery(id: string) {
    return this.db
      .insert(groupsTable)
      .values({
        id, password: this.props.password,
      })
      .returning(publicGroupsSchema);
  }

  private updateExistingLinksQueries(existingIds: string[], groupId: string) {
    const queries = [];

    for (const id of existingIds) {
      const query = this.db
        .update(linksTable)
        .set({ groupId, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(linksTable.id, id))
        .returning(publicLinksSchema);

      queries.push(query);
    }

    return queries;
  }

  private createNewLinksQueries(nonexistingTargets: string[], groupId: string) {
    const queries = [];

    for (const target of nonexistingTargets) {
      const query = this.db
        .insert(linksTable)
        .values({ id: nanoid(8), groupId, target })
        .returning(publicLinksSchema);

      queries.push(query);
    }

    return queries;
  }
}

export {
  type CreateGroupServiceProps,
  CreateGroupService,
};
