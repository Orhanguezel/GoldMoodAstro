import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { VAT_RATE, calculateDetailedCost } from './service';

type CsvRow = Record<string, string>;

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines.shift()?.split(',') ?? [];
  return lines.map((line) => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value])));
}

const number = (value: string | undefined) => Number(value || 0);

export async function importClaudeUsageCsv(filePath: string): Promise<number> {
  const rows = parseCsv(await readFile(filePath, 'utf8'));
  for (const row of rows) {
    const usage = {
      model: row.model_version,
      inputTokens: number(row.usage_input_tokens_no_cache),
      cacheWrite5mTokens: number(row.usage_input_tokens_cache_write_5m),
      cacheWrite1hTokens: number(row.usage_input_tokens_cache_write_1h),
      cacheReadTokens: number(row.usage_input_tokens_cache_read),
      outputTokens: number(row.usage_output_tokens),
    };
    const cost = calculateDetailedCost(usage);
    const sourceFile = basename(filePath);
    const importKey = createHash('sha256').update(JSON.stringify({ sourceFile, row })).digest('hex');
    await db.execute(sql`
      INSERT INTO llm_usage_imports
        (id, import_key, usage_date_utc, provider, model, api_key_label, workspace, usage_type,
         context_window, input_tokens, cache_write_5m_tokens, cache_write_1h_tokens,
         cache_read_tokens, output_tokens, web_search_count, inference_geo, speed,
         net_cost_usd, vat_rate, gross_cost_usd, source_file)
      VALUES
        (${randomUUID()}, ${importKey}, ${row.usage_date_utc}, 'anthropic', ${row.model_version},
         ${row.api_key}, ${row.workspace}, ${row.usage_type}, ${row.context_window || null},
         ${usage.inputTokens}, ${usage.cacheWrite5mTokens}, ${usage.cacheWrite1hTokens},
         ${usage.cacheReadTokens}, ${usage.outputTokens}, ${number(row.web_search_count)},
         ${row.inference_geo || null}, ${row.speed || null}, ${cost.net}, ${VAT_RATE},
         ${cost.gross}, ${sourceFile})
      ON DUPLICATE KEY UPDATE imported_at = CURRENT_TIMESTAMP(3)
    `);
  }
  return rows.length;
}
