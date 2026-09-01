import { NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST — تسجيل الحضور بعد سكان QR أو الاختيار اليدوي
export async function POST(req) {
  try {
    const { student_id: rawId, assistant_id } = await req.json();
    const student_id = rawId?.toString().trim();

    if (!student_id)
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    const student = db.prepare("SELECT id, name, phone, role, group_name FROM users WHERE id = ?").get(student_id);

    if (!student)
      return NextResponse.json({ success: false, message: "الطالب غير موجود في النظام — تأكد أن الطالب مسجّل" }, { status: 404 });

    if (student.role !== "student")
      return NextResponse.json({ success: false, message: "هذا الحساب ليس لطالب" }, { status: 400 });

    const today = new Date().toISOString().split("T")[0];

    // Check if already attended today
    const already = db.prepare("SELECT id FROM attendance WHERE student_id = ? AND date = ?").get(student_id, today);
    if (already) {
      return NextResponse.json({
        success: false,
        alreadyRecorded: true,
        message: `${student.name} — تم تسجيل حضوره مسبقاً اليوم ✓`,
        student,
      });
    }

    const attId = uuidv4();
    db.prepare(`
      INSERT INTO attendance (id, student_id, assistant_id, date)
      VALUES (?, ?, ?, ?)
    `).run(attId, student_id, assistant_id || null, today);

    const att = db.prepare("SELECT * FROM attendance WHERE id = ?").get(attId);

    return NextResponse.json({
      success: true,
      message: `تم تسجيل حضور ${student.name} ✓`,
      student,
      attendance: att,
    });
  } catch (e) {
    console.error("Attendance scan error:", e);
    return NextResponse.json({ success: false, message: "خطأ في تسجيل الحضور" }, { status: 500 });
  }
}
