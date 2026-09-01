import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// POST — تسجيل الحضور بعد سكان QR أو الاختيار اليدوي
export async function POST(req) {
  try {
    const { student_id: rawId, assistant_id } = await req.json();
    const student_id = rawId?.toString().trim();

    if (!student_id) {
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });
    }

    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id, name, phone, role, group_name")
      .eq("id", student_id)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ success: false, message: "الطالب غير موجود في النظام — تأكد أن الطالب مسجّل" }, { status: 404 });
    }

    if (student.role !== "student") {
      return NextResponse.json({ success: false, message: "هذا الحساب ليس لطالب" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already attended today
    const { data: already } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", student_id)
      .eq("date", today)
      .maybeSingle();

    if (already) {
      return NextResponse.json({
        success: false,
        alreadyRecorded: true,
        message: `${student.name} — تم تسجيل حضوره مسبقاً اليوم ✓`,
        student,
      });
    }

    const attId = uuidv4();
    const { data: att, error: insertError } = await supabase
      .from("attendance")
      .insert([
        {
          id: attId,
          student_id,
          assistant_id: assistant_id || null,
          date: today,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      console.error("Supabase attendance insert error:", insertError);
      return NextResponse.json({ success: false, message: "خطأ في حفظ سجل الحضور" }, { status: 500 });
    }

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
