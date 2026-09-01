import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    let query = supabase
      .from("attendance")
      .select("id, date, created_at, student_id, assistant_id")
      .order("created_at", { ascending: false });

    if (student_id) {
      query = query.eq("student_id", student_id);
    }

    if (date) {
      query = query.eq("date", date);
    }

    if (month) {
      query = query.like("date", `${month}%`);
    }

    if (group_name) {
      const { data: groupStudents } = await supabase
        .from("users")
        .select("id")
        .eq("group_name", group_name);

      const groupStudentIds = (groupStudents || []).map((s) => s.id);
      if (groupStudentIds.length === 0) {
        return NextResponse.json({ success: true, attendance: [] });
      }
      query = query.in("student_id", groupStudentIds);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Supabase attendance GET error:", error);
      return NextResponse.json({ success: false, message: "خطأ في جلب الحضور" }, { status: 500 });
    }

    // Collect all related user IDs (students + assistants)
    const userIds = new Set();
    (rows || []).forEach((r) => {
      if (r.student_id) userIds.add(r.student_id);
      if (r.assistant_id) userIds.add(r.assistant_id);
    });

    let usersMap = {};
    if (userIds.size > 0) {
      const { data: usersList } = await supabase
        .from("users")
        .select("id, name, phone, group_name")
        .in("id", Array.from(userIds));

      (usersList || []).forEach((u) => {
        usersMap[u.id] = u;
      });
    }

    // Format output matching frontend shape
    const attendance = (rows || []).map((r) => {
      const student = usersMap[r.student_id];
      const assistant = r.assistant_id ? usersMap[r.assistant_id] : null;

      return {
        id: r.id,
        date: r.date,
        created_at: r.created_at,
        student: student
          ? {
              id: student.id,
              name: student.name,
              phone: student.phone,
              group_name: student.group_name,
            }
          : { id: r.student_id, name: "طالب غير معروف", phone: "", group_name: "" },
        assistant: assistant
          ? {
              id: assistant.id,
              name: assistant.name,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, attendance });
  } catch (e) {
    console.error("Attendance list GET catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب الحضور" }, { status: 500 });
  }
}
