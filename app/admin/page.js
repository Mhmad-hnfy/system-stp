"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  BookOpen, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  Eye, 
  Search, 
  Filter, 
  LogOut, 
  Sparkles,
  TrendingUp,
  Clock,
  Check,
  X,
  ExternalLink,
  Shield,
  UserPlus,
  Layers,
  Edit3,
  UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const { currentUser, logout, notify, isLoading } = useStore();
  const router = useRouter();

  // Active Tab: 'overview' | 'groups' | 'students' | 'attendance' | 'payments' | 'schedules'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [groupsList, setGroupsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [receiptsList, setReceiptsList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form states
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: "", notes: "" });
  const [editingGroup, setEditingGroup] = useState(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", phone: "", password: "", role: "student", group_name: "" });
  
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState({ group_name: "", day: "السبت", subject: "رياضيات", time_from: "10:00", time_to: "12:00" });

  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("");
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all");

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      window.location.href = "/login";
      return;
    }
    if (currentUser.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    fetchAllData();
  }, [currentUser, isLoading]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, usersRes, attRes, payRes, schRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/users"),
        fetch("/api/attendance/list"),
        fetch("/api/payments"),
        fetch("/api/schedule"),
      ]);

      const [gData, uData, aData, pData, sData] = await Promise.all([
        groupsRes.json(),
        usersRes.json(),
        attRes.json(),
        payRes.json(),
        schRes.json(),
      ]);

      if (gData.success) setGroupsList(gData.groups || []);
      if (uData.success) setUsersList(uData.users || []);
      if (aData.success) setAttendanceList(aData.attendance || []);
      if (pData.success) setReceiptsList(pData.receipts || []);
      if (sData.success) setSchedulesList(sData.schedule || []);
    } catch (e) {
      console.error(e);
      notify("حدث خطأ في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- GROUPS ACTIONS ---
  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupData.name.trim()) {
      notify("يرجى كتابة اسم المجموعة", "error");
      return;
    }
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroupData),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || "تم إنشاء المجموعة بنجاح ✓", "success");
        setShowAddGroupModal(false);
        setNewGroupData({ name: "", notes: "" });
        fetchAllData();
      } else {
        notify(data.message || "فشل إنشاء المجموعة", "error");
      }
    } catch (err) {
      notify("خطأ في الاتصال", "error");
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.name.trim()) return;
    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingGroup),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || "تم تعديل المجموعة بنجاح ✓", "success");
        setEditingGroup(null);
        fetchAllData();
      } else {
        notify(data.message || "فشل تعديل المجموعة", "error");
      }
    } catch (err) {
      notify("خطأ في الاتصال", "error");
    }
  };

  const handleDeleteGroup = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${name}"؟ سيتم فك ارتباط طلابها وحذف مواعيد جدولها.`)) return;
    try {
      const res = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || "تم حذف المجموعة بنجاح", "info");
        fetchAllData();
      } else {
        notify(data.message || "فشل حذف المجموعة", "error");
      }
    } catch (err) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Quick Student Group Change
  const handleUpdateStudentGroup = async (studentId, groupName) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: studentId,
          group_name: groupName || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("تم تحديث مجموعة الطالب ✓", "success");
        fetchAllData();
      } else {
        notify(data.message || "فشل التحديث", "error");
      }
    } catch (err) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Add User (Student or Assistant)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (data.success) {
        notify(`تمت إضافة ${newUserData.name} بنجاح ✓`, "success");
        setShowAddUserModal(false);
        setNewUserData({ name: "", phone: "", password: "", role: "student", group_name: "" });
        fetchAllData();
      } else {
        notify(data.message || "فشل إضافة المستخدم", "error");
      }
    } catch (err) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Delete User
  const handleDeleteUser = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب "${name}" نهائياً؟`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || `تم حذف ${name} بنجاح`, "info");
        fetchAllData();
      } else {
        notify(data.message || "فشل الحذف", "error");
      }
    } catch (e) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Confirm Payment Receipt
  const handleConfirmPayment = async (receiptId) => {
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_id: receiptId,
          admin_id: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("تم تأكيد دفع الوصل بنجاح ✓", "success");
        fetchAllData();
        if (previewReceipt?.id === receiptId) {
          setPreviewReceipt(null);
        }
      } else {
        notify(data.message || "فشل تأكيد الدفع", "error");
      }
    } catch (e) {
      notify("خطأ أثناء التأكيد", "error");
    }
  };

  // Delete Payment Receipt
  const handleDeleteReceipt = async (receiptId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإيصال؟")) return;
    try {
      const res = await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: receiptId }),
      });
      const data = await res.json();
      if (data.success) {
        notify("تم حذف الإيصال بنجاح ✓", "info");
        if (previewReceipt?.id === receiptId) setPreviewReceipt(null);
        fetchAllData();
      } else {
        notify(data.message || "فشل حذف الإيصال", "error");
      }
    } catch (e) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Add Schedule Entry
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newScheduleData,
          created_by: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("تمت إضافة الحصة إلى جدول المجموعة ✓", "success");
        setShowAddScheduleModal(false);
        fetchAllData();
      } else {
        notify(data.message || "فشل إضافة الجدول", "error");
      }
    } catch (e) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Delete Schedule Entry
  const handleDeleteSchedule = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة من الجدول؟")) return;
    try {
      const res = await fetch("/api/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        notify("تم الحذف بنجاح ✓", "info");
        fetchAllData();
      } else {
        notify(data.message || "فشل الحذف", "error");
      }
    } catch (e) {
      notify("خطأ في الاتصال", "error");
    }
  };

  // Computed stats
  const studentsOnly = usersList.filter((u) => u.role === "student");
  const assistantsOnly = usersList.filter((u) => u.role === "assistant");
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayAttendees = attendanceList.filter((a) => a.date === todayDateStr);
  const pendingReceipts = receiptsList.filter((r) => r.status === "pending");

  // Filtered students
  const filteredStudents = studentsOnly.filter((st) => {
    const matchQuery = st.name.toLowerCase().includes(studentSearch.toLowerCase()) || st.phone.includes(studentSearch);
    const matchGroup = selectedGroupFilter ? st.group_name === selectedGroupFilter : true;
    return matchQuery && matchGroup;
  });

  // Filtered attendance for selected date
  const filteredAttendanceByDate = attendanceList.filter((a) => a.date === attendanceDateFilter);
  const attendedStudentIds = new Set(filteredAttendanceByDate.map((a) => a.student?.id));
  
  // Absent students for that date
  const absentStudents = studentsOnly.filter((s) => !attendedStudentIds.has(s.id));

  // Filtered receipts
  const filteredReceipts = receiptsList.filter((r) => {
    if (paymentsStatusFilter === "pending") return r.status === "pending";
    if (paymentsStatusFilter === "confirmed") return r.status === "confirmed";
    return true;
  });

  if (isLoading || !currentUser || currentUser.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <div className="gear-spin-cw" style={{ width: "50px", height: "50px", borderRadius: "50%", border: "4px dashed var(--accent-gold)" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>جاري تحميل لوحة التحكم والتحقق من الصلاحيات...</p>
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
        background: "rgba(17, 26, 46, 0.9)",
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
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--accent-gold)",
            flexShrink: 0
          }}>
            <Image src="/logo.jpg" alt="الباشميكانيكي" fill sizes="42px" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", fontWeight: "900", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
              لوحة الإدارة الرئيسية
              <span className="badge badge-warning" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>SQL Database</span>
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              السنتر التعليمي للبشمهندس
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

      {/* Main Tabs Navigation */}
      <div style={{
        background: "rgba(10, 15, 29, 0.85)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.5rem clamp(0.75rem, 2vw, 1.5rem)",
      }}>
        <div className="tabs-scroll-container">
          {[
            { id: "overview", label: "نظرة عامة", icon: TrendingUp },
            { id: "groups", label: `المجموعات والجروبات (${groupsList.length})`, icon: Layers },
            { id: "students", label: `الطلاب والمشرفين (${usersList.length})`, icon: Users },
            { id: "attendance", label: "الحضور والغياب", icon: CalendarCheck },
            { id: "payments", label: `وصولات الدفع (${pendingReceipts.length} معلق)`, icon: CreditCard },
            { id: "schedules", label: "جداول المجموعات", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? "rgba(59, 130, 246, 0.2)" : "transparent",
                  border: `1px solid ${isActive ? "var(--primary)" : "transparent"}`,
                  color: isActive ? "#93c5fd" : "var(--text-muted)",
                  padding: "0.55rem 1.1rem",
                  borderRadius: "10px",
                  fontWeight: isActive ? "800" : "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "clamp(1rem, 3vw, 2rem) clamp(0.75rem, 2.5vw, 1.5rem)", maxWidth: "1350px", width: "100%", margin: "0 auto" }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Stat Cards Grid */}
            <div className="stat-grid">
              <div className="glass-card" style={{ borderRight: "4px solid #a855f7" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>المجموعات المنشأة</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#c084fc", marginTop: "0.5rem" }}>
                  {groupsList.length} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>مجموعة</span>
                </div>
              </div>

              <div className="glass-card" style={{ borderRight: "4px solid #3b82f6" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>إجمالي الطلاب المسجلين</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#fff", marginTop: "0.5rem" }}>
                  {studentsOnly.length} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>طالب</span>
                </div>
              </div>

              <div className="glass-card" style={{ borderRight: "4px solid #10b981" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>حضور اليوم ({todayDateStr})</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#34d399", marginTop: "0.5rem" }}>
                  {todayAttendees.length} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>حاضر</span>
                </div>
              </div>

              <div className="glass-card" style={{ borderRight: "4px solid #f59e0b" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>وصولات دفع معلقة المراجعة</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#fbbf24", marginTop: "0.5rem" }}>
                  {pendingReceipts.length} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>وصل</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {/* Quick Actions Panel */}
              <div className="glass-panel" style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="var(--accent-gold)" />
                  إجراءات سريعة
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button onClick={() => setShowAddGroupModal(true)} className="btn-gold" style={{ justifyContent: "flex-start" }}>
                    <Layers size={18} />
                    <span>إنشاء مجموعة جديدة (جروب)</span>
                  </button>
                  <button onClick={() => setShowAddUserModal(true)} className="btn-primary" style={{ justifyContent: "flex-start" }}>
                    <UserPlus size={18} />
                    <span>إضافة طالب أو أسستنت جديد</span>
                  </button>
                  <button onClick={() => setShowAddScheduleModal(true)} className="btn-outline" style={{ justifyContent: "flex-start" }}>
                    <PlusCircle size={18} />
                    <span>إضافة ميعاد حصة لجدول مجموعة</span>
                  </button>
                  <button onClick={() => setActiveTab("payments")} className="btn-outline" style={{ justifyContent: "flex-start" }}>
                    <CreditCard size={18} />
                    <span>مراجعة وتأكيد وصولات الدفع ({pendingReceipts.length})</span>
                  </button>
                </div>
              </div>

              {/* Pending Receipts Alert Box */}
              <div className="glass-panel" style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "1rem" }}>
                  آخر وصولات الدفع المعلقة ⏳
                </h3>
                {pendingReceipts.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>لا توجد وصولات معلقة حالياً ✓</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {pendingReceipts.slice(0, 4).map((rec) => (
                      <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                        <div>
                          <strong style={{ color: "#fff" }}>{rec.student?.name}</strong>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>شهر: {rec.month}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => setPreviewReceipt(rec)} className="btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                            <Eye size={14} /> معاينة
                          </button>
                          <button onClick={() => handleConfirmPayment(rec.id)} className="btn-success" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                            تأكيد ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUPS MANAGEMENT (المجموعات) */}
        {activeTab === "groups" && (
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={22} color="var(--accent-gold)" />
                  إدارة المجموعات (الجروبات)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  إنشاء وتعديل المجموعات وتوزيع الطلاب وجداول الحصص عليها
                </p>
              </div>

              <button onClick={() => setShowAddGroupModal(true)} className="btn-gold" style={{ padding: "0.6rem 1.4rem" }}>
                <PlusCircle size={18} />
                <span>إضافة مجموعة جديدة +</span>
              </button>
            </div>

            {/* Groups Grid */}
            {groupsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>لا توجد أي مجموعات منشأة حتى الآن.</p>
                <button onClick={() => setShowAddGroupModal(true)} className="btn-gold">
                  أنشئ أول مجموعة الآن
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {groupsList.map((group) => {
                  const groupStudents = studentsOnly.filter(
                    (s) => s.group_id === group.id || s.group_name === group.name
                  );
                  const groupSchedules = schedulesList.filter((s) => s.group_name === group.name);

                  return (
                    <div 
                      key={group.id} 
                      className="glass-card" 
                      style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        borderTop: "3px solid var(--accent-gold)",
                        position: "relative"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#fff" }}>
                            {group.name}
                          </h4>
                          {group.notes && (
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "3px" }}>
                              {group.notes}
                            </p>
                          )}
                        </div>
                        <span className="badge badge-blue" style={{ fontSize: "0.8rem", fontWeight: "700" }}>
                          {groupStudents.length} طالب
                        </span>
                      </div>

                      {/* Schedule preview for group */}
                      {groupSchedules.length > 0 && (
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: "8px", fontSize: "0.75rem", color: "#93c5fd" }}>
                          📅 {groupSchedules.map((sch) => `${sch.day} (${sch.time_from})`).join(" • ")}
                        </div>
                      )}

                      {/* Students List in Group */}
                      <div style={{ marginTop: "4px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          الطلاب في هذه المجموعة:
                        </span>
                        {groupStudents.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            لا يوجد طلاب في هذه المجموعة بعد
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto" }}>
                            {groupStudents.map((st) => (
                              <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", fontSize: "0.8rem" }}>
                                <span>{st.name}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }} dir="ltr">{st.phone}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button
                          onClick={() => setEditingGroup(group)}
                          className="btn-outline"
                          style={{ flex: 1, padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                        >
                          <Edit3 size={14} />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="btn-danger"
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENTS & USERS */}
        {activeTab === "students" && (
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900" }}>إدارة الطلاب والمشرفين</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>عرض وتعديل وإضافة وتوزيع الطلاب على المجموعات</p>
              </div>

              <button onClick={() => setShowAddUserModal(true)} className="btn-gold" style={{ padding: "0.6rem 1.4rem" }}>
                <UserPlus size={18} />
                <span>إضافة حساب جديد</span>
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم الهاتف..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-field"
                  style={{ paddingRight: "38px" }}
                />
                <Search size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>

              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="input-field"
                style={{ width: "auto", minWidth: "200px" }}
              >
                <option value="">جميع المجموعات ({studentsOnly.length})</option>
                {groupsList.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px" }}>الاسم</th>
                    <th style={{ padding: "10px" }}>الدور</th>
                    <th style={{ padding: "10px" }}>المجموعة الحالية</th>
                    <th style={{ padding: "10px" }}>تغيير المجموعة</th>
                    <th style={{ padding: "10px" }}>رقم الهاتف</th>
                    <th style={{ padding: "10px" }}>تاريخ التسجيل</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => (
                    <tr key={st.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 10px", fontWeight: "700", color: "#fff" }}>{st.name}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span className="badge badge-blue">طالب</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {st.group_name ? (
                          <span style={{ color: "var(--accent-gold)", fontWeight: "600" }}>{st.group_name}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>- بدون مجموعة -</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <select
                          value={st.group_name || ""}
                          onChange={(e) => handleUpdateStudentGroup(st.id, e.target.value)}
                          className="input-field"
                          style={{ padding: "4px 8px", fontSize: "0.8rem", width: "auto", minWidth: "150px" }}
                        >
                          <option value="">-- بدون مجموعة --</option>
                          {groupsList.map((g) => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "12px 10px" }} dir="ltr">{st.phone}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(st.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteUser(st.id, st.name)}
                          className="btn-danger"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assistants Section */}
            {assistantsOnly.length > 0 && (
              <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem", color: "var(--accent-gold)" }}>
                  قائمة المشرفين / الأسستنت ({assistantsOnly.length})
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
                  {assistantsOnly.map((as) => (
                    <div key={as.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <div>
                        <strong style={{ color: "#fff", display: "block" }}>{as.name}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }} dir="ltr">{as.phone}</span>
                      </div>
                      <button onClick={() => handleDeleteUser(as.id, as.name)} className="btn-danger" style={{ padding: "4px 8px" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ATTENDANCE & ABSENCE */}
        {activeTab === "attendance" && (
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900" }}>تقارير الحضور والغياب</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  معرفة من حضر ومن غاب في أي تاريخ
                </p>
              </div>

              {/* Date Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>التاريخ:</label>
                <input
                  type="date"
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  className="input-field"
                  style={{ width: "auto", fontSize: "0.9rem" }}
                />
              </div>
            </div>

            {/* Attendance Status Summary for chosen date */}
            <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="glass-card" style={{ borderRight: "4px solid #10b981" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>عدد الحاضرين في {attendanceDateFilter}</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#34d399" }}>
                  {filteredAttendanceByDate.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>طالب</span>
                </div>
              </div>
              <div className="glass-card" style={{ borderRight: "4px solid #f43f5e" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>عدد الغائبين في {attendanceDateFilter}</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#fb7185" }}>
                  {absentStudents.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>طالب</span>
                </div>
              </div>
            </div>

            {/* 2 Sub-tables: Present vs Absent */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {/* Present List */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#34d399", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={18} /> قائمة الحاضرين ({filteredAttendanceByDate.length})
                </h4>
                {filteredAttendanceByDate.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>لا يوجد حضور مسجل في هذا التاريخ.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {filteredAttendanceByDate.map((item, idx) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                        <div>
                          <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{idx + 1}. {item.student?.name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{item.student?.group_name || "بدون مجموعة"}</span>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                          {new Date(item.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Absent List */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(244,63,94,0.2)" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#fb7185", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <X size={18} /> قائمة الغائبين ({absentStudents.length})
                </h4>
                {absentStudents.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>الجميع حاضرون في هذا اليوم! 👏</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "400px", overflowY: "auto" }}>
                    {absentStudents.map((st, idx) => (
                      <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                        <div>
                          <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{idx + 1}. {st.name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{st.group_name || "بدون مجموعة"}</span>
                        </div>
                        <a href={`tel:${st.phone}`} className="btn-outline" style={{ padding: "3px 8px", fontSize: "0.75rem" }}>
                          اتصال 📞
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT RECEIPTS */}
        {activeTab === "payments" && (
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900" }}>وصولات واشتراكات الشهور</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  مراجعة صور إيصالات الدفع وتأكيدها لتصل إلى حساب الطالب والأسستنت
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "pending", "confirmed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentsStatusFilter(st)}
                    style={{
                      background: paymentsStatusFilter === st ? "var(--primary)" : "rgba(255,255,255,0.05)",
                      color: "#fff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontWeight: "700"
                    }}
                  >
                    {st === "all" ? "الكل" : st === "pending" ? "المعلقة ⏳" : "المؤكدة ✓"}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipts Grid */}
            {filteredReceipts.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                لا توجد وصولات تطابق الفلتر الحالي.
              </p>
            ) : (
              <div className="grid-auto-fit">
                {filteredReceipts.map((rec) => (
                  <div key={rec.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ color: "#fff", fontSize: "1rem", display: "block" }}>{rec.student?.name}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          المجموعة: {rec.student?.group_name || "بدون"} | هاتف: {rec.student?.phone}
                        </span>
                      </div>
                      {rec.status === "confirmed" ? (
                        <span className="badge badge-success">مدفوع ومؤكد ✓</span>
                      ) : (
                        <span className="badge badge-warning">قيد المراجعة ⏳</span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#93c5fd" }}>
                      وصل شهر: <strong>{rec.month}</strong>
                    </div>

                    {/* Receipt Image Thumbnail */}
                    <div 
                      onClick={() => setPreviewReceipt(rec)}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "140px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        background: "#000"
                      }}
                    >
                      <img 
                        src={rec.image_url} 
                        alt="إيصال الدفع" 
                        style={{ width: "100%", height: "140px", objectFit: "cover" }} 
                      />
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: "700"
                      }}>
                        <Eye size={16} /> اضغط لتكبير الصورة
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                      {rec.status === "pending" && (
                        <button
                          onClick={() => handleConfirmPayment(rec.id)}
                          className="btn-success"
                          style={{ flex: 1, padding: "0.5rem" }}
                        >
                          تأكيد الدفع (تم) ✓
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewReceipt(rec)}
                        className="btn-outline"
                        style={{ padding: "0.5rem" }}
                        title="معاينة"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReceipt(rec.id)}
                        className="btn-danger"
                        style={{ padding: "0.5rem" }}
                        title="حذف الإيصال"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: GROUP SCHEDULES */}
        {activeTab === "schedules" && (
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900" }}>جداول ومواعيد المجموعات</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  تحديد جدول كل مجموعة بالأيام والمواد والساعات ليظهر في حساب الطالب
                </p>
              </div>

              <button onClick={() => setShowAddScheduleModal(true)} className="btn-gold" style={{ padding: "0.6rem 1.4rem" }}>
                <PlusCircle size={18} />
                <span>إضافة موعد حصة جديد</span>
              </button>
            </div>

            {schedulesList.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                لم يتم تسجيل أي جداول بعد. اضغط على الزر بالأعلى لإضافة موعد جديد.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                {schedulesList.map((sch) => (
                  <div key={sch.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span className="badge badge-warning" style={{ marginBottom: "6px" }}>
                        {sch.group_name}
                      </span>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#fff" }}>
                        {sch.day} — {sch.subject}
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        من الساعة {sch.time_from} إلى {sch.time_to}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="btn-danger"
                      style={{ padding: "6px 10px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL 1: ADD GROUP */}
      {showAddGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>إنشاء مجموعة جديدة (جروب)</h3>
              <button onClick={() => setShowAddGroupModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleAddGroup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>اسم المجموعة:</label>
                <input
                  type="text"
                  placeholder="مثال: مجموعة أ - أولى ثانوي"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>ملاحظات / وصف المواعيد (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: السبت والثلاثاء الساعة 10 صباحاً"
                  value={newGroupData.notes}
                  onChange={(e) => setNewGroupData({ ...newGroupData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>
                  إنشاء المجموعة ✓
                </button>
                <button type="button" onClick={() => setShowAddGroupModal(false)} className="btn-outline">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GROUP */}
      {editingGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>تعديل بيانات المجموعة</h3>
              <button onClick={() => setEditingGroup(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleEditGroup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>اسم المجموعة:</label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>ملاحظات / وصف المواعيد:</label>
                <input
                  type="text"
                  value={editingGroup.notes || ""}
                  onChange={(e) => setEditingGroup({ ...editingGroup, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>
                  حفظ التعديلات ✓
                </button>
                <button type="button" onClick={() => setEditingGroup(null)} className="btn-outline">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD USER (Student or Assistant) */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>إضافة حساب جديد (طالب أو مشرف)</h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>نوع الحساب (Role):</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="student">طالب (Student)</option>
                  <option value="assistant">مشرف / أسستنت (Assistant)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>الاسم ثلاثي:</label>
                <input
                  type="text"
                  placeholder="محمد أحمد علي"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>رقم الهاتف:</label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              {newUserData.role === "student" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>المجموعة:</label>
                  <select
                    value={newUserData.group_name}
                    onChange={(e) => setNewUserData({ ...newUserData, group_name: e.target.value })}
                    className="input-field"
                  >
                    <option value="">-- بدون مجموعة --</option>
                    {groupsList.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>كلمة السر:</label>
                <input
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>
                  حفظ وإنشاء الحساب ✓
                </button>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-outline">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD SCHEDULE */}
      {showAddScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>إضافة ميعاد حصة لجدول مجموعة</h3>
              <button onClick={() => setShowAddScheduleModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleAddSchedule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>اسم المجموعة:</label>
                <select
                  value={newScheduleData.group_name}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, group_name: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- اختر المجموعة --</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>اليوم:</label>
                <select
                  value={newScheduleData.day}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, day: e.target.value })}
                  className="input-field"
                >
                  {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>المادة / موضوع الحصة:</label>
                <input
                  type="text"
                  placeholder="مثال: فيزياء — ميكانيكا وقوانين نيوتن"
                  value={newScheduleData.subject}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, subject: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>من الساعة:</label>
                  <input
                    type="time"
                    value={newScheduleData.time_from}
                    onChange={(e) => setNewScheduleData({ ...newScheduleData, time_from: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>إلى الساعة:</label>
                  <input
                    type="time"
                    value={newScheduleData.time_to}
                    onChange={(e) => setNewScheduleData({ ...newScheduleData, time_to: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>
                  إضافة للجدول ✓
                </button>
                <button type="button" onClick={() => setShowAddScheduleModal(false)} className="btn-outline">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECEIPT IMAGE PREVIEW */}
      {previewReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>
                  وصل دفع: {previewReceipt.student?.name}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)" }}>
                  شهر: {previewReceipt.month}
                </span>
              </div>
              <button onClick={() => setPreviewReceipt(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto", borderRadius: "10px", marginBottom: "1rem", border: "1px solid var(--border-color)" }}>
              <img 
                src={previewReceipt.image_url} 
                alt="Receipt Full Preview" 
                style={{ width: "100%", height: "auto", display: "block" }} 
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              {previewReceipt.status === "pending" && (
                <button
                  onClick={() => handleConfirmPayment(previewReceipt.id)}
                  className="btn-success"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
                >
                  تأكيد الدفع (تم) ✓
                </button>
              )}
              <button 
                onClick={() => handleDeleteReceipt(previewReceipt.id)} 
                className="btn-danger"
                style={{ padding: "0.75rem 1.25rem", fontSize: "0.95rem" }}
              >
                حذف الإيصال 🗑️
              </button>
              <button onClick={() => setPreviewReceipt(null)} className="btn-outline">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
