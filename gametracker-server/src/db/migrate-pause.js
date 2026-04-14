import { query } from './index.js'

async function ensureColumn(table, column, ddl) {
  const exists = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2
     LIMIT 1`,
    [table, column]
  )
  if (exists.rows.length === 0) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  }
}

async function run() {
  try {
    await query('BEGIN')

    await ensureColumn('active_session', 'session_start_time', 'session_start_time TIMESTAMP')
    await ensureColumn('active_session', 'accumulated_seconds', 'accumulated_seconds INT NOT NULL DEFAULT 0')
    await ensureColumn('active_session', 'paused', 'paused BOOLEAN NOT NULL DEFAULT FALSE')
    await ensureColumn('active_session', 'paused_at', 'paused_at TIMESTAMP')

    await query(`UPDATE active_session SET session_start_time = start_time WHERE session_start_time IS NULL`)
    await query(`ALTER TABLE active_session ALTER COLUMN session_start_time SET NOT NULL`)

    await query('COMMIT')
    console.log('✓ migrate-pause done')
  } catch (e) {
    await query('ROLLBACK')
    console.error('migrate-pause failed:', e)
    process.exitCode = 1
  }
}

run()

