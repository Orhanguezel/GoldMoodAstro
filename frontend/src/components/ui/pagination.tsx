// src/components/ui/pagination.tsx
"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/integrations/shared";
import { useUiSection } from "@/i18n";
import { Button, buttonVariants } from "./button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("d-flex justify-content-center w-100", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("d-flex flex-row align-items-center gap-1 list-unstyled", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "outline",
          size,
        }),
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { ui } = useUiSection("ui_account");
  return (
    <PaginationLink
      aria-label={ui("ui_account_pagination_previous_aria", "Previous page")}
      size="default"
      className={cn("d-inline-flex align-items-center gap-1 px-2", className)}
      {...props}
    >
      <ChevronLeftIcon size={16} />
      <span className="d-none d-sm-inline">{ui("ui_account_pagination_previous", "Previous")}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { ui } = useUiSection("ui_account");
  return (
    <PaginationLink
      aria-label={ui("ui_account_pagination_next_aria", "Sonraki sayfa")}
      size="default"
      className={cn("d-inline-flex align-items-center gap-1 px-2", className)}
      {...props}
    >
      <span className="d-none d-sm-inline">{ui("ui_account_pagination_next", "Sonraki")}</span>
      <ChevronRightIcon size={16} />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { ui } = useUiSection("ui_account");
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "d-flex align-items-center justify-content-center px-2",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon size={16} />
      <span className="visually-hidden">{ui("ui_account_pagination_more", "More pages")}</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
