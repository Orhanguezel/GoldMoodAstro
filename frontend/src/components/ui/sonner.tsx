// src/components/ui/sonner.tsx

"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="konigsmassage-toaster"
      {...props}
    />
  );
};

export { Toaster };
