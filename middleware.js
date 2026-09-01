import { NextResponse } from "next/server";
import { verifyCookieValue } from "./lib/auth";

export async function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    const roleCookie = request.cookies.get("center_role")?.value;
    let role = null;
    if (roleCookie) {
      role = await verifyCookieValue(roleCookie);
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "admin")
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/assistant")) {
      if (role !== "assistant" && role !== "admin")
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/student")) {
      if (role !== "student" && role !== "admin")
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (e) {
    console.error("Middleware catch error:", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/assistant/:path*", "/student/:path*"],
};
