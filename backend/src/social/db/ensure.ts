import { pool } from "./client";

let postCommentsEnsured = false;

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<any[]>(
    "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [table, column],
  );
  return rows.length > 0;
}

export async function ensurePostCommentsTable() {
  if (postCommentsEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`post_comments\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`uuid\` char(36) NOT NULL,
      \`post_id\` int NOT NULL,
      \`platform\` enum('facebook','instagram','x') NOT NULL,
      \`external_comment_id\` varchar(255) NOT NULL,
      \`parent_comment_id\` varchar(255) DEFAULT NULL,
      \`author_name\` varchar(255) DEFAULT NULL,
      \`author_id\` varchar(255) DEFAULT NULL,
      \`message\` text NOT NULL,
      \`ai_reply_draft\` text DEFAULT NULL,
      \`ai_reply_status\` enum('pending','approved','rejected','sent') DEFAULT NULL,
      \`ai_reply_model\` varchar(100) DEFAULT NULL,
      \`ai_reply_provider\` varchar(100) DEFAULT NULL,
      \`ai_replied_tweet_id\` varchar(64) DEFAULT NULL,
      \`like_count\` int DEFAULT 0,
      \`created_time\` datetime(3) DEFAULT NULL,
      \`fetched_at\` datetime(3) NOT NULL,
      \`created_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY(\`id\`),
      UNIQUE KEY \`post_comments_uuid_unique\` (\`uuid\`),
      UNIQUE KEY \`uk_post_platform_comment\` (\`post_id\`, \`platform\`, \`external_comment_id\`),
      KEY \`idx_comment_post\` (\`post_id\`),
      KEY \`idx_comment_platform\` (\`platform\`),
      KEY \`idx_comment_created\` (\`created_time\`),
      CONSTRAINT \`post_comments_post_id_social_posts_id_fk\`
        FOREIGN KEY(\`post_id\`) REFERENCES \`social_posts\`(\`id\`) ON DELETE CASCADE
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Idempotent migration: eski (X/AI yanit oncesi) tablolara eksik kolonlari ekle.
  const addColumns: Array<[string, string]> = [
    ["ai_reply_draft", "ADD COLUMN `ai_reply_draft` text NULL AFTER `message`"],
    ["ai_reply_status", "ADD COLUMN `ai_reply_status` enum('pending','approved','rejected','sent') NULL AFTER `ai_reply_draft`"],
    ["ai_reply_model", "ADD COLUMN `ai_reply_model` varchar(100) NULL AFTER `ai_reply_status`"],
    ["ai_reply_provider", "ADD COLUMN `ai_reply_provider` varchar(100) NULL AFTER `ai_reply_model`"],
    ["ai_replied_tweet_id", "ADD COLUMN `ai_replied_tweet_id` varchar(64) NULL AFTER `ai_reply_provider`"],
  ];
  for (const [column, clause] of addColumns) {
    if (!(await columnExists("post_comments", column))) {
      await pool.query(`ALTER TABLE \`post_comments\` ${clause}`);
    }
  }

  // platform enum 'x' destegi (eski tablolarda yoktu)
  const [platRows] = await pool.query<any[]>(
    "SELECT COLUMN_TYPE ct FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_comments' AND COLUMN_NAME = 'platform'",
  );
  if (platRows[0] && !String(platRows[0].ct).includes("'x'")) {
    await pool.query("ALTER TABLE `post_comments` MODIFY COLUMN `platform` enum('facebook','instagram','x') NOT NULL");
  }

  postCommentsEnsured = true;
}
