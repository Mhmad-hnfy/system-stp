"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { User, Phone, Lock, Users, ArrowRight, UserPlus, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupsList, setGroupsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useStore();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.groups) {
          setGroupsList(data.groups);
          if (data.groups.length > 0) {
            setGroupName(data.groups[0].name);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !password) return;

    setLoading(true);
    const result = await register(name, phone, password, groupName);
    setLoading(false);

    if (result.success && result.user) {
      router.push("/student");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(1rem, 3vw, 2rem)",
      position: "relative"
    }}>
      {/* Background Gears */}
      <div 
        className="gear-spin-ccw" 
        style={{
          position: "fixed",
          bottom: "-80px",
          right: "-80px",
          width: "350px",
          height: "350px",
          opacity: 0.05,
          border: "15px dashed #f59e0b",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div className="glass-panel" style={{
        maxWidth: "480px",
        width: "100%",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)",
        position: "relative",
        zIndex: 10
      }}>
        {/* Back Link */}
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: "0.85rem",
          marginBottom: "1.5rem"
        }}>
          <ArrowRight size={16} />
          العودة للرئيسية
        </Link>

        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            position: "relative",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 0.75rem",
            border: "3px solid var(--accent-gold)",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)"
          }}>
            <Image 
              src="/logo.jpg" 
              alt="الباشميكانيكي" 
              fill 
              sizes="70px"
              style={{ objectFit: "cover" }} 
            />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff" }}>
            تسجيل طالب جديد
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            انضم لمنظومة سنتر الباشميكانيكي
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.4rem" }}>
              اسم الطالب ثلاثي
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="أحمد محمد علي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
                style={{ paddingRight: "42px" }}
              />
              <User size={18} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.4rem" }}>
              رقم الهاتف (واتساب / اتصال)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="tel"
                dir="ltr"
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                required
                style={{ paddingRight: "42px", textAlign: "left" }}
              />
              <Phone size={18} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.4rem" }}>
              اختر المجموعة / الموعد
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input-field"
                style={{ paddingRight: "42px" }}
              >
                <option value="">-- بدون مجموعة / سأحدد لاحقاً --</option>
                {groupsList.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} {g.notes ? `(${g.notes})` : ""}
                  </option>
                ))}
              </select>
              <Users size={18} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
            {/* Quick selectors */}
            {groupsList.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {groupsList.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGroupName(g.name)}
                    style={{
                      background: groupName === g.name ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${groupName === g.name ? "var(--primary)" : "var(--border-color)"}`,
                      color: groupName === g.name ? "#93c5fd" : "var(--text-muted)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.4rem" }}>
              كلمة السر للحساب
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                style={{ paddingRight: "42px", textAlign: "left" }}
              />
              <Lock size={18} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-gold" 
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem" }}
          >
            {loading ? (
              <span>جاري إنشاء الحساب...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>تسجيل الحساب والدخول</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "1.75rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border-color)",
          textAlign: "center",
          fontSize: "0.9rem"
        }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "0.4rem" }}>
            لديك حساب بالفعل؟
          </p>
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: "800", textDecoration: "none" }}>
            تسجيل الدخول من هنا 🔑
          </Link>
        </div>
      </div>
    </div>
  );
}
