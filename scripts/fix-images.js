const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_gMcU8biJrE1l@ep-rough-night-bazkh3dn-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

const UPDATES = [
  { nameEn: 'Boba Blueberry Smoothie',  img: 'https://images.unsplash.com/photo-1553530666-ba11a90c3aee?w=500&q=85&fit=crop' },
  { nameEn: 'Boba Strawberry Smoothie', img: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=500&q=85&fit=crop' },
  { nameEn: 'Lotus Milkshake',          img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=85&fit=crop' },
  { nameEn: 'Lotus Mini Pancake',       img: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500&q=85&fit=crop' },
  { nameEn: 'White Mini Pancake',       img: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500&q=85&fit=crop' },
];

async function run() {
  await client.connect();
  console.log('Connected to Neon DB');

  for (const u of UPDATES) {
    const res = await client.query(
      `UPDATE choco."Product" SET image = $1 WHERE "nameEn" = $2 AND image IS NULL RETURNING id, "nameEn"`,
      [u.img, u.nameEn]
    );
    if (res.rowCount > 0) {
      console.log('Updated:', res.rows[0].nameEn);
    } else {
      console.log('Skipped (already has image or not found):', u.nameEn);
    }
  }

  // Count nulls remaining
  const nulls = await client.query(`SELECT COUNT(*) FROM choco."Product" WHERE image IS NULL`);
  console.log('Products still without images:', nulls.rows[0].count);

  await client.end();
  console.log('Done!');
}

run().catch(console.error);
