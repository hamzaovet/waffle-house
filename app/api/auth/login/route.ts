import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Fetch system settings for anti-theft lockdown check
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });
    const isLockedDown = !!settings?.isLockedDown;

    /* ── Username + Password Auth ── */
    if (body.username) {
      const username = String(body.username).trim();
      const password = String(body.password || "").trim();
      const pin = body.pin ? String(body.pin).trim() : "";

      if (!username || !password) {
        return NextResponse.json({ error: "يرجى إدخال اسم المستخدم وكلمة المرور" }, { status: 400 });
      }

      const pwHash = sha256(password);

      const user = await prisma.user.findFirst({
        where: {
          username: { equals: username, mode: "insensitive" },
          passwordHash: pwHash,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
      }

      // Check Anti-Theft Lockdown: If active, ONLY maestro can log in!
      const isMaestro = user.username?.toLowerCase() === "maestro" || user.role === "owner";
      if (isLockedDown && !isMaestro) {
        return NextResponse.json(
          {
            error: "⚠️ النظام في وضع الإغلاق الأمني المخصص للتسليم قبل البيع. تم تجميد الحسابات لحماية التطبيق من السرقة. يرجى مراجعة المالك (Maestro).",
          },
          { status: 403 }
        );
      }

      // STRICT PIN CHECK FOR OWNER / MAESTRO:
      // Never allow owner login without the 6-digit Security PIN!
      if (isMaestro) {
        if (!pin) {
          return NextResponse.json({
            requirePin: true,
            error: "مطلوب رمز الأمان PIN المكون من 6 أرقام لتسجيل دخول المالك المعتمد ",
          }, { status: 200 });
        }
        if (user.pin && pin !== user.pin) {
          return NextResponse.json({ error: "رمز الأمان PIN غير صحيح! تم رفض محاولة الدخول." }, { status: 401 });
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
      });
    }

    /* ── Legacy Auth (Phone + PIN) ── */
    if (body.phone) {
      const cleanPhone = String(body.phone).trim();
      const cleanPin = body.pin ? String(body.pin).trim() : "";

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: cleanPhone.replace(/^0/, "") },
            { phone: `0${cleanPhone}` },
          ],
        },
      });

      if (!user) return NextResponse.json({ error: "رقم الموبايل غير مسجل" }, { status: 401 });

      const isMaestro = user.username?.toLowerCase() === "maestro" || user.role === "owner";
      if (isLockedDown && !isMaestro) {
        return NextResponse.json(
          {
            error: "⚠️ النظام في وضع الإغلاق الأمني المخصص للتسليم قبل البيع. تم تجميد الحسابات لحماية التطبيق.",
          },
          { status: 403 }
        );
      }

      // Mandatory PIN check for all phone logins, especially owner
      if (!cleanPin || (user.pin && user.pin !== cleanPin)) {
        return NextResponse.json({ error: "الرقم السري PIN غير صحيح" }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
      });
    }

    return NextResponse.json({ error: "بيانات الدخول غير مكتملة" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
