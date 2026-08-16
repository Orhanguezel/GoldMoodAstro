// =============================================================
// FILE: src/app/(main)/admin/(admin)/chat/Chat.tsx
// Admin Chat & AI Support — Threads + Messages + Knowledge
// Chat
// =============================================================

'use client';

import * as React from 'react';
import { Bot, BookOpenText, History, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import ChatThreadsPanel from './components/ChatThreadsPanel';
import ChatKnowledgePanel from './components/ChatKnowledgePanel';
import ChatSettingsPanel from './components/ChatSettingsPanel';

export default function ChatAdminPage() {
  const t = useAdminT('admin.chat');

  return (
    <div className="animate-in space-y-8 pb-12 duration-700 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">AI & Destek Yönetimi</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="max-w-2xl text-sm italic text-gm-muted">{t('header.description')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gm-border-soft bg-gm-surface/30 px-4 py-2 text-xs text-gm-muted">
          <Bot className="size-4 text-gm-gold" />
          AI destek sistemi aktif
        </div>
      </div>

      <Tabs defaultValue="threads" className="w-full space-y-5">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-2 md:w-fit">
          <TabsTrigger value="threads" className="gap-2 rounded-xl px-5 py-2.5"><History className="size-4" />{t('tabs.threads')}</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2 rounded-xl px-5 py-2.5"><BookOpenText className="size-4" />AI Eğitimi</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 rounded-xl px-5 py-2.5"><Settings2 className="size-4" />{t('tabs.settings')}</TabsTrigger>
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
