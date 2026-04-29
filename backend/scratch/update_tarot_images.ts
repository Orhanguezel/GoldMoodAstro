import { db } from '../src/db/client';
import { tarotCards } from '../../packages/shared-backend/modules/tarot/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const updates = [
    { slug: 'the-fool', url: '/uploads/tarot/the-fool.png' },
    { slug: 'the-magician', url: '/uploads/tarot/the-magician.png' },
    { slug: 'the-high-priestess', url: '/uploads/tarot/the-high-priestess.png' },
  ];

  for (const item of updates) {
    try {
      await db.update(tarotCards)
        .set({ imageUrl: item.url })
        .where(eq(tarotCards.slug, item.slug));
      console.log('Updated', item.slug);
    } catch (e) {
      console.error('Error updating', item.slug, e);
    }
  }
  process.exit(0);
}

main();
