"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "./AuthModalProvider";

export function AccountAuthOpener() {
  const searchParams = useSearchParams();
  const { user, openLogin, openRegister } = useAuth();

  useEffect(() => {
    if (user) return;

    const auth = searchParams.get("auth");
    if (auth === "register") openRegister();
    if (auth === "login") openLogin();
  }, [searchParams, user, openLogin, openRegister]);

  return null;
}
