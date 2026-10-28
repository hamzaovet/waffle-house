import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const defaults = [
    { nameAr: "وافل", nameEn: "Waffles", image: "/cards/waffle-card.png", sortOrder: 1 },
    { nameAr: "بان كيك", nameEn: "Pancakes", image: "/cards/pancake-card.png", sortOrder: 2 },
    { nameAr: "تشيز كيك", nameEn: "Cheesecake", image: "/cards/cheesecake-card.png", sortOrder: 3 },
    { nameAr: "ميلك شيك", nameEn: "Milkshakes", image: "/cards/milkshake-card.png", sortOrder: 4 },
    { nameAr: "سموزي", nameEn: "Smoothies", image: "/cards/smoothie-card.png", sortOrder: 5 },
    { nameAr: "بوبا", nameEn: "Boba", image: "/cards/boba-card.png", sortOrder: 6 }
  ];

  for (const c of defaults) {
    const id = "cat_" + Math.random().toString(36).substring(2, 9);
    await pool.query(
      `INSERT INTO "Category" ("id", "nameAr", "nameEn", "image", "sortOrder", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       ON CONFLICT ("nameAr") DO NOTHING`,
      [id, c.nameAr, c.nameEn, c.image, c.sortOrder]
    );
  }
  console.log("Categories seeded successfully");
  const res = await pool.query(`SELECT * FROM "Category" ORDER BY "sortOrder" ASC`);
  console.log("Current categories:", res.rows.map(r => r.nameAr));
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  pool.end();
});
