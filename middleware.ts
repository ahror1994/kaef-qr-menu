import { NextResponse, type NextRequest } from "next/server";

/** Быстрый редирект на логин без валидной сессии-куки.
 *  Полная проверка сессии выполняется на сервере (layout + API). */
export function middleware(req: NextRequest) {
  const hasCookie = req.cookies.has("kaef_session");
  const { pathname } = req.nextUrl;
  if (!hasCookie && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
