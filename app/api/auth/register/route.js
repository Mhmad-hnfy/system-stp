import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signCookieValue } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { name, phone, password, group_name } = await req.json();
    if (!name || !phone || !password)
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات المطلوبة" }, { status: 400 });

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanGroup = group_name?.trim() || null;

    // Check existing phone
    const exists = db.prepare("SELECT id FROM users WHERE phone = ?").get(cleanPhone);
    if (exists)
      return NextResponse.json({ success: false, message: "رقم الهاتف مسجل بالفعل" }, { status: 409 });

    // Lookup group_id if group_name is provided
    let groupId = null;
    if (cleanGroup) {
      const groupRecord = db.prepare("SELECT id FROM groups WHERE name = ?").get(cleanGroup);
      if (groupRecord) {
        groupId = groupRecord.id;
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, phone, password, role, group_id, group_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanName, cleanPhone, hashed, "student", groupId, cleanGroup, "نشط");

    const user = db.prepare("SELECT id, name, phone, role, group_id, group_name, status, created_at FROM users WHERE id = ?").get(userId);

    const signedRole = await signCookieValue(user.role);
    const signedId = await signCookieValue(user.id);

    const res = NextResponse.json({ success: true, user });
    const maxAge = 60 * 60 * 24 * 7;
    res.cookies.set("center_role", signedRole, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });
    res.cookies.set("center_uid", signedId, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });

    return res;
  } catch (e) {
    console.error("Register catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في الخادم أثناء التسجيل" }, { status: 500 });
  }
}
