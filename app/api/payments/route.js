import { NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET — جلب وصولات الدفع
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const status = searchParams.get("status");
    const month = searchParams.get("month");

    let sql = `
      SELECT 
        p.id, 
        p.month, 
        p.image_url, 
        p.status, 
        p.notes, 
        p.created_at, 
        p.confirmed_at,
        u.id as student_id,
        u.name as student_name,
        u.phone as student_phone,
        u.group_name as student_group_name,
        c.id as confirmer_id,
        c.name as confirmer_name
      FROM payment_receipts p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN users c ON p.confirmed_by = c.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += " AND p.student_id = ?";
      params.push(student_id);
    }
    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }
    if (month) {
      sql += " AND p.month = ?";
      params.push(month);
    }

    sql += " ORDER BY p.created_at DESC";

    const rows = db.prepare(sql).all(...params);

    const receipts = rows.map((r) => ({
      id: r.id,
      month: r.month,
      image_url: r.image_url,
      status: r.status,
      notes: r.notes,
      created_at: r.created_at,
      confirmed_at: r.confirmed_at,
      student: {
        id: r.student_id,
        name: r.student_name,
        phone: r.student_phone,
        group_name: r.student_group_name,
      },
      confirmer: r.confirmer_id ? {
        id: r.confirmer_id,
        name: r.confirmer_name,
      } : null,
    }));

    return NextResponse.json({ success: true, receipts });
  } catch (e) {
    console.error("Payments GET error:", e);
    return NextResponse.json({ success: false, message: "خطأ في جلب البيانات" }, { status: 500 });
  }
}

// POST — رفع وصل دفع (من الطالب)
export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, month, image_url } = body;
    if (!student_id || !month || !image_url)
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    const existing = db.prepare("SELECT id FROM payment_receipts WHERE student_id = ? AND month = ?").get(student_id, month);

    let receiptId;
    if (existing) {
      receiptId = existing.id;
      db.prepare(`
        UPDATE payment_receipts 
        SET image_url = ?, status = 'pending', notes = NULL, confirmed_by = NULL, confirmed_at = NULL 
        WHERE id = ?
      `).run(image_url, receiptId);
    } else {
      receiptId = uuidv4();
      db.prepare(`
        INSERT INTO payment_receipts (id, student_id, month, image_url, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(receiptId, student_id, month, image_url);
    }

    const receipt = db.prepare("SELECT * FROM payment_receipts WHERE id = ?").get(receiptId);
    return NextResponse.json({ success: true, receipt });
  } catch (e) {
    console.error("Payments POST error:", e);
    return NextResponse.json({ success: false, message: "خطأ في رفع الوصل" }, { status: 500 });
  }
}

// PATCH — الأدمن يؤكد الدفع
export async function PATCH(req) {
  try {
    const { receipt_id, admin_id, notes } = await req.json();
    if (!receipt_id)
      return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 });

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE payment_receipts 
      SET status = 'confirmed', confirmed_by = ?, confirmed_at = ?, notes = ?
      WHERE id = ?
    `).run(admin_id || null, now, notes || null, receipt_id);

    const receipt = db.prepare("SELECT * FROM payment_receipts WHERE id = ?").get(receipt_id);
    return NextResponse.json({ success: true, message: "تم تأكيد الدفع ✓", receipt });
  } catch (e) {
    console.error("Payments PATCH error:", e);
    return NextResponse.json({ success: false, message: "خطأ في التأكيد" }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف إيصال دفع
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "معرف الإيصال مطلوب" }, { status: 400 });

    db.prepare("DELETE FROM payment_receipts WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: "تم حذف الإيصال بنجاح ✓" });
  } catch (e) {
    console.error("Payments DELETE error:", e);
    return NextResponse.json({ success: false, message: "خطأ في حذف الإيصال" }, { status: 500 });
  }
}
