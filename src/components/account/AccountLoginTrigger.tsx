"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonHTMLAttributes } from "react";
import { useAuth } from "./AuthModalProvider";

type AccountLoginTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  authMode?: "login" | "register";
};

export function AccountLoginTrigger({
  className = "",
  children,
  authMode = "login",
  onClick,
  ...props
}: AccountLoginTriggerProps) {
  const { openLogin, openRegister } = useAuth();

  return (
    <button
      type="button"
      onClick={(event) => {
        if (authMode === "register") openRegister();
        else openLogin();
        onClick?.(event);
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function AccountRegisterLink({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href="/account?auth=register" className={className}>
      {children}
    </Link>
  );
}
