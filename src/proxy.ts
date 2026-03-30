import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { APP_ROUTES } from "@/lib/routes";

const PUBLIC_PATHS = [APP_ROUTES.LOGIN, APP_ROUTES.AUTH_CALLBACK];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap")
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function unauthorizedResponse(request: NextRequest, pathname: string) {
  if (isApiPath(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = APP_ROUTES.LOGIN;
  redirectUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing)" },
      { status: 500 },
    );
  }

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              response.cookies.set(name, value, options);
            } catch {
              // Ignore failures setting cookies in proxy edge runtime
            }
          });
        },
      },
    },
  );

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorizedResponse(request, pathname);
    }
  } catch {
    return unauthorizedResponse(request, pathname);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/upload/:path*", "/api/upload/:path*", "/api/stream/:path*", "/api/cover/:path*"],
};
