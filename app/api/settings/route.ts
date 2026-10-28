import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let cachedSettings: any = null;
let lastSettingsTime = 0;
const SETTINGS_TTL_MS = 60_000; // 60 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedSettings && now - lastSettingsTime < SETTINGS_TTL_MS) {
      return NextResponse.json(cachedSettings);
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          restaurantName: "Waffle House",
          phone: "01018671000",
          address: "القاهرة - مصر",
          deliveryZones: JSON.stringify([
            { name: "الحي الثاني", fee: 15 },
            { name: "الحي الأول", fee: 20 },
            { name: "الحي المتميز", fee: 25 },
            { name: "الحصري", fee: 20 },
          ]),
          soundsEnabled: true,
          specialOffers: "open", // store status: open, busy, closed, disabled
        },
      });
    }

    cachedSettings = settings;
    lastSettingsTime = now;
    return NextResponse.json(settings);
  } catch (err: unknown) {
    if (cachedSettings) return NextResponse.json(cachedSettings);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const updated = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        restaurantName: body.restaurantName,
        phone: body.phone,
        address: body.address,
        soundsEnabled: body.soundsEnabled,
        specialOffers: body.specialOffers || body.status, // use for store status
        deliveryZones: typeof body.deliveryZones === "string" ? body.deliveryZones : JSON.stringify(body.deliveryZones || []),
      },
      create: {
        id: "default",
        restaurantName: body.restaurantName || "Waffle House",
        phone: body.phone || "01018671000",
        address: body.address || "القاهرة - مصر",
        soundsEnabled: body.soundsEnabled ?? true,
        specialOffers: body.specialOffers || "open",
        deliveryZones: typeof body.deliveryZones === "string" ? body.deliveryZones : JSON.stringify(body.deliveryZones || []),
      },
    });

    cachedSettings = updated;
    lastSettingsTime = Date.now();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
