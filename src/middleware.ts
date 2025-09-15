// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken");
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
      const setCookieValues: string[] =
        (typeof (res.headers as any).getSetCookie === "function"
          ? (res.headers as any).getSetCookie()
          : []) || [];

      if (setCookieValues.length === 0) {
        const single = res.headers.get("set-cookie");
        if (single) setCookieValues.push(single);
      }

      const extractCookie = (name: string): string | undefined => {
        for (const sc of setCookieValues) {
          const match = sc.match(new RegExp(`${name}=([^;]+)`));
          if (match) return match[1];
        }
        return undefined;
      };

      const newAccessToken = extractCookie("accessToken");
      const newRefreshToken = extractCookie("refreshToken");

      if (!newAccessToken || !newRefreshToken) {
        const response = NextResponse.next();
        response.cookies.delete("refreshToken");
        return response;
      }

      const response = NextResponse.next();
      response.cookies.set("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        //expires in 5 minutes
        maxAge: 5 * 60,
      });
      response.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "lax",
        //expires in 7 days
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    } else {
      //remove invalid refresh token
      const response = NextResponse.next();
      response.cookies.delete("refreshToken");
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
          const setCookieValues: string[] =
            (typeof (res.headers as any).getSetCookie === "function"
              ? (res.headers as any).getSetCookie()
              : []) || [];

          if (setCookieValues.length === 0) {
            const single = res.headers.get("set-cookie");
            if (single) setCookieValues.push(single);
          }

          const extractCookie = (name: string): string | undefined => {
            for (const sc of setCookieValues) {
              const match = sc.match(new RegExp(`${name}=([^;]+)`));
              if (match) return match[1];
            }
            return undefined;
          };

          const newAccessToken = extractCookie("accessToken");
          const newRefreshToken = extractCookie("refreshToken");

          if (!newAccessToken || !newRefreshToken) {
            const response = NextResponse.next();
            response.cookies.delete("refreshToken");
            return response;
          }

          const response = NextResponse.next();
          response.cookies.set("accessToken", newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            //expires in 5 minutes
            maxAge: 5 * 60,
          });
          response.cookies.set("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: "lax",
            //expires in 7 days
            maxAge: 7 * 24 * 60 * 60,
          });
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
    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken");
    return response;
  }

  const protectedRoutes = ["/settings", "/messages"];

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
  matcher: ["/", "/settings/:path*", "/messages/:path*"],
};
