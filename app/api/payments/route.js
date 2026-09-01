import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET — جلب وصولات الدفع
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const status = searchParams.get("status");
    const month = searchParams.get("month");

    let query = supabase
      .from("payment_receipts")
      .select("id, month, image_url, status, notes, created_at, confirmed_at, student_id, confirmed_by")
      .order("created_at", { ascending: false });

    if (student_id) query = query.eq("student_id", student_id);
    if (status) query = query.eq("status", status);
    if (month) query = query.eq("month", month);

    const { data: rows, error } = await query;

    if (error) {
      console.error("Supabase payments GET error:", error);
      return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
    }

    const userIds = new Set();
    (rows || []).forEach((r) => {
      if (r.student_id) userIds.add(r.student_id);
      if (r.confirmed_by) userIds.add(r.confirmed_by);
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

    const receipts = (rows || []).map((r) => {
      const student = usersMap[r.student_id];
      const confirmer = r.confirmed_by ? usersMap[r.confirmed_by] : null;

      return {
        id: r.id,
        month: r.month,
        image_url: r.image_url,
        status: r.status,
        notes: r.notes,
        created_at: r.created_at,
        confirmed_at: r.confirmed_at,
        student: student
          ? {
              id: student.id,
              name: student.name,
              phone: student.phone,
              group_name: student.group_name,
            }
          : { id: r.student_id, name: "طالب غير معروف", phone: "", group_name: "" },
        confirmer: confirmer
          ? {
              id: confirmer.id,
              name: confirmer.name,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, receipts });
  } catch (e) {
    console.error("Payments GET catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
  }
}

// POST — رفع وصل دفع (من الطالب)
export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, month, image_url } = body;
    if (!student_id || !month || !image_url) {
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("payment_receipts")
      .select("id")
      .eq("student_id", student_id)
      .eq("month", month)
      .maybeSingle();

    let receipt;
    if (existing) {
      const { data: updated, error } = await supabase
        .from("payment_receipts")
        .update({
          image_url,
          status: "pending",
          notes: null,
          confirmed_by: null,
          confirmed_at: null,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase payment update error:", error);
        return NextResponse.json({ success: false, message: "خطأ في تحديث الوصل" }, { status: 500 });
      }
      receipt = updated;
    } else {
      const receiptId = uuidv4();
      const { data: inserted, error } = await supabase
        .from("payment_receipts")
        .insert([
          {
            id: receiptId,
            student_id,
            month,
            image_url,
            status: "pending",
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Supabase payment insert error:", error);
        return NextResponse.json({ success: false, message: "خطأ في رفع الوصل" }, { status: 500 });
      }
      receipt = inserted;
    }

    return NextResponse.json({ success: true, receipt });
  } catch (e) {
    console.error("Payments POST catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في رفع الوصل" }, { status: 500 });
  }
}

// PATCH — الأدمن يؤكد الدفع
export async function PATCH(req) {
  try {
    const { receipt_id, admin_id, notes } = await req.json();
    if (!receipt_id) {
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: receipt, error } = await supabase
      .from("payment_receipts")
      .update({
        status: "confirmed",
        confirmed_by: admin_id || null,
        confirmed_at: now,
        notes: notes || null,
      })
      .eq("id", receipt_id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase payments PATCH error:", error);
      return NextResponse.json({ success: false, message: "خطأ في التأكيد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم تأكيد الدفع ✓", receipt });
  } catch (e) {
    console.error("Payments PATCH catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في التأكيد" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف إيصال دفع
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "معرف الإيصال مطلوب" }, { status: 400 });

    const { error } = await supabase.from("payment_receipts").delete().eq("id", id);

    if (error) {
      console.error("Supabase payments DELETE error:", error);
      return NextResponse.json({ success: false, message: "خطأ في حذف الإيصال" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم حذف الإيصال بنجاح ✓" });
  } catch (e) {
    console.error("Payments DELETE catch error:", e);
    return NextResponse.json({ success: false, message: "خطأ في حذف الإيصال" }, { status: 500 });
  }
}
