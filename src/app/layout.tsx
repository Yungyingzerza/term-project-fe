import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import ClientProvider from "./ClientProvider";

export const metadata: Metadata = {
  title: "ชิวชิว - ChillChill",
  description: "Share and enjoy videos with friends",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let user = null;
  if (token) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/line/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: token ? `accessToken=${token}` : "",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        user = data;
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  }

  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="antialiased overflow-x-hidden">
        <ClientProvider
          id={user?.id}
          username={user?.username}
          pictureUrl={user?.picture_url}
          exp={user?.exp || 0}
          handle={user?.handle || ""}
        >
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
