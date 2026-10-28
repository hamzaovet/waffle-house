import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_gMcU8biJrE1l@ep-rough-night-bazkh3dn-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const adapter = new PrismaPg({ connectionString }, { schema: "choco" });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("Applying database migrations via @prisma/adapter-pg...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE choco."Order" ADD COLUMN IF NOT EXISTS "captainName" TEXT;
      ALTER TABLE choco."Order" ADD COLUMN IF NOT EXISTS "captainPhone" TEXT;
      ALTER TABLE choco."Order" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
      ALTER TABLE choco."Order" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

      CREATE TABLE IF NOT EXISTS choco."Customer" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT UNIQUE NOT NULL,
        "email" TEXT UNIQUE,
        "address" TEXT,
        "zone" TEXT,
        "otpCode" TEXT,
        "otpExpires" TIMESTAMP(3),
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS choco."Captain" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT UNIQUE NOT NULL,
        "vehicle" TEXT DEFAULT 'سكوتر / موتوسيكل',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE choco."ChatMessage" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
      ALTER TABLE choco."ChatMessage" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
      ALTER TABLE choco."ChatMessage" ADD COLUMN IF NOT EXISTS "isStaff" BOOLEAN DEFAULT false;

      INSERT INTO choco."Captain" (id, name, phone, vehicle, "isActive")
      VALUES 
        ('cpt-1', 'كابتن أحمد سامي', '01011223344', 'سكوتر دليفري', true),
        ('cpt-2', 'كابتن محمود رضا', '01122334455', 'موتوسيكل سريع', true),
        ('cpt-3', 'كابتن زياد إبراهيم', '01233445566', 'سكوتر', true)
      ON CONFLICT (phone) DO NOTHING;
    `);

    console.log("MIGRATION SUCCESSFUL! Tables & columns created in Neon DB.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
