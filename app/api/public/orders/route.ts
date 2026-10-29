import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public order placement
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.phone || !body.items) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const orderNumber = `WH-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(Date.now()).slice(-4)}`;

    const orderType = body.orderType || "delivery";
    const items = typeof body.items === "string" ? body.items : JSON.stringify(body.items);
    const subtotal = body.subtotal || 0;
    const deliveryFee = (orderType === "takeaway" || orderType === "dinein") ? 0 : (body.deliveryFee ?? 15);
    const total = subtotal + deliveryFee;
    const deposit = body.deposit || 0;
    const remaining = total - deposit;
    const timeline = JSON.stringify([{ stage: "new", at: now.toISOString(), by: "customer" }]);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: body.customerName,
        phone: body.phone,
        address: body.address || "",
        zone: orderType === "takeaway" ? "استلام من فرع حدائق القبة" : (orderType === "dinein" ? "صالة" : (body.zone || "حدائق القبة")),
        orderType,
        items,
        subtotal,
        deliveryFee,
        total,
        deposit,
        remaining,
        paymentMethod: body.paymentMethod || "cash",
        notes: body.notes || "",
        customerEmail: body.customerEmail || null,
        customerId: body.customerId || null,
        timeline,
        status: "new",
      },
    });

    // Auto-save/update customer in Customer database
    try {
      const cleanPhone = String(body.phone).trim();
      const cleanName = String(body.customerName).trim();
      const cleanAddr = String(body.address || "").trim();
      const cleanZone = String(body.orderType === "takeaway" ? "استلام من فرع حدائق القبة" : (body.zone || "حدائق القبة")).trim();
      const cleanEmail = body.customerEmail ? String(body.customerEmail).trim().toLowerCase() : null;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "Customer" (id, name, phone, email, address, zone, "isVerified", "updatedAt")
        VALUES (
          ${`'cust_${Date.now()}'`},
          ${`'${cleanName.replace(/'/g, "''")}'`},
          ${`'${cleanPhone.replace(/'/g, "''")}'`},
          ${cleanEmail ? `'${cleanEmail.replace(/'/g, "''")}'` : 'NULL'},
          ${`'${cleanAddr.replace(/'/g, "''")}'`},
          ${`'${cleanZone.replace(/'/g, "''")}'`},
          false,
          NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          zone = EXCLUDED.zone,
          "updatedAt" = NOW();
      `);
    } catch (custErr) {
      console.warn("Auto-save customer error:", custErr);
    }

    return NextResponse.json({ success: true, orderNumber, orderId: order.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
