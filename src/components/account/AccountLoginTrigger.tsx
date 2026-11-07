"use client";

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
