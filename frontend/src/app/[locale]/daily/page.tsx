import type { Metadata } from 'next';
import DailyPageClient from './DailyPageClient';

export const metadata: Metadata = {
  title: 'Bugünün Yorumu — GoldMoodAstro',
  description: 'Natal haritanıza göre hazırlanan günlük astroloji yorumu.',
};

export default function DailyPage() {
  return <DailyPageClient />;
}
