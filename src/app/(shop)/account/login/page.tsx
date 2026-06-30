"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/account/AuthModalProvider";

export default function LoginRedirectPage() {
  const router = useRouter();
  const { openLogin } = useAuth();

  useEffect(() => {
    openLogin();
    router.replace("/account?auth=login");
  }, [openLogin, router]);

  return null;
}
