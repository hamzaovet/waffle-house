"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStaff();
  const { lang, toggleLang, dir, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  function getRouteForRole(role?: string) {
    if (role === "owner" || role === "manager") return "/dashboard";
    if (role === "chef") return "/kitchen";
    if (role === "accountant") return "/reports";
    return "/cashier";
  }

  const isMaestroUser = username.trim().toLowerCase() === "maestro";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t("يرجى إدخال اسم المستخدم وكلمة المرور", "Please enter username and password"));
      return;
    }

    // If maestro username is entered and PIN not filled yet, prompt for PIN
    if (isMaestroUser && !pin.trim()) {
      setShowPinInput(true);
      setError(t("مطلوب إدخال رمز الأمان PIN المكون من 6 أرقام لتسجيل دخول المالك المعتمد (157230)", "PIN code required for Master Owner login"));
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(username.trim(), password, "username", pin.trim());
    setLoading(false);

    if (res.requirePin) {
      setShowPinInput(true);
      setError(res.error || t("يرجى إدخال رمز الأمان PIN المكون من 6 أرقام", "Please enter 6-digit security PIN"));
      return;
    }

    if (res.success && res.user) {
      playSound("success");
      router.push(getRouteForRole(res.user.role));
    } else {
      playSound("alert");
      setError(res.error || t("اسم المستخدم أو كلمة المرور غير صحيحة", "Invalid username or password"));
    }
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#3E0E00";
    e.target.style.boxShadow = "0 0 0 3px rgba(62,14,0,0.15)";
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#E8DAC8";
    e.target.style.boxShadow = "none";
  }

  return (
    <div
      dir={dir}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FAF7F2 0%, #F5EDE4 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        fontFamily: "var(--font-cairo), system-ui, -apple-system, Arial, sans-serif",
      }}
    >
      {/* Language Toggle Button */}
      <button
        type="button"
        onClick={() => {
          playSound("click");
          toggleLang();
        }}
        style={{
          position: "absolute",
          top: "20px",
          [dir === "rtl" ? "left" : "right"]: "24px",
          padding: "8px 16px",
          borderRadius: "100px",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid #E8DAC8",
          color: "#3E0E00",
          fontWeight: 800,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 8px rgba(62,14,0,0.06)",
        }}
        title={t("تغيير لغة لوحة التحكم", "Switch Language")}
      >
        <span>{lang === "ar" ? "English 🌐" : "عربي 🌐"}</span>
      </button>

      {/* ── Brand Waffle House ── */}
      <div style={{ textAlign: "center", marginBottom: "22px" }}>
        <div
          style={{
            width: "84px",
            height: "84px",
            margin: "0 auto 12px",
            borderRadius: "22px",
            overflow: "hidden",
            boxShadow: "0 10px 28px rgba(62,14,0,0.14)",
            border: "2px solid #E8DAC8",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/waffle-house-logo.jpg"
            alt="Waffle House Logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.jpg";
            }}
          />
        </div>
        <h1
          style={{
            fontSize: "27px",
            fontWeight: 900,
            color: "#3E0E00",
            margin: "0 0 6px 0",
            letterSpacing: "0.2px",
          }}
        >
          وافل هاوس • Waffle House 🧇🏠
        </h1>
        <p
          style={{
            fontSize: "13.5px",
            color: "#6E4532",
            margin: 0,
            fontWeight: 700,
          }}
        >
          {t("منظومة إدارة وتشغيل الفروع والمبيعات السحابية - فرع القاهرة", "Cloud ERP & Operations Platform - Cairo Branch")}
        </p>
      </div>

      {/* ── Login Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#FFFFFF",
          border: "1.5px solid #EADCCE",
          borderRadius: "24px",
          padding: "36px 32px 32px",
          boxShadow: "0 20px 50px rgba(62,14,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "#3E0E00",
            margin: "0 0 6px 0",
            textAlign: "center",
          }}
        >
          {t("تسجيل الدخول للنظام", "Log in to System")}
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "#7E5E49",
            margin: "0 0 24px 0",
            textAlign: "center",
          }}
        >
          {t("أدخل اسم المستخدم وكلمة المرور الخاصة بك", "Enter your username and password")}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Username */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 800,
                color: "#3E0E00",
                marginBottom: "7px",
              }}
            >
              {t("اسم المستخدم", "Username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (e.target.value.trim().toLowerCase() === "maestro") {
                  setShowPinInput(true);
                }
              }}
              placeholder={t("اسم المستخدم (مثال: maestro أو user)", "Username (e.g. maestro or user)")}
              autoComplete="username"
              autoFocus
              style={{
                width: "100%",
                height: "48px",
                background: "#FAF7F2",
                border: "1.5px solid #E8DAC8",
                borderRadius: "12px",
                padding: "0 16px",
                fontSize: "14px",
                color: "#3E0E00",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
                fontFamily: "var(--font-cairo), system-ui, sans-serif",
              }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 800,
                color: "#3E0E00",
                marginBottom: "7px",
              }}
            >
              {t("كلمة المرور", "Password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("كلمة المرور", "Password")}
                autoComplete="current-password"
                style={{
                  width: "100%",
                  height: "48px",
                  background: "#FAF7F2",
                  border: "1.5px solid #E8DAC8",
                  borderRadius: "12px",
                  padding: dir === "rtl" ? "0 44px 0 16px" : "0 16px 0 44px",
                  fontSize: "14px",
                  color: "#3E0E00",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  fontFamily: showPwd ? "monospace" : "inherit",
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute",
                  [dir === "rtl" ? "left" : "right"]: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  color: "#7E5E49",
                  padding: "4px",
                }}
                tabIndex={-1}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Security PIN Field (Mandatory for Maestro Owner) */}
          {(showPinInput || isMaestroUser) && (
            <div
              style={{
                background: "#FEF9F0",
                border: "1.5px dashed #D97706",
                borderRadius: "14px",
                padding: "14px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#92400E",
                  marginBottom: "7px",
                }}
              >
                <span>🔐 {t("رمز الأمان المشفر (PIN)", "Security PIN")}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#B45309" }}>
                  {t("إلزامي للمالك لمنع الثغرات", "Required for Owner")}
                </span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="•••••• (157230)"
                style={{
                  width: "100%",
                  height: "46px",
                  background: "#FFFFFF",
                  border: "1.5px solid #FCD34D",
                  borderRadius: "10px",
                  padding: "0 16px",
                  fontSize: "18px",
                  color: "#92400E",
                  outline: "none",
                  boxSizing: "border-box",
                  letterSpacing: "6px",
                  textAlign: "center",
                  fontWeight: 900,
                  fontFamily: "monospace",
                }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#DC2626",
                textAlign: "center",
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Submit button — luxury chocolate and caramel */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              background: "linear-gradient(135deg, #3E0E00 0%, #6E2208 100%)",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "15px",
              borderRadius: "100px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(62,14,0,0.25)",
              transition: "all 0.2s ease",
              marginTop: "4px",
              fontFamily: "var(--font-cairo), system-ui, sans-serif",
            }}
          >
            {loading ? t("جاري التحقق...", "Verifying...") : t("تسجيل الدخول", "Log In")}
          </button>
        </form>

        {/* Security Notice */}
        <p
          style={{
            fontSize: "12px",
            color: "#7E5E49",
            textAlign: "center",
            margin: "20px 0 0 0",
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          🔒 {t("بوابة دخول آمنة ومشفرة لطاقم العمل والإدارة فقط.", "Secure encrypted access portal for staff and management only.")}
        </p>

        {/* Orca Cloud Permanent Stamp */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #E8DAC8",
            textAlign: "center",
          }}
        >
          <a
            href="https://wa.me/201018671000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11.5px",
              color: "#7E5E49",
              textDecoration: "none",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
            }}
          >
            <span>تم تطوير النظام بواسطة شركة أوركا للحلول البرمجية والخدمات السحابية 01018671000 🐋</span>
          </a>
        </div>
      </div>
    </div>
  );
}
