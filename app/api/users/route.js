import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// GET — قائمة المستخدمين
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    let users;
    if (role) {
      users = db.prepare(`
        SELECT id, name, phone, role, group_id, group_name, status, created_at 
        FROM users 
        WHERE role = ? 
        ORDER BY created_at DESC
      `).all(role);
    } else {
      users = db.prepare(`
        SELECT id, name, phone, role, group_id, group_name, status, created_at 
        FROM users 
        ORDER BY created_at DESC
      `).all();
    }

    return NextResponse.json({ success: true, users });
  } catch (e) {
    console.error("Users GET error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
  }
}

// POST — الأدمن يضيف مستخدم (طالب أو أسستنت)
export async function POST(req) {
  try {
    const { name, phone, password, role, group_name } = await req.json();
    if (!name || !phone || !password)
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات المطلوبة" }, { status: 400 });

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanRole = role || "student";
    const cleanGroup = group_name?.trim() || null;

    const exists = db.prepare("SELECT id FROM users WHERE phone = ?").get(cleanPhone);
    if (exists)
      return NextResponse.json({ success: false, message: "رقم الهاتف مسجل بالفعل" }, { status: 409 });

    let groupId = null;
    if (cleanGroup) {
      const grp = db.prepare("SELECT id FROM groups WHERE name = ?").get(cleanGroup);
      if (grp) groupId = grp.id;
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, phone, password, role, group_id, group_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanName, cleanPhone, hashed, cleanRole, groupId, cleanGroup, "نشط");

    const user = db.prepare("SELECT id, name, phone, role, group_id, group_name, status, created_at FROM users WHERE id = ?").get(userId);
    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error("Users POST error:", e);
    return NextResponse.json({ success: false, message: "خطأ في إنشاء الحساب" }, { status: 500 });
  }
}

// PUT — تعديل بيانات مستخدم (مثلاً تغيير مجموعته أو اسمه)
export async function PUT(req) {
  try {
    const { id, name, phone, password, group_name, status } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "معرف المستخدم مطلوب" }, { status: 400 });

    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!existing) return NextResponse.json({ success: false, message: "المستخدم غير موجود" }, { status: 404 });

    const newName = name?.trim() || existing.name;
    const newPhone = phone?.trim() || existing.phone;
    const newGroup = group_name !== undefined ? (group_name?.trim() || null) : existing.group_name;
    const newStatus = status || existing.status;

    let groupId = existing.group_id;
    if (group_name !== undefined) {
      if (newGroup) {
        const grp = db.prepare("SELECT id FROM groups WHERE name = ?").get(newGroup);
        groupId = grp ? grp.id : null;
      } else {
        groupId = null;
      }
    }

    let newPassword = existing.password;
    if (password && password.trim()) {
      newPassword = await bcrypt.hash(password.trim(), 12);
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, password = ?, group_id = ?, group_name = ?, status = ?
      WHERE id = ?
    `).run(newName, newPhone, newPassword, groupId, newGroup, newStatus, id);

    const updated = db.prepare("SELECT id, name, phone, role, group_id, group_name, status, created_at FROM users WHERE id = ?").get(id);
    return NextResponse.json({ success: true, user: updated, message: "تم تحديث البيانات بنجاح ✓" });
  } catch (e) {
    console.error("Users PUT error:", e);
    return NextResponse.json({ success: false, message: "خطأ في تحديث البيانات" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف مستخدم
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    const deleteUserTx = db.transaction((userId) => {
      // 1. Delete student attendance or clear assistant references
      db.prepare("DELETE FROM attendance WHERE student_id = ?").run(userId);
      db.prepare("UPDATE attendance SET assistant_id = NULL WHERE assistant_id = ?").run(userId);

      // 2. Delete student payment receipts or clear admin confirmer references
      db.prepare("DELETE FROM payment_receipts WHERE student_id = ?").run(userId);
      db.prepare("UPDATE payment_receipts SET confirmed_by = NULL WHERE confirmed_by = ?").run(userId);

      // 3. Clear schedule creator references
      db.prepare("UPDATE groups_schedule SET created_by = NULL WHERE created_by = ?").run(userId);

      // 4. Delete user
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });

    deleteUserTx(id);

    return NextResponse.json({ success: true, message: "تم حذف الحساب وجميع متعلقاته بنجاح ✓" });
  } catch (e) {
    console.error("Users DELETE error:", e);
    return NextResponse.json({ success: false, message: e.message || "خطأ في الحذف" }, { status: 500 });
  }
}
