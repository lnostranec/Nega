"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/account/AuthModalProvider";

export default function RegisterRedirectPage() {
  const router = useRouter();
  const { openRegister } = useAuth();

  useEffect(() => {
    openRegister();
    router.replace("/account?auth=register");
  }, [openRegister, router]);

  return null;
}
