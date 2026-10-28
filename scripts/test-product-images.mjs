import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Checking ${products.length} products images...`);

  let broken = [];
  let ok = [];

  for (const p of products) {
    if (!p.image) {
      broken.push({ name: p.nameAr, url: "(no image)", status: "MISSING" });
      continue;
    }

    try {
      // Clean up url if it contains &amp;
      const cleanUrl = p.image.replace(/&amp;/g, '&');
      const res = await fetch(encodeURI(cleanUrl), { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        ok.push({ name: p.nameAr, status: res.status });
      } else {
        broken.push({ id: p.id, name: p.nameAr, url: p.image, status: res.status });
      }
    } catch (e) {
      broken.push({ id: p.id, name: p.nameAr, url: p.image, status: e.message });
    }
  }

  console.log(`\nOK images: ${ok.length}`);
  console.log(`BROKEN images: ${broken.length}`);
  for (const b of broken) {
    console.log(`- [${b.status}] ${b.name}: ${b.url}`);
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
  process.exit(0);
});
