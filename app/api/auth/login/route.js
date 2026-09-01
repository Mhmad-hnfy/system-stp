import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signCookieValue } from "@/lib/auth";

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password)
      return NextResponse.json({ success: false, message: "أدخل رقم الهاتف وكلمة السر" }, { status: 400 });

    const cleanPhone = phone.trim();

    // Query user by phone via SQLite
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(cleanPhone);

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف غير مسجل" }, { status: 401 });
    }

    // Check password (support both bcrypt hash and plaintext fallback)
    let match = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = user.password === password;
    }

    if (!match)
      return NextResponse.json({ success: false, message: "كلمة السر غير صحيحة" }, { status: 401 });

    // Remove sensitive password from response
    const { password: _, ...safeUser } = user;

    const signedRole = await signCookieValue(safeUser.role || "student");
    const signedId = await signCookieValue(safeUser.id);

    const res = NextResponse.json({ success: true, user: safeUser });
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    res.cookies.set("center_role", signedRole, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });
    res.cookies.set("center_uid", signedId, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });

    return res;
  } catch (e) {
    console.error("Login route error:", e);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
