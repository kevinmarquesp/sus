import { db } from "@/db/db";
import { RetrieveService } from "@/services/retrieve-service";
import { NextResponse } from "next/server";

const GET = async (_: Request, { params }: { params: Promise<{ linkId: string }> }) => {
  try {
    const props = {
      id: (await params).linkId,
    };
    const service = new RetrieveService(db, props);
    const result = await service.run();

    return NextResponse.json(result, {
      status: 201,
    });

  } catch (err) {
    console.log("Server error:", err);

    return NextResponse.json({
      message: "Unknown error, check your input or come later when this issue was fixed",
    }, {
      status: 500,
    });
  }
};

export { GET };
