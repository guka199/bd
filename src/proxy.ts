import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/access-token";

// Everything behind the PIN: the video page, the game, and the video file itself.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (await verifyAccessToken(token)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/media/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/video/:path*", "/game/:path*", "/media/:path*"],
};
