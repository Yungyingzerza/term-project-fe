"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function ProfileRoute() {
  const router = useRouter();
  const user = useSelector((s: any) => s.user) as { username?: string };

  useEffect(() => {
    if (user?.username) {
      router.replace(`/${user.username}`);
    } else {
      router.replace("/");
    }
  }, [user?.username, router]);

  return null;
}
