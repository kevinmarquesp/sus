import { db } from "@/db/db";
import { EditGroupService } from "@/services/edit-group-service";
import { RetrieveGroupService } from "@/services/retrieve-group-service";
import { NextResponse } from "next/server";

const GET = async (_: Request, { params }: { params: Promise<{ groupId: string }> }) => {
  try {
    const props = {
      id: (await params).groupId,
    };

    const service = new RetrieveGroupService(db, props);
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

const PUT = async (request: Request, { params }: { params: Promise<{ groupId: string }> }) => {
  try {
    const props = {
      id: (await params).groupId,
      ...(await request.json()),
    };

    const service = new EditGroupService(db, props);
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

export { GET, PUT };
