import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// GET — جلب جدول المواعيد
// ?group_name=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const group_name = searchParams.get("group_name");

    let query = supabase
      .from("groups_schedule")
      .select("id, group_name, day, subject, time_from, time_to, created_at, created_by");

    if (group_name) {
      query = query.eq("group_name", group_name).order("id", { ascending: true });
    } else {
      query = query.order("group_name", { ascending: true }).order("id", { ascending: true });
    }

    const { data: schedule, error } = await query;

    if (error) {
      console.error("Supabase schedule GET error:", error);
      return NextResponse.json({ success: false, message: "خطأ في جلب الجدول" }, { status: 500 });
    }

    return NextResponse.json({ success: true, schedule: schedule || [] });
  } catch (e) {
    console.error("Schedule GET catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب الجدول" }, { status: 500 });
  }
}

// POST — الأدمن يضيف موعد
export async function POST(req) {
  try {
    const { group_name, day, subject, time_from, time_to, created_by } = await req.json();
    if (!group_name || !day || !subject || !time_from || !time_to) {
      return NextResponse.json({ success: false, message: "أدخل جميع البيانات" }, { status: 400 });
    }

    const id = uuidv4();
    const { data: newSchedule, error } = await supabase
      .from("groups_schedule")
      .insert([
        {
          id,
          group_name: group_name.trim(),
          day: day.trim(),
          subject: subject.trim(),
          time_from: time_from.trim(),
          time_to: time_to.trim(),
          created_by: created_by || null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase schedule POST error:", error);
      return NextResponse.json({ success: false, message: "خطأ في إضافة الموعد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch (e) {
    console.error("Schedule POST catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في إضافة الموعد" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف موعد
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    const { error } = await supabase.from("groups_schedule").delete().eq("id", id);

    if (error) {
      console.error("Supabase schedule DELETE error:", error);
      return NextResponse.json({ success: false, message: "خطأ في الحذف" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Schedule DELETE catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في الحذف" }, { status: 500 });
  }
}
