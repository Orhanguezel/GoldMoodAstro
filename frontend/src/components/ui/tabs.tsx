// src/components/ui/tabs.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./utils";

function Tabs(
  props: React.ComponentProps<typeof TabsPrimitive.Root>,
) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>,
) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("nav nav-pills mb-3", className)}
      {...props}
    />
  );
}

function TabsTrigger(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>,
) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("nav-link", className)}
      {...props}
    />
  );
}

function TabsContent(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>,
) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-2", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
