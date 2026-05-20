'use client';

import React, { useState } from 'react';
import { Search, Users, Calendar, Star, Loader2 } from 'lucide-react';
import { useGetMyConsultantClientsQuery } from '@/integrations/rtk/private/consultant_self.endpoints';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="w-10 h-10 rounded-full object-cover border border-(--gm-border-soft)"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-(--gm-gold)/15 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold) font-bold text-sm">
      {initials}
    </div>
  );
}

export default function ClientsPanel() {
  const [search, setSearch] = useState('');
  const { data: clients = [], isLoading, isError } = useGetMyConsultantClientsQuery(
    search.length >= 2 ? { q: search } : undefined
  );

  const filtered = search.length < 2
    ? clients
    : clients.filter((c) =>
        (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
            Danışanlarım
          </span>
          <h2 className="font-serif text-2xl text-(--gm-text) mt-0.5">
            Danışan Listesi
          </h2>
        </div>
        {!isLoading && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--gm-gold)/10 border border-(--gm-gold)/20 text-xs font-bold text-(--gm-gold)">
            <Users className="w-3.5 h-3.5" />
            {filtered.length} kişi
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--gm-text) opacity-40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ara..."
          className="w-full h-12 pl-11 pr-4 bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl text-sm text-(--gm-text) placeholder:text-(--gm-text)/40 focus:border-(--gm-gold)/50 outline-none transition-colors"
        />
      </div>

      {/* List */}
      <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 text-(--gm-gold) animate-spin" />
            <span className="text-sm text-(--gm-text) opacity-50">Yükleniyor...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-(--gm-text) opacity-50 font-serif italic">
              Danışan listesi yüklenemedi. Backend endpoint yakında eklenecek.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-(--gm-text) opacity-20 mx-auto mb-3" />
            <p className="text-sm text-(--gm-text) opacity-40 font-serif italic">
              {search ? 'Arama sonucu bulunamadı.' : 'Henüz danışanınız yok. İlk seans tamamlandığında burada görünecek.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-(--gm-border-soft)">
              <span className="text-[9px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-60 col-span-2">Danışan</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-60">Son Randevu</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-60 text-right">Seans</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-(--gm-border-soft)">
              {filtered.map((client, idx) => (
                <div
                  key={client.user_id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-(--gm-gold)/5 transition-colors"
                >
                  <Avatar src={client.avatar_url} name={client.full_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-sm text-(--gm-text)">
                        {client.full_name || 'İsimsiz Kullanıcı'}
                      </span>
                      {idx === 0 && client.booking_count > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--gm-gold)/15 text-(--gm-gold) text-[9px] font-bold uppercase tracking-widest">
                          <Star className="w-2.5 h-2.5" />
                          Sadık
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-(--gm-text) opacity-40 mt-0.5 truncate">
                      {client.email || ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[11px] text-(--gm-text) opacity-50">
                      <Calendar className="w-3 h-3" />
                      {formatDate(client.last_booking_at)}
                    </div>
                  </div>
                  <div className="shrink-0 w-12 text-right">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-(--gm-gold)/10 text-(--gm-gold) text-xs font-bold">
                      {client.booking_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
