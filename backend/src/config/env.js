/**
 * Fail-fast environment validation.
 * Call validateEnv() at startup; exits process if required vars are missing.
 * Skipped when NODE_ENV=test (Jest sets env in setupFilesAfterEnv).
 */
function validateEnv() {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) return;

  const missing = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-here') {
    missing.push('JWT_SECRET (set a strong secret, not the placeholder)');
  }

  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasDbVars =
    process.env.DB_HOST &&
    process.env.DB_NAME &&
    process.env.DB_USER !== undefined &&
    process.env.DB_PASSWORD !== undefined;

  if (!hasDatabaseUrl && !hasDbVars) {
    missing.push(
      'Database: set either DATABASE_URL or all of DB_HOST, DB_NAME, DB_USER, DB_PASSWORD'
    );
  }

  if (missing.length > 0) {
    console.error('[FATAL] Missing required environment variables:');
    missing.forEach((m) => console.error('  -', m));
    console.error('Copy backend/env.example to .env and set values. Exiting.');
    process.exit(1);
  }
}

module.exports = { validateEnv };
