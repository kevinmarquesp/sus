import { db } from "@/db/db";
import { ShortenService } from "@/services/shorten-service";
import { NextResponse } from "next/server";

const POST = async (request: Request) => {
  try {
    const props = await request.json();
    const service = new ShortenService(db, props);
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

export { POST };
