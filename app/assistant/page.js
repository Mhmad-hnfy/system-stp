"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  LogOut, 
  Users, 
  Search, 
  RefreshCw,
  Sparkles,
  PhoneCall,
  Image as ImageIcon,
  SwitchCamera,
  HelpCircle
} from "lucide-react";

export default function AssistantDashboard() {
  const { currentUser, logout, notify, isLoading } = useStore();
  const router = useRouter();

  const [scannerActive, setScannerActive] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [camerasList, setCamerasList] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanProcessing, setScanProcessing] = useState(false);

  const html5QrCodeInstance = useRef(null);
  const captureInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Check auth
  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      window.location.href = "/login";
      return;
    }
    if (currentUser.role !== "assistant" && currentUser.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    fetchTodayData();
  }, [currentUser, isLoading]);

  // Fetch today's attendance & student list
  const fetchTodayData = async () => {
    try {
      setLoading(true);
      // 1. Today Attendance
      const attRes = await fetch(`/api/attendance/list?date=${todayStr}`);
      const attData = await attRes.json();
      if (attData.success) {
        setTodayAttendance(attData.attendance || []);
      }

      // 2. All Students (for manual search)
      const usersRes = await fetch(`/api/users?role=student`);
      const usersData = await usersRes.json();
      if (usersData.success) {
        setStudentsList(usersData.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit Attendance via Student ID
  const recordAttendance = async (studentId) => {
    if (!studentId) return;
    try {
      setScanProcessing(true);
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          assistant_id: currentUser.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setScannedResult({
          type: "success",
          message: data.message,
          student: data.student,
        });
        notify(data.message, "success");
        fetchTodayData();
      } else if (data.alreadyRecorded) {
        setScannedResult({
          type: "warning",
          message: data.message,
          student: data.student,
        });
        notify(data.message, "info");
      } else {
        setScannedResult({
          type: "error",
          message: data.message || "تعذر تسجيل الحضور",
        });
        notify(data.message || "خطأ", "error");
      }
    } catch (err) {
      console.error(err);
      notify("حدث خطأ أثناء الاتصال بالخادم", "error");
    } finally {
      setScanProcessing(false);
    }
  };

  // Initialize QR Live Video Scanner
  const startScanner = async (cameraIdOverride = null) => {
    // If browser does not support mediaDevices (e.g. mobile over HTTP), fallback to native camera immediately
    if (typeof window !== "undefined" && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      notify("جاري فتح كاميرا الموبايل لمسح الكود... 📸", "info");
      captureInputRef.current?.click();
      return;
    }

    setScannerActive(true);
    // Short timeout to guarantee container is in DOM and styled
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        
        // Stop any running instance before creating a new one
        if (html5QrCodeInstance.current) {
          try {
            if (html5QrCodeInstance.current.isScanning) {
              await html5QrCodeInstance.current.stop();
            }
          } catch (e) {}
        }

        const qrContainer = document.getElementById("qr-reader-container");
        if (!qrContainer) {
          setScannerActive(false);
          return;
        }

        html5QrCodeInstance.current = new Html5Qrcode("qr-reader-container");

        const qrCodeSuccessCallback = async (decodedText) => {
          await stopScanner();
          recordAttendance(decodedText.trim());
        };

        const config = {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.floor(minEdge * 0.75));
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        };

        // 1. Try to get available cameras
        let cameras = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setCamerasList(cameras);
          }
        } catch (e) {
          console.warn("Camera enumeration not allowed or failed", e);
        }

        const targetCamId = cameraIdOverride || selectedCameraId;

        if (targetCamId) {
          await html5QrCodeInstance.current.start(
            targetCamId,
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        } else if (cameras && cameras.length > 0) {
          // Select back camera or last available camera
          const backCam = cameras.find((c) => 
            /back|rear|environment|خلفي|0/i.test(c.label)
          ) || cameras[cameras.length - 1];

          setSelectedCameraId(backCam.id);
          await html5QrCodeInstance.current.start(
            backCam.id,
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        } else {
          // Fallback to facingMode constraint
          await html5QrCodeInstance.current.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        }
      } catch (err) {
        console.warn("Camera live streaming error, switching to native capture:", err);
        setScannerActive(false);
        
        notify("جاري فتح كاميرا الهاتف لالتقاط الكود... 📸", "info");
        captureInputRef.current?.click();
      }
    }, 100);
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeInstance.current) {
        if (html5QrCodeInstance.current.isScanning) {
          await html5QrCodeInstance.current.stop();
        }
        await html5QrCodeInstance.current.clear();
      }
    } catch (e) {
      console.warn(e);
    }
    setScannerActive(false);
  };

  // Switch camera if user selects from dropdown
  const handleCameraChange = async (newCamId) => {
    setSelectedCameraId(newCamId);
    if (scannerActive) {
      await stopScanner();
      startScanner(newCamId);
    }
  };

  // Scan from photo file / Native Mobile Camera capture
  const handleFileOrCaptureScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanProcessing(true);
      notify("جاري قراءة كود QR من الصورة...", "info");
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const fileScanner = new Html5Qrcode("qr-file-hidden-reader");
      const decodedText = await fileScanner.scanFile(file, true);
      
      try {
        await fileScanner.clear();
      } catch (e) {}

      if (decodedText) {
        recordAttendance(decodedText.trim());
      }
    } catch (err) {
      console.error("File scan failed:", err);
      notify("لم نتمكن من قراءة كود QR من هذه الصورة. تأكد من وضوح الكود وحاول مجدداً.", "error");
    } finally {
      setScanProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Filtered today attendance
  const filteredAttendance = todayAttendance.filter((item) => {
    const sName = item.student?.name || "";
    const sPhone = item.student?.phone || "";
    const sGroup = item.student?.group_name || "";
    const q = searchQuery.toLowerCase();
    return sName.toLowerCase().includes(q) || sPhone.includes(q) || sGroup.toLowerCase().includes(q);
  });

  if (isLoading || !currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <div className="gear-spin-cw" style={{ width: "50px", height: "50px", borderRadius: "50%", border: "4px dashed var(--accent-gold)" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>جاري تحميل لوحة المشرف...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hidden element for file scanning */}
      <div id="qr-file-hidden-reader" style={{ display: "none" }} />
      
      {/* Hidden Native Camera Capture Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={captureInputRef} 
        onChange={handleFileOrCaptureScan} 
        style={{ display: "none" }} 
      />

      {/* Hidden Gallery File Upload Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={uploadInputRef} 
        onChange={handleFileOrCaptureScan} 
        style={{ display: "none" }} 
      />

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
            <h2 style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)", fontWeight: "800", color: "#fff" }}>
              لوحة المشرف / الأسستنت
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--accent-gold)" }}>
              مرحباً {currentUser.name} ⚡
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

      {/* Main content */}
      <main style={{ flex: 1, padding: "clamp(1rem, 3vw, 1.5rem) clamp(0.75rem, 2.5vw, 1.25rem)", maxWidth: "900px", width: "100%", margin: "0 auto" }}>
        
        {/* Top Action Panel: QR Scanner & Options */}
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)"
            }}>
              <QrCode size={30} />
            </div>
          </div>

          <h3 style={{ fontSize: "clamp(1.15rem, 3vw, 1.35rem)", fontWeight: "900", marginBottom: "0.5rem" }}>
            تسجيل حضور الطالب بالـ QR
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            اختر الطريقة الأنسب لك لمسح كود الطالب وتسجيل حضوره فورياً:
          </p>

          {/* Live Scanner Container */}
          <div 
            id="qr-reader-container" 
            style={{ 
              width: "100%", 
              maxWidth: "340px", 
              margin: "0 auto 1.25rem",
              borderRadius: "16px",
              overflow: "hidden",
              border: scannerActive ? "2px solid var(--primary)" : "none",
              background: scannerActive ? "#000" : "transparent",
              minHeight: scannerActive ? "260px" : "0px",
              display: scannerActive ? "block" : "none"
            }} 
          />

          {/* Camera switcher if multiple cameras available and scanner active */}
          {scannerActive && camerasList.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <SwitchCamera size={18} color="var(--accent-gold)" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="input-field"
                style={{ width: "auto", maxWidth: "240px", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                {camerasList.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `كاميرا (${cam.id.slice(0, 5)}...)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Main Action Buttons Grid */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
            
            {/* Native Camera Capture Button (Works 100% on every phone, with or without HTTPS) */}
            <button 
              type="button"
              onClick={() => captureInputRef.current?.click()}
              className="btn-gold" 
              style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}
              disabled={scanProcessing}
            >
              <Camera size={20} />
              <span>التقاط صورة للكود (كاميرا الموبايل 📸)</span>
            </button>

            {/* Live Streaming Camera Toggle */}
            {!scannerActive ? (
              <button 
                type="button"
                onClick={() => startScanner()} 
                className="btn-primary" 
                style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}
                disabled={scanProcessing}
              >
                <QrCode size={20} />
                <span>فتح الماسح المباشر (Live Video)</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={stopScanner} 
                className="btn-danger" 
                style={{ padding: "0.8rem 1.6rem" }}
              >
                إيقاف الماسح المباشر ✕
              </button>
            )}

            {/* Gallery Upload Fallback */}
            <button 
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="btn-outline" 
              style={{ padding: "0.75rem 1.2rem", fontSize: "0.9rem" }}
              disabled={scanProcessing}
            >
              <ImageIcon size={18} />
              <span>اختيار صورة من المعرض 🖼️</span>
            </button>
          </div>

          {/* Manual Search Fallback */}
          <div style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>أو اختر الطالب يدوياً من القائمة:</span>
            <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "480px", flexWrap: "wrap" }}>
              <select
                className="input-field"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                style={{ flex: "1 1 200px", fontSize: "0.9rem" }}
              >
                <option value="">-- اختر اسم الطالب لتسجيل حضوره --</option>
                {studentsList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.phone}) {st.group_name ? `- [${st.group_name}]` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => manualInput && recordAttendance(manualInput)}
                className="btn-gold"
                disabled={!manualInput || scanProcessing}
                style={{ padding: "0.6rem 1.4rem", whiteSpace: "nowrap", flex: "1 1 auto" }}
              >
                تسجيل ✓
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result Modal / Banner */}
        {scannedResult && (
          <div 
            className="glass-panel" 
            style={{
              padding: "1.25rem",
              marginBottom: "1.5rem",
              border: `2px solid ${
                scannedResult.type === "success" 
                  ? "#10b981" 
                  : scannedResult.type === "warning" 
                  ? "#f59e0b" 
                  : "#f43f5e"
              }`,
              background: "rgba(17, 26, 46, 0.95)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {scannedResult.type === "success" ? (
                  <CheckCircle2 size={32} color="#10b981" />
                ) : (
                  <AlertCircle size={32} color="#f59e0b" />
                )}
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#fff" }}>
                    {scannedResult.message}
                  </h4>
                  {scannedResult.student && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      الطالب: <strong style={{ color: "#93c5fd" }}>{scannedResult.student.name}</strong> | 
                      المجموعة: <strong style={{ color: "#fbbf24" }}>{scannedResult.student.group_name || "بدون"}</strong> | 
                      الهاتف: <span dir="ltr">{scannedResult.student.phone}</span>
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setScannedResult(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Today's Attendance List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={20} color="var(--primary)" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>
                قائمة حضور اليوم ({todayStr})
              </h3>
              <span className="badge badge-blue">{todayAttendance.length} طالب</span>
            </div>

            <button onClick={fetchTodayData} className="btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
              <RefreshCw size={14} />
              <span>تحديث</span>
            </button>
          </div>

          {/* Search box */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو رقم الهاتف أو المجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingRight: "40px", fontSize: "0.9rem" }}
            />
            <Search size={18} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>

          {filteredAttendance.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
              لم يتم تسجيل أي حضور حتى الآن اليوم.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAttendance.map((item, idx) => (
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
                    <strong style={{ color: "#fff", display: "block", fontSize: "0.95rem" }}>
                      {idx + 1}. {item.student?.name}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      المجموعة: <span style={{ color: "#fbbf24" }}>{item.student?.group_name || "بدون"}</span> • 
                      الهاتف: <span dir="ltr">{item.student?.phone}</span>
                    </span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                      {new Date(item.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
