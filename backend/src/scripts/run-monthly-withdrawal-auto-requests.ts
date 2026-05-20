import { pool } from '@/db/client';
import { runMonthlyWithdrawalAutoRequests } from '@/cron/consultant-withdrawals';

runMonthlyWithdrawalAutoRequests()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
