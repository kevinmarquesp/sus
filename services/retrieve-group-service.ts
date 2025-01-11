import { groupsTable, linksTable, PublicGroupsSchema, publicGroupsSchema, PublicLinksSchema, publicLinksSchema } from "@/db/schema";
import { Service } from "@/entities/service";
import { eq } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import assert from "node:assert";
import { z } from "zod";

const retrieveGroupServicePropsValidator = z.object({
  id: z.string().length(8).regex(/[\d\b-_]+/),
});

type RetrieveGroupServiceProps = z.infer<typeof retrieveGroupServicePropsValidator>;

/** Given an group id, it'll return it's contents, simple as that. */
class RetrieveGroupService extends Service {
  constructor(
    private readonly db: LibSQLDatabase,
    private readonly props: RetrieveGroupServiceProps,
  ) {
    super();

    this.props = retrieveGroupServicePropsValidator.parse(props);
  }

  public async run(): Promise<PublicGroupsSchema & { children: PublicLinksSchema[] }> {
    const [[group], ...children] = await this.db.batch([
      this.selectGroupByIdQuery(this.props.id),
      this.selectGroupChildrenByGroupIdQuery(this.props.id),
    ]);

    assert.ok(children.flat().length > 0, "Group ID not found");

    return { ...group, children: children.flat() };
  }

  // Private methods to get the Drizzle queries to batch it all together.

  private selectGroupByIdQuery(id: string) {
    return this.db
      .select(publicGroupsSchema)
      .from(groupsTable)
      .where(eq(groupsTable.id, id));
  }

  private selectGroupChildrenByGroupIdQuery(groupId: string) {
    return this.db
      .select(publicLinksSchema)
      .from(linksTable)
      .where(eq(linksTable.groupId, groupId));
  }
}

export {
  type RetrieveGroupServiceProps,
  RetrieveGroupService,
};
