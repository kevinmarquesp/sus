import { linksTable } from "@/db/schema";
import { Service } from "@/entities/service";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import { z } from "zod";

const shortenServicePropsValidator = z.object({
  target: z.string().trim().url().nonempty(),
});

type ShortenServiceProps = z.infer<typeof shortenServicePropsValidator>;

/** Registers a new URL or reuse an existing one if possible. */
class ShortenService extends Service {
  constructor(
    private readonly db: LibSQLDatabase,
    private readonly props: ShortenServiceProps,
  ) {
    super();

    this.props = shortenServicePropsValidator.parse(props);
  }

  public async run(): Promise<object> {
    const publicSchema = {
      id: linksTable.id,
      groupId: linksTable.groupId,
      target: linksTable.target,
      createdAt: linksTable.createdAt,
    };

    const [existing] = await this.db
      .update(linksTable)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(linksTable.target, this.props.target))
      .returning(publicSchema);

    if (existing)
      return existing;

    const id = nanoid(8);

    const [created] = await this.db
      .insert(linksTable)
      .values({ id, target: this.props.target })
      .returning(publicSchema);

    return created;
  }
}

export { ShortenService };
