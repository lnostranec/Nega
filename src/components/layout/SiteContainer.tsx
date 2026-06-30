import type { ElementType, ReactNode } from "react";
import { SITE_CONTAINER_CLASS } from "@/lib/constants";

type SiteContainerProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

export function SiteContainer({
  children,
  className = "",
  as: Tag = "div",
}: SiteContainerProps) {
  return (
    <Tag
      className={className ? `${SITE_CONTAINER_CLASS} ${className}` : SITE_CONTAINER_CLASS}
    >
      {children}
    </Tag>
  );
}
