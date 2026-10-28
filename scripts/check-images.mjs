import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany();
  console.log("=== CATEGORIES IN DB ===");
  for (const c of categories) {
    console.log(`- id: ${c.id}, nameAr: "${c.nameAr}", image: "${c.image}"`);
  }

  const products = await prisma.product.findMany({
    select: { id: true, nameAr: true, category: true, image: true },
  });
  console.log("\n=== TOTAL PRODUCTS ===", products.length);
  const byCat = {};
  for (const p of products) {
    byCat[p.category] = byCat[p.category] || [];
    byCat[p.category].push({ name: p.nameAr, image: p.image });
  }
  for (const [cat, items] of Object.entries(byCat)) {
    console.log(`\nCategory: "${cat}" (${items.length} items)`);
    for (const item of items) {
      console.log(`   ${item.name}: ${item.image}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
