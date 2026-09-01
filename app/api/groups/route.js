import { NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET — قائمة المجموعات مع عدد الطلاب
export async function GET() {
  try {
    const groups = db.prepare(`
      SELECT 
        g.id, 
        g.name, 
        g.notes, 
        g.created_at,
        COUNT(u.id) as students_count
      FROM groups g
      LEFT JOIN users u ON (u.group_id = g.id OR u.group_name = g.name) AND u.role = 'student'
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `).all();

    return NextResponse.json({ success: true, groups });
  } catch (e) {
    console.error("Groups GET error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب المجموعات" }, { status: 500 });
  }
}

// POST — إضافة مجموعة جديدة
export async function POST(req) {
  try {
    const { name, notes } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "يرجى كتابة اسم المجموعة" }, { status: 400 });
    }

    const cleanName = name.trim();
    const existing = db.prepare("SELECT id FROM groups WHERE name = ?").get(cleanName);
    if (existing) {
      return NextResponse.json({ success: false, message: "يوجد مجموعة مسجلة بهذا الاسم بالفعل" }, { status: 409 });
    }

    const id = uuidv4();
    db.prepare("INSERT INTO groups (id, name, notes) VALUES (?, ?, ?)").run(id, cleanName, notes?.trim() || null);

    const newGroup = db.prepare("SELECT * FROM groups WHERE id = ?").get(id);
    return NextResponse.json({ success: true, group: newGroup, message: "تم إنشاء المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups POST error:", e);
    return NextResponse.json({ success: false, message: "خطأ في إنشاء المجموعة" }, { status: 500 });
  }
}

// PUT — تعديل مجموعة
export async function PUT(req) {
  try {
    const { id, name, notes } = await req.json();
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });
    }

    const cleanName = name.trim();
    const oldGroup = db.prepare("SELECT name FROM groups WHERE id = ?").get(id);
    if (!oldGroup) {
      return NextResponse.json({ success: false, message: "المجموعة غير موجودة" }, { status: 404 });
    }

    db.prepare("UPDATE groups SET name = ?, notes = ? WHERE id = ?").run(cleanName, notes?.trim() || null, id);

    // Also update group_name in users and schedule if changed
    if (oldGroup.name !== cleanName) {
      db.prepare("UPDATE users SET group_name = ? WHERE group_id = ? OR group_name = ?").run(cleanName, id, oldGroup.name);
      db.prepare("UPDATE groups_schedule SET group_name = ? WHERE group_name = ?").run(cleanName, oldGroup.name);
    }

    const updated = db.prepare("SELECT * FROM groups WHERE id = ?").get(id);
    return NextResponse.json({ success: true, group: updated, message: "تم تعديل المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups PUT error:", e);
    return NextResponse.json({ success: false, message: "خطأ في تعديل المجموعة" }, { status: 500 });
  }
}

// DELETE — حذف مجموعة
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "معرف المجموعة مطلوب" }, { status: 400 });
    }

    const group = db.prepare("SELECT name FROM groups WHERE id = ?").get(id);
    if (!group) {
      return NextResponse.json({ success: false, message: "المجموعة غير موجودة" }, { status: 404 });
    }

    // Set group_id and group_name to null for users in this group
    db.prepare("UPDATE users SET group_id = NULL, group_name = NULL WHERE group_id = ? OR group_name = ?").run(id, group.name);

    // Delete schedules for this group
    db.prepare("DELETE FROM groups_schedule WHERE group_name = ?").run(group.name);

    // Delete group
    db.prepare("DELETE FROM groups WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "تم حذف المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups DELETE error:", e);
    return NextResponse.json({ success: false, message: "خطأ في حذف المجموعة" }, { status: 500 });
  }
}
