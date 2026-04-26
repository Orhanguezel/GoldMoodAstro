// =============================================================
// FILE: src/app/(main)/admin/(admin)/chat/Chat.tsx
// Admin Chat & AI Support — Threads + Messages + Knowledge
// Chat
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import ChatThreadsPanel from './components/ChatThreadsPanel';
import ChatKnowledgePanel from './components/ChatKnowledgePanel';
import ChatSettingsPanel from './components/ChatSettingsPanel';

export default function ChatAdminPage() {
  const t = useAdminT('admin.chat');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('header.title')}</CardTitle>
          <CardDescription>{t('header.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="threads" className="w-full">
        <TabsList>
          <TabsTrigger value="threads">{t('tabs.threads')}</TabsTrigger>
          <TabsTrigger value="knowledge">{t('tabs.knowledge')}</TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-4">
          <ChatThreadsPanel />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <ChatKnowledgePanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ChatSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
