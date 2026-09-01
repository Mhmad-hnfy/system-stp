"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { 
  QrCode, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  Sparkles,
  Users,
  Compass,
  Cpu
} from "lucide-react";

export default function Home() {
  const { currentUser } = useStore();
  const router = useRouter();

  // If user is already logged in, show direct dashboard link
  const getDashboardLink = () => {
    if (!currentUser) return "/login";
    if (currentUser.role === "admin") return "/admin";
    if (currentUser.role === "assistant") return "/assistant";
    return "/student";
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Background Floating Engineering Icons */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {/* Big Rotating Gears */}
        <div 
          className="gear-spin-cw" 
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "450px",
            height: "450px",
            opacity: 0.08,
            border: "18px dashed #3b82f6",
            borderRadius: "50%",
          }}
        />
        <div 
          className="gear-spin-ccw" 
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "550px",
            height: "550px",
            opacity: 0.06,
            border: "22px dotted #f59e0b",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Navbar */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        padding: "1rem clamp(1rem, 3vw, 2.5rem)",
        borderBottom: "1px solid var(--border-color)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(10, 15, 29, 0.8)",
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
            boxShadow: "0 0 15px rgba(245, 158, 11, 0.4)",
            flexShrink: 0
          }}>
            <Image 
              src="/logo.jpg" 
              alt="الباشميكانيكي" 
              fill 
              sizes="42px"
              style={{ objectFit: "cover" }} 
            />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", fontWeight: "900", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
              الباشميكانيكي
              <span style={{ fontSize: "0.7rem", background: "rgba(245,158,11,0.2)", color: "var(--accent-gold)", padding: "2px 8px", borderRadius: "10px" }}>
                سنتر تعليمي
              </span>
            </h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              مُعلم رياضيات وفيزياء .. ومهندس ميكانيكا
            </p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {currentUser ? (
            <Link href={getDashboardLink()} className="btn-gold" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}>
              <span>لوحة التحكم ({currentUser.name.split(" ")[0]})</span>
              <ArrowLeft size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-outline" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}>
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}>
                طالب جديد
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(2rem, 5vw, 4rem) 1rem",
        textAlign: "center",
        position: "relative",
        zIndex: 10
      }}>
        {/* Centered Hero Card with Animated Avatar */}
        <div style={{ position: "relative", marginBottom: "1.75rem" }}>
          {/* Animated Orbit Gears */}
          <div 
            className="gear-spin-cw hero-gears-outer" 
            style={{
              position: "absolute",
              top: "-20px",
              left: "-20px",
              right: "-20px",
              bottom: "-20px",
              border: "3px dashed rgba(59, 130, 246, 0.4)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}
          />
          <div 
            className="gear-spin-ccw hero-gears-outer" 
            style={{
              position: "absolute",
              top: "-35px",
              left: "-35px",
              right: "-35px",
              bottom: "-35px",
              border: "2px dotted rgba(245, 158, 11, 0.35)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}
          />

          {/* Logo Frame */}
          <div 
            className="floating-hero hero-logo-container"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              border: "4px solid #f59e0b",
              boxShadow: "0 0 40px rgba(245, 158, 11, 0.45), 0 0 80px rgba(59, 130, 246, 0.3)",
              background: "#111827"
            }}
          >
            <Image 
              src="/logo.jpg" 
              alt="الباشميكانيكي" 
              fill 
              priority
              sizes="(max-width: 480px) 150px, 200px"
              style={{ objectFit: "cover" }} 
            />
          </div>
        </div>

        {/* Hero Titles */}
        <div style={{ maxWidth: "750px", margin: "0 auto", width: "100%" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "rgba(59, 130, 246, 0.12)", 
            border: "1px solid rgba(59, 130, 246, 0.3)", 
            padding: "6px 14px", 
            borderRadius: "20px",
            marginBottom: "1rem"
          }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: "0.82rem", color: "#93c5fd", fontWeight: "700" }}>
              المنظومة الذكية لإدارة السنتر والطلاب
            </span>
          </div>

          <h2 style={{ 
            fontSize: "clamp(1.75rem, 4.5vw, 3rem)", 
            fontWeight: "900", 
            lineHeight: "1.3",
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 70%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            منصة "الباشميكانيكي" التعليمية
          </h2>

          <p style={{ 
            fontSize: "clamp(0.95rem, 2vw, 1.2rem)", 
            color: "var(--text-muted)", 
            lineHeight: "1.7",
            marginBottom: "2rem"
          }}>
            نظام متكامل للحضور الذكي بالـ QR Code، متابعة اشتراكات الشهور والوصولات، 
            وجداول الحصص والمجموعات لحظة بلحظة لكل من الطالب، الأسستنت، والإدارة.
          </p>

          {/* Action CTAs */}
          <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
            <Link href="/login" className="btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}>
              <Zap size={18} />
              <span>دخول النظام</span>
            </Link>
            <Link href="/register" className="btn-gold" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}>
              <Users size={18} />
              <span>تسجيل طالب جديد</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          marginTop: "4.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          width: "100%",
          maxWidth: "1100px"
        }}>
          {/* Card 1 */}
          <div className="glass-panel" style={{ padding: "1.75rem", textAlign: "right", position: "relative" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
              marginBottom: "1rem"
            }}>
              <QrCode size={26} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              حضور فوري بالـ QR
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              كود QR مشفر لكل طالب يتيح للأسستنت أخذ الحضور بثوانٍ عبر كاميرا الموبايل دون تأخير.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ padding: "1.75rem", textAlign: "right" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fbbf24",
              marginBottom: "1rem"
            }}>
              <CreditCard size={26} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              رفع وصولات الدفع
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              رفع صورة إيصال فودافون كاش أو الدفع مع تحديد الشهر، ومراجعة فورية من الإدارة وتأكيد بضغطة زر.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ padding: "1.75rem", textAlign: "right" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399",
              marginBottom: "1rem"
            }}>
              <Calendar size={26} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              جداول المجموعات
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              جدول منظم لكل مجموعة بالأيام، المادة، والساعات المحددة يعرض مباشرة في حساب الطالب.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel" style={{ padding: "1.75rem", textAlign: "right" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(168, 85, 247, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c084fc",
              marginBottom: "1rem"
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              لوحة تحكم الإدارة
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              تقارير مفصلة عن الحاضرين والغائبين، إحصائيات الطلاب، وإدارة المشرفين والاشتراكات.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-color)",
        padding: "1.5rem",
        textAlign: "center",
        fontSize: "0.85rem",
        color: "var(--text-muted)",
        background: "rgba(10, 15, 29, 0.9)",
        zIndex: 10
      }}>
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة سنتر الباشميكانيكي للرياضيات والفيزياء ⚙️</p>
      </footer>
    </main>
  );
}
