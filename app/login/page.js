"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Phone, Lock, LogIn, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;

    setLoading(true);
    const result = await login(phone, password);
    setLoading(false);

    if (result.success && result.user) {
      if (result.user.role === "admin") {
        router.push("/admin");
      } else if (result.user.role === "assistant") {
        router.push("/assistant");
      } else {
        router.push("/student");
      }
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
        className="gear-spin-cw" 
        style={{
          position: "fixed",
          top: "-80px",
          left: "-80px",
          width: "350px",
          height: "350px",
          opacity: 0.05,
          border: "15px dashed #3b82f6",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div className="glass-panel" style={{
        maxWidth: "440px",
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
          marginBottom: "1.5rem",
          transition: "color 0.2s"
        }}>
          <ArrowRight size={16} />
          العودة للرئيسية
        </Link>

        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            position: "relative",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 1rem",
            border: "3px solid var(--accent-gold)",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)"
          }}>
            <Image 
              src="/logo.jpg" 
              alt="الباشميكانيكي" 
              fill 
              sizes="80px"
              style={{ objectFit: "cover" }} 
            />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff" }}>
            تسجيل الدخول
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            منصة الباشميكانيكي التعليمية
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.5rem" }}>
              رقم الهاتف
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
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.5rem" }}>
              كلمة السر
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
            className="btn-primary" 
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem" }}
          >
            {loading ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>دخول إلى حسابي</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{
          marginTop: "2rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border-color)",
          textAlign: "center",
          fontSize: "0.9rem"
        }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            طالب جديد وليس لديك حساب؟
          </p>
          <Link href="/register" style={{ color: "var(--accent-gold)", fontWeight: "800", textDecoration: "none" }}>
            إنشاء حساب طالب جديد ⚡
          </Link>
        </div>
      </div>
    </div>
  );
}
