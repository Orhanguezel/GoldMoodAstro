// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/_components/admin-db-client.tsx
// FINAL — App Router + shadcn standards
// ✅ No Bootstrap classes (container-fluid, d-flex, etc.)
// ✅ No inline styles
// ✅ shadcn Card / UI components
// ✅ Correct import path for AdminDbAuthGate
// =============================================================
"use client";

import type React from "react";

import { Lightbulb } from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { FullDbHeader } from "../fullDb/full-db-header";
import { FullDbImportPanel } from "../fullDb/full-db-import-panel";
import { SnapshotsPanel } from "../fullDb/snapshots-panel";
import { ModuleTabs } from "../modules/module-tabs";
import { AdminDbAuthGate } from "./admin-db-auth-gate";

export const AdminDbClient: React.FC = () => {
  const t = useAdminT("admin.db");

  return (
    <AdminDbAuthGate>
      {({ adminSkip }) => (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">{t("title")}</h1>

                {/* Help Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <Lightbulb className="size-4 text-muted-foreground" />
                      <span className="sr-only">{t("help.pageTitle")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80">
                    <div className="space-y-3">
                      <p className="font-semibold text-sm">{t("help.dbAdmin")}</p>
                      <ul className="space-y-2 text-muted-foreground text-sm">
                        <li>
                          <span className="font-medium text-foreground">Full DB</span>: {t("help.fullDbDesc")}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Snapshot</span>: {t("help.snapshotDesc")}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Module Export/Import</span>:{" "}
                          {t("help.moduleDesc")}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">UI (site_settings ui_*)</span>:{" "}
                          {t("help.uiDesc")}
                        </li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <p className="text-muted-foreground text-sm">{t("description")}</p>
            </div>
          </div>

          {/* Full DB Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Full DB</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FullDbHeader />
              <FullDbImportPanel />
            </CardContent>
          </Card>

          {/* Snapshots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <SnapshotsPanel adminSkip={adminSkip} />
            </CardContent>
          </Card>

          {/* Module Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Module Export / Import</CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleTabs adminSkip={adminSkip} />
            </CardContent>
          </Card>
        </div>
      )}
    </AdminDbAuthGate>
  );
};
