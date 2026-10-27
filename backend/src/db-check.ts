/**
 * `npm run db:check` — confirms the backend can reach Supabase and that the
 * schema has been applied, by loading every table and printing its row count.
 */
import { db, initDb, usingSupabase } from './db.js';

if (!usingSupabase()) {
  console.log('Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.');
  process.exit(1);
}

try {
  await initDb();
} catch (e) {
  console.error((e as Error).message);
  console.error('Did you run backend/supabase/schema.sql in the Supabase SQL editor?');
  process.exit(1);
}

for (const [table, rows] of Object.entries(db)) console.log(`  ${table.padEnd(10)} ${(rows as unknown[]).length} rows`);
console.log('Connected.');
