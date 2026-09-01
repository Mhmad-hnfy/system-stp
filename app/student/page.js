"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import QRCode from "qrcode";
import { 
  QrCode, 
  Calendar, 
  CalendarDays,
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  LogOut, 
  Upload, 
  BookOpen,
  Sparkles,
  Download,
  PhoneCall,
  Info
} from "lucide-react";

export default function StudentDashboard() {
  const { currentUser, logout, notify, updateCurrentUser, isLoading } = useStore();
  const router = useRouter();

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [receiptsList, setReceiptsList] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month for payment upload
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const [payMonth, setPayMonth] = useState(currentMonthStr);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef(null);

  // Load student data
  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 0. Fetch latest user details (to sync updated group_name)
        let studentGroup = currentUser.group_name;
        try {
          const uRes = await fetch(`/api/users`);
          const uData = await uRes.json();
          if (uData.success && uData.users) {
            const freshMe = uData.users.find((u) => u.id === currentUser.id);
            if (freshMe) {
              studentGroup = freshMe.group_name;
              // Sync localStorage if group changed
              if (freshMe.group_name !== currentUser.group_name) {
                updateCurrentUser({ ...currentUser, ...freshMe });
              }
            }
          }
        } catch (e) {}

        // 1. Generate QR Code with student ID
        const qrUrl = await QRCode.toDataURL(currentUser.id, {
          width: 320,
          margin: 2,
          color: {
            dark: "#0a0f1d",
            light: "#ffffff",
          },
        });
        setQrDataUrl(qrUrl);

        // 2. Fetch Attendance
        const attRes = await fetch(`/api/attendance/list?student_id=${currentUser.id}`);
        const attData = await attRes.json();
        if (attData.success) {
          setAttendanceList(attData.attendance || []);
        }

        // 3. Fetch Payment Receipts
        const payRes = await fetch(`/api/payments?student_id=${currentUser.id}`);
        const payData = await payRes.json();
        if (payData.success) {
          setReceiptsList(payData.receipts || []);
        }

        // 4. Fetch Group Schedule
        if (studentGroup) {
          const schRes = await fetch(`/api/schedule?group_name=${encodeURIComponent(studentGroup)}`);
          const schData = await schRes.json();
          if (schData.success) {
            setScheduleList(schData.schedule || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, router]);

  // Handle Receipt Upload
  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptFile || !payMonth) {
      notify("يرجى اختيار صورة الوصل وتحديد الشهر", "error");
      return;
    }

    setUploadingReceipt(true);
    try {
      // Convert receipt image to Base64
      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("فشل قراءة ملف الصورة"));
        reader.readAsDataURL(receiptFile);
      });

      // 2. Save in database via API
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: currentUser.id,
          month: payMonth,
          image_url: imageUrl,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        notify("تم رفع الوصل بنجاح! سيتم مراجعته من الإدارة ✓", "success");
        setReceiptFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh receipts
        const payRes = await fetch(`/api/payments?student_id=${currentUser.id}`);
        const payData = await payRes.json();
        if (payData.success) setReceiptsList(payData.receipts || []);
      } else {
        notify(resData.message || "فشل رفع الوصل", "error");
      }
    } catch (err) {
      console.error(err);
      notify("حدث خطأ أثناء رفع الوصل", "error");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Payment Status for Current Month
  const currentMonthReceipt = receiptsList.find((r) => r.month === currentMonthStr);
  const isPaidThisMonth = currentMonthReceipt?.status === "confirmed";
  const isPendingThisMonth = currentMonthReceipt?.status === "pending";

  // Attendance stats for current month
  const thisMonthAttendance = attendanceList.filter((a) => a.date?.startsWith(currentMonthStr));

  if (isLoading || !currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <div className="gear-spin-cw" style={{ width: "50px", height: "50px", borderRadius: "50%", border: "4px dashed var(--accent-gold)" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>جاري تحميل بيانات الطالب...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        padding: "0.85rem clamp(1rem, 3vw, 2rem)",
        background: "rgba(17, 26, 46, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            position: "relative",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--accent-gold)",
            flexShrink: 0
          }}>
            <Image src="/logo.jpg" alt="الباشميكانيكي" fill sizes="40px" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", fontWeight: "800", color: "#fff" }}>
              حساب الطالب: {currentUser.name}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--accent-gold)" }}>
              {currentUser.group_name ? `المجموعة: ${currentUser.group_name}` : "لم يتم تحديد مجموعة"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-danger"
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}
        >
          <LogOut size={15} />
          <span>خروج</span>
        </button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: "clamp(1rem, 3vw, 2rem) clamp(0.75rem, 2.5vw, 1.5rem)", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        
        {/* Status Bar */}
        <div className="stat-grid" style={{ marginBottom: "1.75rem" }}>
          {/* Card 1: Attendance Days */}
          <div className="glass-card" style={{ borderRight: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>حضور شهر {currentMonthStr}</span>
              <CalendarDays size={20} color="#60a5fa" />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#fff", marginTop: "0.5rem" }}>
              {thisMonthAttendance.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>أيام حضور</span>
            </div>
          </div>

          {/* Card 2: Total Attendance */}
          <div className="glass-card" style={{ borderRight: "4px solid #10b981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>إجمالي الحضور الكلي</span>
              <CheckCircle2 size={20} color="#34d399" />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#fff", marginTop: "0.5rem" }}>
              {attendanceList.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>مرة</span>
            </div>
          </div>

          {/* Card 3: Payment Status */}
          <div className="glass-card" style={{ borderRight: `4px solid ${isPaidThisMonth ? "#10b981" : isPendingThisMonth ? "#f59e0b" : "#f43f5e"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>حالة دفع شهر {currentMonthStr}</span>
              <CreditCard size={20} color={isPaidThisMonth ? "#34d399" : isPendingThisMonth ? "#fbbf24" : "#fb7185"} />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              {isPaidThisMonth ? (
                <span className="badge badge-success" style={{ fontSize: "0.95rem" }}>مدفوع ومؤكد ✓</span>
              ) : isPendingThisMonth ? (
                <span className="badge badge-warning" style={{ fontSize: "0.95rem" }}>قيد مراجعة الوصل ⏳</span>
              ) : (
                <span className="badge badge-danger" style={{ fontSize: "0.95rem" }}>غير مدفوع بعد ✕</span>
              )}
            </div>
          </div>
        </div>

        {/* 2 Column Layout: QR Code + Attendance/Schedule/Payment */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          
          {/* Column 1: QR Code Card */}
          <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--accent-gold)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              marginBottom: "1.25rem"
            }}>
              <QrCode size={16} />
              <span>كود الحضور الذكي</span>
            </div>

            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              امسح الكود عند الدخول للسنتر
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              أظهر هذا الكود للأسستنت ليسجّل حضورك تلقائياً
            </p>

            {/* QR Container */}
            <div style={{
              background: "#ffffff",
              padding: "clamp(10px, 3vw, 16px)",
              borderRadius: "16px",
              boxShadow: "0 0 25px rgba(59, 130, 246, 0.3)",
              display: "inline-block",
              marginBottom: "1rem",
              maxWidth: "100%"
            }}>
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Student QR Code" 
                  style={{ width: "100%", maxWidth: "240px", height: "auto", aspectRatio: "1/1", display: "block" }} 
                />
              ) : (
                <div style={{ width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
                  جاري تجهيز الكود...
                </div>
              )}
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={16} color="var(--primary)" />
              <span>كود الطالب: <code style={{ color: "#93c5fd" }}>{currentUser.phone}</code></span>
            </div>
          </div>

          {/* Column 2: Upload Receipt & Schedule */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Upload Payment Receipt Section */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <Upload size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>رفع وصل الدفع للشهر</h3>
              </div>

              <form onSubmit={handleUploadReceipt} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    اختر الشهر المراد دفعه:
                  </label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    صورة الوصل (JPG / PNG):
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="input-field"
                    required
                    style={{ padding: "0.6rem" }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-gold" 
                  disabled={uploadingReceipt}
                  style={{ width: "100%", padding: "0.75rem" }}
                >
                  {uploadingReceipt ? "جاري الرفع..." : "إرسال الوصل للإدارة ✓"}
                </button>
              </form>

              {/* Uploaded History */}
              {receiptsList.length > 0 && (
                <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)" }}>سجل الوصولات:</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                    {receiptsList.map((rec) => (
                      <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "6px 10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                        <span>شهر: <strong>{rec.month}</strong></span>
                        {rec.status === "confirmed" ? (
                          <span className="badge badge-success">تم التأكيد ✓</span>
                        ) : (
                          <span className="badge badge-warning">معلق ⏳</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Group Schedule Section */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <BookOpen size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>جدول مواعيد مجموعتك</h3>
              </div>

              {scheduleList.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  لم يتم إضافة جدول لهذه المجموعة حتى الآن من قِبل الإدارة.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {scheduleList.map((item) => (
                    <div 
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px"
                      }}
                    >
                      <div>
                        <strong style={{ color: "#fff", display: "block" }}>{item.day} — {item.subject}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          من {item.time_from} إلى {item.time_to}
                        </span>
                      </div>
                      <span className="badge badge-blue">مجموعة مسجلة</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Detailed Attendance Dates Table */}
        <div className="glass-panel" style={{ marginTop: "2rem", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Calendar size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>سجل تواريخ الحضور المفصل</h3>
          </div>

          {attendanceList.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              لا يوجد سجل حضور مسجل لك حتى الآن. سيظهر هنا بمجرد أن يسجل الأسستنت حضورك.
            </p>
          ) : (
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px" }}>#</th>
                    <th style={{ padding: "10px" }}>تاريخ الحضور</th>
                    <th style={{ padding: "10px" }}>وقت التسجيل</th>
                    <th style={{ padding: "10px" }}>الأسستنت المسؤول</th>
                    <th style={{ padding: "10px" }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((att, idx) => (
                    <tr key={att.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 10px" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 10px", fontWeight: "700", color: "#fff" }}>{att.date}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-muted)" }}>
                        {new Date(att.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 10px" }}>{att.assistant?.name || "الأسستنت"}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span className="badge badge-success">حاضر ✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
