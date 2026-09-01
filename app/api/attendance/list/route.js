import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET — قائمة الحضور مع فلترة اختيارية
// ?student_id=xxx  → حضور طالب معين
// ?date=2026-09-01 → حضور يوم معين
// ?month=2026-09   → حضور شهر معين
// ?group_name=xxx  → حضور مجموعة معينة
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const group_name = searchParams.get("group_name");

    let sql = `
      SELECT 
        a.id, 
        a.date, 
        a.created_at,
        u.id as student_id,
        u.name as student_name,
        u.phone as student_phone,
        u.group_name as student_group_name,
        ast.id as assistant_id,
        ast.name as assistant_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN users ast ON a.assistant_id = ast.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += " AND a.student_id = ?";
      params.push(student_id);
    }

    if (date) {
      sql += " AND a.date = ?";
      params.push(date);
    }

    if (month) {
      sql += " AND a.date LIKE ?";
      params.push(`${month}%`);
    }

    if (group_name) {
      sql += " AND u.group_name = ?";
      params.push(group_name);
    }

    sql += " ORDER BY a.created_at DESC";

    const rows = db.prepare(sql).all(...params);

    // Format output matching previous frontend shape
    const attendance = rows.map((r) => ({
      id: r.id,
      date: r.date,
      created_at: r.created_at,
      student: {
        id: r.student_id,
        name: r.student_name,
        phone: r.student_phone,
        group_name: r.student_group_name,
      },
      assistant: r.assistant_id ? {
        id: r.assistant_id,
        name: r.assistant_name,
      } : null,
    }));

    return NextResponse.json({ success: true, attendance });
  } catch (e) {
    console.error("Attendance list GET error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب الحضور" }, { status: 500 });
  }
}
