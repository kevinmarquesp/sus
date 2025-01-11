import { linksTable, PublicLinksSchema, publicLinksSchema } from "@/db/schema";
import { Service } from "@/entities/service";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import assert from "node:assert";
import { z } from "zod";

const retrieveServicePropsValidator = z.object({
  id: z.string().length(8).regex(/[\d\b-_]+/),
});

type RetrieveServiceProps = z.infer<typeof retrieveServicePropsValidator>;

/** Retrieves an URL entry and store the current timestamp on the database. */
class RetrieveService extends Service {
  constructor(
    private readonly db: LibSQLDatabase,
    private readonly props: RetrieveServiceProps,
  ) {
    super();

    this.props = retrieveServicePropsValidator.parse(props);
  }

  public async run(): Promise<PublicLinksSchema> {
    const [entry] = await this.db
      .update(linksTable)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(linksTable.id, this.props.id))
      .returning(publicLinksSchema);

    assert.ok(entry, "Target ID not found");

    return entry;
  }
}

export {
  type RetrieveServiceProps,
  RetrieveService,
};
