import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "1";

    const where = showAll ? {} : { isActive: true };
    const zones = await prisma.deliveryZone.findMany({
      where,
      orderBy: [{ nameAr: "asc" }],
    });

    return NextResponse.json(zones);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameAr, nameEn, fee, timeMinutes, code } = body;

    if (!nameAr || fee === undefined) {
      return NextResponse.json({ error: "اسم المنطقة ورسوم التوصيل مطلوبان" }, { status: 400 });
    }

    const created = await prisma.deliveryZone.create({
      data: {
        nameAr: String(nameAr).trim(),
        nameEn: String(nameEn || nameAr).trim(),
        fee: parseFloat(String(fee)) || 0,
        timeMinutes: parseInt(String(timeMinutes || 45), 10),
        code: code ? String(code).trim() : undefined,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, zone: created });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nameAr, nameEn, fee, timeMinutes, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف المنطقة مطلوب" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (nameAr !== undefined) data.nameAr = String(nameAr).trim();
    if (nameEn !== undefined) data.nameEn = String(nameEn).trim();
    if (fee !== undefined) data.fee = parseFloat(String(fee));
    if (timeMinutes !== undefined) data.timeMinutes = parseInt(String(timeMinutes), 10);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.deliveryZone.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, zone: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف المنطقة مطلوب" }, { status: 400 });
    }

    await prisma.deliveryZone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
