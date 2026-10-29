import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { isLockedDown: true, updatedAt: true },
    });
    return NextResponse.json({
      isLockedDown: !!settings?.isLockedDown,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin, isLockedDown } = body;

    // Security PIN check for Maestro
    if (String(pin).trim() !== "157230") {
      return NextResponse.json(
        { error: "رمز الأمان PIN الخاص بالمايسترو غير صحيح " },
        { status: 403 }
      );
    }

    const updated = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        isLockedDown: Boolean(isLockedDown),
      },
      create: {
        id: "default",
        restaurantName: "Waffle House",
        phone: "01018671000",
        address: "القاهرة - مصر",
        isLockedDown: Boolean(isLockedDown),
      },
    });

    return NextResponse.json({
      success: true,
      isLockedDown: updated.isLockedDown,
      message: updated.isLockedDown
        ? "🔒 تم تفعيل وضع الإغلاق الأمني بنجاح! جميع الحسابات معطلة مؤقتاً لحين تسليم المشروع، والدخول مقتصر على المايسترو فقط."
        : "🔓 تم إلغاء الإغلاق الأمني وتنشيط جميع الحسابات بنجاح!",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
