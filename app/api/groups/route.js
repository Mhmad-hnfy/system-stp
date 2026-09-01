import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET — قائمة المجموعات مع عدد الطلاب
export async function GET() {
  try {
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: true });

    if (groupsError) {
      console.error("Supabase groups GET error:", groupsError);
      return NextResponse.json({ success: false, message: "خطأ في جلب المجموعات" }, { status: 500 });
    }

    const { data: students } = await supabase
      .from("users")
      .select("group_id, group_name")
      .eq("role", "student");

    const countsMap = {};
    if (students) {
      students.forEach((s) => {
        if (s.group_id) countsMap[s.group_id] = (countsMap[s.group_id] || 0) + 1;
        if (s.group_name) countsMap[s.group_name] = (countsMap[s.group_name] || 0) + 1;
      });
    }

    const formattedGroups = (groups || []).map((g) => ({
      ...g,
      students_count: countsMap[g.id] || countsMap[g.name] || 0,
    }));

    return NextResponse.json({ success: true, groups: formattedGroups });
  } catch (e) {
    console.error("Groups GET catch error:", e);
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

    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("name", cleanName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, message: "يوجد مجموعة مسجلة بهذا الاسم بالفعل" }, { status: 409 });
    }

    const id = uuidv4();
    const { data: newGroup, error } = await supabase
      .from("groups")
      .insert([
        {
          id,
          name: cleanName,
          notes: notes?.trim() || null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase groups POST error:", error);
      return NextResponse.json({ success: false, message: "خطأ في إنشاء المجموعة" }, { status: 500 });
    }

    return NextResponse.json({ success: true, group: newGroup, message: "تم إنشاء المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups POST catch error:", e);
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

    const { data: oldGroup, error: findError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError || !oldGroup) {
      return NextResponse.json({ success: false, message: "المجموعة غير موجودة" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("groups")
      .update({
        name: cleanName,
        notes: notes?.trim() || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Supabase groups PUT error:", updateError);
      return NextResponse.json({ success: false, message: "خطأ في تعديل المجموعة" }, { status: 500 });
    }

    // If name changed, update group_name in users and schedule
    if (oldGroup.name !== cleanName) {
      await supabase
        .from("users")
        .update({ group_name: cleanName })
        .or(`group_id.eq.${id},group_name.eq.${oldGroup.name}`);

      await supabase
        .from("groups_schedule")
        .update({ group_name: cleanName })
        .eq("group_name", oldGroup.name);
    }

    return NextResponse.json({ success: true, group: updated, message: "تم تعديل المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups PUT catch error:", e);
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

    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ success: false, message: "المجموعة غير موجودة" }, { status: 404 });
    }

    // Set group_id and group_name to null for users in this group
    await supabase
      .from("users")
      .update({ group_id: null, group_name: null })
      .or(`group_id.eq.${id},group_name.eq.${group.name}`);

    // Delete schedules for this group
    await supabase.from("groups_schedule").delete().eq("group_name", group.name);

    // Delete group
    const { error: deleteError } = await supabase.from("groups").delete().eq("id", id);

    if (deleteError) {
      console.error("Supabase groups DELETE error:", deleteError);
      return NextResponse.json({ success: false, message: "خطأ في حذف المجموعة" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم حذف المجموعة بنجاح ✓" });
  } catch (e) {
    console.error("Groups DELETE catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في حذف المجموعة" }, { status: 500 });
  }
}
