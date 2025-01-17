import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.set("x-url", request.nextUrl.origin);

  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
}
