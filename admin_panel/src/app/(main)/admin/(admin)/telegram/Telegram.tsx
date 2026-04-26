// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/Telegram.tsx
// Admin Telegram Page (Settings + Inbound + AutoReply)
// Telegram
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import TelegramSettingsPanel from './components/TelegramSettingsPanel';
import TelegramInboundPanel from './components/TelegramInboundPanel';
import TelegramAutoReplyPanel from './components/TelegramAutoReplyPanel';

export default function TelegramAdminPage() {
  const t = useAdminT('admin.telegram');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('header.title')}</CardTitle>
          <CardDescription>{t('header.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
          <TabsTrigger value="autoreply">{t('tabs.autoreply')}</TabsTrigger>
          <TabsTrigger value="inbound">{t('tabs.inbound')}</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <TelegramSettingsPanel />
        </TabsContent>

        <TabsContent value="autoreply" className="space-y-4">
          <TelegramAutoReplyPanel />
        </TabsContent>

        <TabsContent value="inbound" className="space-y-4">
          <TelegramInboundPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
