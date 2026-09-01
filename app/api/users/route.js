import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET — قائمة المستخدمين
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    let query = supabase
      .from("users")
      .select("id, name, phone, role, group_id, group_name, status, created_at")
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("role", role);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Supabase users GET error:", error);
      return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: users || [] });
  } catch (e) {
    console.error("Users GET catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
  }
}

// POST — الأدمن يضيف مستخدم (طالب أو أسستنت)
export async function POST(req) {
  try {
    const { name, phone, password, role, group_name } = await req.json();
    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات المطلوبة" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanRole = role || "student";
    const cleanGroup = group_name?.trim() || null;

    // Check if phone exists
    const { data: exists } = await supabase
      .from("users")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (exists) {
      return NextResponse.json({ success: false, message: "رقم الهاتف مسجل بالفعل" }, { status: 409 });
    }

    let groupId = null;
    if (cleanGroup) {
      const { data: grp } = await supabase
        .from("groups")
        .select("id")
        .eq("name", cleanGroup)
        .maybeSingle();

      if (grp) groupId = grp.id;
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          name: cleanName,
          phone: cleanPhone,
          password: hashed,
          role: cleanRole,
          group_id: groupId,
          group_name: cleanGroup,
          status: "نشط",
        },
      ])
      .select("id, name, phone, role, group_id, group_name, status, created_at")
      .single();

    if (error) {
      console.error("Supabase users POST error:", error);
      return NextResponse.json({ success: false, message: "خطأ في إنشاء الحساب" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error("Users POST catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في إنشاء الحساب" }, { status: 500 });
  }
}

// PUT — تعديل بيانات مستخدم (مثلاً تغيير مجموعته أو اسمه)
export async function PUT(req) {
  try {
    const { id, name, phone, password, group_name, status } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "معرف المستخدم مطلوب" }, { status: 400 });

    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json({ success: false, message: "المستخدم غير موجود" }, { status: 404 });
    }

    const newName = name?.trim() || existing.name;
    const newPhone = phone?.trim() || existing.phone;
    const newGroup = group_name !== undefined ? (group_name?.trim() || null) : existing.group_name;
    const newStatus = status || existing.status;

    let groupId = existing.group_id;
    if (group_name !== undefined) {
      if (newGroup) {
        const { data: grp } = await supabase
          .from("groups")
          .select("id")
          .eq("name", newGroup)
          .maybeSingle();

        groupId = grp ? grp.id : null;
      } else {
        groupId = null;
      }
    }

    let newPassword = existing.password;
    if (password && password.trim()) {
      newPassword = await bcrypt.hash(password.trim(), 12);
    }

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        name: newName,
        phone: newPhone,
        password: newPassword,
        group_id: groupId,
        group_name: newGroup,
        status: newStatus,
      })
      .eq("id", id)
      .select("id, name, phone, role, group_id, group_name, status, created_at")
      .single();

    if (updateError) {
      console.error("Supabase users PUT error:", updateError);
      return NextResponse.json({ success: false, message: "خطأ في تحديث البيانات" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated, message: "تم تحديث البيانات بنجاح ✓" });
  } catch (e) {
    console.error("Users PUT catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في تحديث البيانات" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف مستخدم
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    // 1. Clear assistant references in attendance & confirmed_by in payments & schedule created_by
    await supabase.from("attendance").update({ assistant_id: null }).eq("assistant_id", id);
    await supabase.from("payment_receipts").update({ confirmed_by: null }).eq("confirmed_by", id);
    await supabase.from("groups_schedule").update({ created_by: null }).eq("created_by", id);

    // 2. Delete attendance & payment receipts for student
    await supabase.from("attendance").delete().eq("student_id", id);
    await supabase.from("payment_receipts").delete().eq("student_id", id);

    // 3. Delete user
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("Supabase users DELETE error:", error);
      return NextResponse.json({ success: false, message: "خطأ في حذف المستخدم" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم حذف الحساب وجميع متعلقاته بنجاح ✓" });
  } catch (e) {
    console.error("Users DELETE catch error:", e);
    return NextResponse.json({ success: false, message: e.message || "خطأ في الحذف" }, { status: 500 });
  }
}
