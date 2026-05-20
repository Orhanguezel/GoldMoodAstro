import { pool } from '@/db/client';
import { sendCommissionChangeNotices } from '@/modules/commissionChange/service';

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const send = hasFlag('--send');
  const force = hasFlag('--force');

  const result = await sendCommissionChangeNotices({
    dryRun: !send,
    force,
    adminUserId: null,
    ip: 'cli',
  });

  console.log(JSON.stringify(result, null, 2));

  if (!send) {
    console.log('\nDry-run tamamlandı. Gerçek gönderim için: bun run commission:notice -- --send');
  }

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
