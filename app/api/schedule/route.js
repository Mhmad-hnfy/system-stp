import { NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET — جلب جدول المواعيد
// ?group_name=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const group_name = searchParams.get("group_name");

    let schedule;
    if (group_name) {
      schedule = db.prepare(`
        SELECT id, group_name, day, subject, time_from, time_to, created_at 
        FROM groups_schedule 
        WHERE group_name = ? 
        ORDER BY id ASC
      `).all(group_name);
    } else {
      schedule = db.prepare(`
        SELECT id, group_name, day, subject, time_from, time_to, created_at 
        FROM groups_schedule 
        ORDER BY group_name ASC, id ASC
      `).all();
    }

    return NextResponse.json({ success: true, schedule });
  } catch (e) {
    console.error("Schedule GET error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب الجدول" }, { status: 500 });
  }
}

// POST — الأدمن يضيف موعد
export async function POST(req) {
  try {
    const { group_name, day, subject, time_from, time_to, created_by } = await req.json();
    if (!group_name || !day || !subject || !time_from || !time_to)
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات" }, { status: 400 });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO groups_schedule (id, group_name, day, subject, time_from, time_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, group_name.trim(), day.trim(), subject.trim(), time_from.trim(), time_to.trim(), created_by || null);

    const newSchedule = db.prepare("SELECT * FROM groups_schedule WHERE id = ?").get(id);
    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch (e) {
    console.error("Schedule POST error:", e);
    return NextResponse.json({ success: false, message: "خطأ في إضافة الموعد" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف موعد
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    db.prepare("DELETE FROM groups_schedule WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Schedule DELETE error:", e);
    return NextResponse.json({ success: false, message: "خطأ في الحذف" }, { status: 500 });
  }
}
