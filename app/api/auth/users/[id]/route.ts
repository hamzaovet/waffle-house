import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

/* ── PATCH /api/auth/users/[id] — update user ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;  // params is a Promise in this Next.js version
    const body = await req.json();
    const { name, phone, role, department, username, password } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (role !== undefined) dataToUpdate.role = role;
    if (department !== undefined) dataToUpdate.department = department;
    if (username !== undefined) dataToUpdate.username = username.trim();
    if (password && password.length > 0) {
      dataToUpdate.passwordHash = sha256(String(password));
    }

    if (Object.keys(dataToUpdate).length === 0)
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, phone: true, role: true, department: true, avatar: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── DELETE /api/auth/users/[id] — delete user ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: "لا يمكن حذف حساب المالك" }, { status: 403 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
