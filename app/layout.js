import "./globals.css";
import { GlobalProvider } from "@/lib/store";

export const metadata = {
  title: " سيستم باشميكانيكي التعليمي | رياضيات وفيزياء",
  description: "نظام إدارة الحضور، الجداول، والدفعات للسنتر التعليمي",
  icons: {
    icon: "/logo.jpg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0f1d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
