import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
      <div className="glass-panel" style={{ maxWidth: "450px", padding: "2.5rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "900", color: "var(--accent-gold)" }}>404</h1>
        <h2 style={{ fontSize: "1.25rem", margin: "1rem 0" }}>الصفحة غير موجودة</h2>
        <Link href="/" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
