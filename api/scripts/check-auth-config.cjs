// Read-only live configuration probe. Never print provider credentials or DB errors.
require('ts-node/register');
const {readConfig} = require('../src/config/config');
const {Client} = require('pg');

(async () => {
  const config = readConfig();
  console.log({production:config.production, frontend:config.frontend, api:config.api,
    googleConfigured:!!config.googleClientId && !!config.googleClientSecret,
    smtpConfigured:!!config.smtpHost, developmentRegistration:config.allowUnverifiedEmail});
  const db = new Client({connectionString:config.databaseUrl,ssl:config.ssl,connectionTimeoutMillis:10000});
  try {
    await db.connect();
    const {rows} = await db.query("select table_name from information_schema.tables where table_schema='public'");
    console.log('Database connection PASS; tables:',rows.map(row=>row.table_name));
    if (rows.some(row=>row.table_name==='migrations')) {
      const migrations=await db.query('select name from migrations order by id');
      console.log('Applied migrations:',migrations.rows.map(row=>row.name));
    }
  } catch {
    console.log('Database connection FAILED; check local credentials and network.');
    process.exitCode=1;
  } finally {await db.end();}
})();
