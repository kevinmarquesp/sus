import { db } from "@/db/db";
import { RetrieveService } from "@/services/retrieve-service";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const GET = async (_: Request, {
  params,
}: {
  params: Promise<{ linkId: string }>,
}) => {
  let target;

  try {
    const id = (await params).linkId;
    const service = new RetrieveService(db, { id });
    const result = await service.run();

    target = result.target;

  } catch (err) {
    console.log("Server error:", err);

    return NextResponse.json({
      message: "Unknown error, check your input or come later when this issue was fixed",
    }, {
      status: 500,
    });
  }

  if (target)
    redirect(target);
};


export { GET };
