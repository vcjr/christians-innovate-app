import { NextResponse, type NextRequest } from "next/server";

// The old site linked to /NYTW in caps. Next's redirect rules match paths without regard to
// case (so a /NYTW → /nytw rule would loop), so the exact path is checked here instead.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/NYTW") {
    return NextResponse.redirect(new URL("/nytw", request.url), 308);
  }
}

export const config = { matcher: ["/NYTW", "/nytw"] };
