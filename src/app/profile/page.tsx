"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function ProfileRoute() {
  const router = useRouter();
  const user = useAppSelector((s) => s.user);

  useEffect(() => {
    if (user?.username) {
      router.replace(`/${user.username}`);
    } else {
      router.replace("/");
    }
  }, [user?.username, router]);

  return null;
}
