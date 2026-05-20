import React from 'react';
import type { Metadata } from 'next';
import { WithdrawalsClient } from './withdrawals-client';

export const metadata: Metadata = {
  title: 'Para Çekme Talepleri | GoldMoodAstro',
  description: 'Bekleyen para çekme taleplerini yönetin.',
};

export default function AdminWithdrawalsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Para Çekme Talepleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danışmanların para çekme taleplerini görüntüleyin, onaylayın veya reddedin.
        </p>
      </div>
      <WithdrawalsClient />
    </div>
  );
}
