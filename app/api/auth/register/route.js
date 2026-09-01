import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { signCookieValue } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { name, phone, password, group_name } = await req.json();
    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات المطلوبة" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanGroup = group_name?.trim() || null;

    // Check existing phone
    const { data: exists, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (checkError) {
      console.error("Supabase phone check error:", checkError);
      return NextResponse.json({ success: false, message: "خطأ في الاتصال بقاعدة البيانات" }, { status: 500 });
    }

    if (exists) {
      return NextResponse.json({ success: false, message: "رقم الهاتف مسجل بالفعل" }, { status: 409 });
    }

    // Lookup group_id if group_name is provided
    let groupId = null;
    if (cleanGroup) {
      const { data: groupRecord } = await supabase
        .from("groups")
        .select("id")
        .eq("name", cleanGroup)
        .maybeSingle();

      if (groupRecord) {
        groupId = groupRecord.id;
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          name: cleanName,
          phone: cleanPhone,
          password: hashed,
          role: "student",
          group_id: groupId,
          group_name: cleanGroup,
          status: "نشط",
        },
      ])
      .select("id, name, phone, role, group_id, group_name, status, created_at")
      .single();

    if (insertError) {
      console.error("Supabase register error:", insertError);
      return NextResponse.json({ success: false, message: "تعذر حفظ بيانات الحساب" }, { status: 500 });
    }

    const signedRole = await signCookieValue(newUser.role);
    const signedId = await signCookieValue(newUser.id);

    const res = NextResponse.json({ success: true, user: newUser });
    const maxAge = 60 * 60 * 24 * 7;
    res.cookies.set("center_role", signedRole, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });
    res.cookies.set("center_uid", signedId, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });

    return res;
  } catch (e) {
    console.error("Register catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في الخادم أثناء التسجيل" }, { status: 500 });
  }
}
