import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { nameAr: "وافل", nameEn: "Waffle", image: "/categories/waffle.jpg", sortOrder: 1 },
  { nameAr: "بان كيك", nameEn: "Pancake", image: "/categories/pancake.jpg", sortOrder: 2 },
  { nameAr: "تشيز كيك", nameEn: "Cheesecake", image: "/categories/cheesecake.jpg", sortOrder: 3 },
  { nameAr: "ميلك شيك", nameEn: "Milkshake", image: "/categories/milkshake.jpg", sortOrder: 4 },
  { nameAr: "سموزي", nameEn: "Smoothie", image: "/categories/smoothie.jpg", sortOrder: 5 },
  { nameAr: "بوبا", nameEn: "Boba", image: "/categories/boba.jpg", sortOrder: 6 },
  { nameAr: "كيك وحلويات", nameEn: "Cakes & Desserts", image: "/categories/cake.jpg", sortOrder: 7 },
  { nameAr: "مشروبات", nameEn: "Beverages", image: "/categories/drinks.jpg", sortOrder: 8 },
  { nameAr: "مولتن كيك", nameEn: "Molten Cake", image: "/categories/molten.jpg", sortOrder: 9 },
  { nameAr: "عروض خاصة", nameEn: "Special Offers", image: "/categories/offers.jpg", sortOrder: 10 },
];

async function main() {
  console.log("Upserting verified categories into database...");
  for (const cat of CATEGORIES) {
    const res = await prisma.category.upsert({
      where: { nameAr: cat.nameAr },
      update: {
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: cat.sortOrder,
      },
      create: {
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: cat.sortOrder,
      },
    });
    console.log(`- ${res.nameAr}: ${res.image}`);
  }
  console.log("All categories updated successfully!");
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
  process.exit(0);
});
