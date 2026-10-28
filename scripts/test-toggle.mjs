import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing SystemSettings toggle update directly...");
  const res1 = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { offersEnabled: false },
    create: { id: "default", offersEnabled: false }
  });
  console.log("Set to false ->", res1.offersEnabled);

  const check1 = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  console.log("Verification: offersEnabled is now in DB:", check1.offersEnabled);

  const res2 = await prisma.systemSettings.update({
    where: { id: "default" },
    data: { offersEnabled: true }
  });
  console.log("Reset back to true ->", res2.offersEnabled);
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
  process.exit(0);
});
