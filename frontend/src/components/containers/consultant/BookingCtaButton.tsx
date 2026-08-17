'use client';
// =============================================================
// FILE: src/components/containers/consultant/BookingCtaButton.tsx
//
// "Randevu Al" düğmesi — sayfanın altındaki randevu bölümüne indirir.
//
// NEDEN DÜZ <a href="#randevu"> YETMİYOR: hedef bölüm istemci bileşeninin
// içinde ve o bileşen veri gelene kadar spinner gösteriyor. Kullanıcı sayfa
// açılır açılmaz tıklarsa hedef DOM'da henüz yoktur ve tarayıcı hiçbir şey
// yapmaz — düğme bozukmuş gibi görünür. Bu yüzden hedef belirene kadar kısa
// süre bekleyip kaydırıyoruz.
//
// JS kapalıysa yine de çalışır: href duruyor, tarayıcı kendi atlamasını yapar.
// =============================================================
import React from 'react';

interface Props {
  targetId?: string;
  label: string;
  className?: string;
}

export default function BookingCtaButton({ targetId = 'randevu', label, className }: Props) {
  const scrollToTarget = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const start = Date.now();
    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      // Bölüm henüz yüklenmediyse ~3 sn boyunca dene, sonra vazgeç.
      if (Date.now() - start < 3000) window.setTimeout(tryScroll, 120);
    };

    if (document.getElementById(targetId)) return; // hedef hazır: tarayıcı halletsin
    event.preventDefault();
    tryScroll();
  };

  return (
    <a href={`#${targetId}`} onClick={scrollToTarget} className={className}>
      {label}
    </a>
  );
}
