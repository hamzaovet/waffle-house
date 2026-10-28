import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let cachedMenu: any = null;
let lastMenuTime = 0;
const MENU_TTL_MS = 60_000; // 60 seconds cache

export async function GET() {
  try {
    const now = Date.now();
    if (cachedMenu && now - lastMenuTime < MENU_TTL_MS) {
      return NextResponse.json(cachedMenu, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        category: true,
        basePrice: true,
        image: true,
        description: true,
        isAvailable: true,
      },
    });

    cachedMenu = products;
    lastMenuTime = now;

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: unknown) {
    if (cachedMenu) return NextResponse.json(cachedMenu);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
