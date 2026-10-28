/**
 * Migration: Add username + passwordHash to User table
 * And update credentials:
 *   Owner:   maestro / Tha012157230@#$
 *   Cashier: osama   / 123456
 *   Chef:    joo     / 123456789
 */
const { Client } = require('pg');
const { createHash } = require('crypto');

const DB = 'postgresql://neondb_owner:npg_gMcU8biJrE1l@ep-rough-night-bazkh3dn-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require';

function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}

const USERS = [
  { role: 'owner',      username: 'maestro', password: 'Tha012157230@#$' },
  { role: 'cashier',    username: 'osama',   password: '123456' },
  { role: 'chef',       username: 'joo',     password: '123456789' },
  { role: 'accountant', username: 'finance', password: 'finance123' },
];

async function run() {
  const client = new Client({ connectionString: DB });
  await client.connect();
  console.log('✅ Connected to Neon DB (schema: choco)');

  // 1. Add columns (idempotent)
  await client.query(`
    ALTER TABLE choco."User"
    ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS "passwordHash" TEXT
  `);
  console.log('✅ Columns added (username, passwordHash)');

  // 2. Update each role
  for (const u of USERS) {
    const hash = sha256(u.password);
    const res = await client.query(
      `UPDATE choco."User"
       SET username = $1, "passwordHash" = $2
       WHERE role = $3
       RETURNING id, name, role, username`,
      [u.username, hash, u.role]
    );
    if (res.rowCount > 0) {
      console.log(`✅ Updated ${u.role}: username="${u.username}"`);
    } else {
      console.log(`⚠️  No user found for role: ${u.role}`);
    }
  }

  // 3. Show final state
  const all = await client.query(
    `SELECT id, name, role, username, "passwordHash" IS NOT NULL as has_password
     FROM choco."User" ORDER BY role`
  );
  console.log('\n📋 Current users:');
  console.table(all.rows);

  await client.end();
  console.log('\n🎉 Migration complete!');
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
