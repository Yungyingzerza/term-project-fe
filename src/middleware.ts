// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

const getSetCookieValues = (headers: Headers): string[] => {
  const extended = headers as HeadersWithGetSetCookie;
  if (typeof extended.getSetCookie === "function") {
    const values = extended.getSetCookie();
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
};

const extractCookie = (cookies: string[], name: string): string | undefined => {
  for (const cookie of cookies) {
    const match = cookie.match(new RegExp(`${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const authCookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  ...(isProduction ? { domain: ".yungying.com" } : {}),
};

const setAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) => {
  response.cookies.set("accessToken", accessToken, {
    ...authCookieBaseOptions,
    // expires in 5 minutes
    maxAge: 5 * 60,
  });
  response.cookies.set("refreshToken", refreshToken, {
    ...authCookieBaseOptions,
    // expires in 7 days
    maxAge: 7 * 24 * 60 * 60,
  });
};

const deleteAuthCookie = (response: NextResponse, name: string) => {
  if (isProduction) {
    response.cookies.delete({ name, domain: ".yungying.com" });
  } else {
    response.cookies.delete(name);
  }
};

export async function middleware(req: NextRequest) {
  let isAuth = false;
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const lineState = req.cookies.get("lineState")?.value;
  const pathname = req.nextUrl.pathname;

  //if lineState exists, remove it
  if (lineState) {
    const response = NextResponse.next();
    response.cookies.delete("lineState");
    return response;
  }

  // Skip auth check if no token
  if (!accessToken && !refreshToken) {
    // Continue with isAuth = false
    //delete invalid refresh token and access token
    const response = NextResponse.next();
    deleteAuthCookie(response, "refreshToken");
    deleteAuthCookie(response, "accessToken");
    return response;
  } else if (refreshToken && !accessToken) {
    // try to get new access token calling API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/line/refresh`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
      }
    );

    if (res.ok) {
      isAuth = true;
      const setCookieValues = getSetCookieValues(res.headers);

      const newAccessToken = extractCookie(setCookieValues, "accessToken");
      const newRefreshToken = extractCookie(setCookieValues, "refreshToken");

      if (!newAccessToken || !newRefreshToken) {
        const response = NextResponse.next();
        deleteAuthCookie(response, "refreshToken");
        return response;
      }

      const response = NextResponse.next();
      setAuthCookies(response, newAccessToken, newRefreshToken);
      return response;
    } else {
      //remove invalid refresh token
      const response = NextResponse.next();
      deleteAuthCookie(response, "refreshToken");
      return response;
    }
  } else if (accessToken && refreshToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      if (payload && payload.sub) {
        isAuth = true;
      }
    } catch {
      // accessToken invalid/expired; try refreshing with refreshToken
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/line/refresh`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Cookie: `refreshToken=${refreshToken}`,
            },
          }
        );

        if (res.ok) {
          isAuth = true;
          const setCookieValues = getSetCookieValues(res.headers);

          const newAccessToken = extractCookie(setCookieValues, "accessToken");
          const newRefreshToken = extractCookie(
            setCookieValues,
            "refreshToken"
          );

          if (!newAccessToken || !newRefreshToken) {
            const response = NextResponse.next();
            deleteAuthCookie(response, "refreshToken");
            return response;
          }

          const response = NextResponse.next();
          setAuthCookies(response, newAccessToken, newRefreshToken);
          return response;
        } else {
          isAuth = false;
        }
      } catch {
        isAuth = false;
      }
    }
  } else {
    isAuth = false;
    //cleanup cookies
    const response = NextResponse.next();
    deleteAuthCookie(response, "refreshToken");
    deleteAuthCookie(response, "accessToken");
    return response;
  }

  const protectedRoutes = ["/settings", "/messages", "/following"];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isAuth) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_API}/line/authentication`
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/settings/:path*", "/messages/:path*", "/following/:path*"],
};
