"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const StoreContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Show Toast
  const notify = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("elmik_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("elmik_user", JSON.stringify(data.user));
        notify(`أهلاً بك يا ${data.user.name} 👋`, "success");
        return { success: true, user: data.user };
      }
      notify(data.message || "فشل تسجيل الدخول", "error");
      return { success: false, message: data.message };
    } catch (err) {
      notify("حدث خطأ في الاتصال بالخادم", "error");
      return { success: false, message: "خطأ في الاتصال" };
    }
  };

  const register = async (name, phone, password, group_name) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, group_name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("elmik_user", JSON.stringify(data.user));
        notify("تم إنشاء حسابك بنجاح! 🎉", "success");
        return { success: true, user: data.user };
      }
      notify(data.message || "تعذر إنشاء الحساب", "error");
      return { success: false, message: data.message };
    } catch (err) {
      notify("حدث خطأ أثناء التسجيل", "error");
      return { success: false, message: "خطأ في الاتصال" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem("elmik_user");
    notify("تم تسجيل الخروج بنجاح", "info");
    // Redirect to home after logout
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  };

  const updateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("elmik_user", JSON.stringify(updatedUser));
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        updateCurrentUser,
        isLoading,
        login,
        register,
        logout,
        notify,
      }}
    >
      {children}
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              notification.type === "success"
                ? "linear-gradient(135deg, #059669, #10b981)"
                : notification.type === "error"
                ? "linear-gradient(135deg, #e11d48, #f43f5e)"
                : "linear-gradient(135deg, #1e293b, #334155)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "700",
            fontSize: "0.95rem",
            zIndex: 99999,
            border: "1px solid rgba(255,255,255,0.2)",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a GlobalProvider");
  }
  return context;
};
