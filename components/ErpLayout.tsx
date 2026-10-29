"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import {
  ChefHat, UtensilsCrossed, Package, CircleDollarSign,
  Users, Store, LogOut, Shield, Settings, Bell, Globe, UserCheck,
  Menu, X, MonitorSmartphone
} from "lucide-react";
import SettingsModal from "@/components/SettingsModal";

interface ErpLayoutProps {
  children: React.ReactNode;
  activeItem?: "orders" | "menu" | "inventory" | "reports" | "users" | "customers" | "captains" | "cashier";
}

export default function ErpLayout({ children, activeItem }: ErpLayoutProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { currentUser, logout, permissions } = useStaff();
  const { lang, toggleLang, dir, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    function handleResize() {
      setIsMobile(window.innerWidth <= 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine current active item from path if not explicitly provided
  const currentActive = activeItem || (
    pathname === "/dashboard" || pathname === "/kitchen" ? "orders" : pathname === "/cashier" ? "cashier"
    : pathname === "/menu-admin" || pathname === "/offers-admin" ? "menu"
    : pathname === "/inventory" ? "inventory"
    : pathname === "/reports" || pathname === "/expenses" ? "reports"
    : pathname === "/customers" ? "customers"
    : pathname === "/users" ? "users"
    : "orders"
  );

  const isOwner = currentUser?.role === "owner";
  const isManager = currentUser?.role === "manager";

  function handleTestSound() {
    playSound("order");
  }

  function handleLogout() {
    playSound("click");
    logout();
    router.push("/login");
  }

  return (
    <div dir={dir} style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1C0500 0%, #290802 35%, #4A0E06 70%, #150300 100%)",
      color: "#FFFFFF",
      display: "flex",
      fontFamily: "var(--font-cairo), system-ui, -apple-system, sans-serif",
    }}>

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR — Waffle House Operations Hub (Light Warm Ivory)
      ══════════════════════════════════════════════════════════ */}
      {/* Mobile Backdrop Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(43, 23, 14, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 998,
          }}
        />
      )}

      <aside style={{
        width: isMobile ? "270px" : "250px",
        maxWidth: "85vw",
        height: "100vh",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        bottom: 0,
        ...(isMobile ? (dir === "rtl" ? { right: 0 } : { left: 0 }) : {}),
        flexShrink: 0,
        backgroundColor: "#160401",
        borderLeft: dir === "rtl" ? "1px solid #3E1005" : "none",
        borderRight: dir === "ltr" ? "1px solid #3E1005" : "none",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        zIndex: isMobile ? 999 : 40,
        transform: isMobile
          ? mobileMenuOpen
            ? "translateX(0)"
            : dir === "rtl"
            ? "translateX(100%)"
            : "translateX(-100%)"
          : "none",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isMobile && mobileMenuOpen ? "0 0 35px rgba(43,23,14,0.18)" : "none",
      }}>
        {/* Top: Brand Header & Nav Links */}
        <div>
          {/* Logo & Brand + Mobile Close */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            padding: "0 6px",
          }}>
            <Link
              href="/"
              onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#FAF6EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
                border: "1.5px solid #C6873E",
                boxShadow: "0 2px 8px rgba(198, 135, 62, 0.2)",
              }}>
                <img src="/waffle-house-logo.jpg" alt="Waffle House" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{
                  fontSize: "16.5px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  lineHeight: 1.15,
                }}>
                  Waffle House
                </div>
                <div style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  color: "#C6873E",
                  marginTop: "2px",
                  letterSpacing: "0.8px",
                }}>
                  {t("لوحة التشغيل والإدارة", "Operations Hub")}
                </div>
              </div>
            </Link>

            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "rgba(198, 135, 62, 0.1)",
                  border: "none",
                  color: "#C6873E",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              {
                id: "cashier",
                href: "/cashier",
                label: t("ماكينة الكاشير (POS)", "POS / Counter Sale"),
                icon: MonitorSmartphone,
              },
              {
                id: "orders",
                href: "/dashboard",
                label: t("المطبخ والطلبات", "Kitchen & Orders"),
                icon: ChefHat,
              },
              {
                id: "menu",
                href: "/menu-admin",
                label: t("المنيو والأسعار", "Menu & Prices"),
                icon: UtensilsCrossed,
              },
              {
                id: "inventory",
                href: "/inventory",
                label: t("المخزن والتكاليف", "Inventory & Costs"),
                icon: Package,
              },
              {
                id: "reports",
                href: "/reports",
                label: t("الحسابات والأرباح", "Finances & Profits"),
                icon: CircleDollarSign,
              },
              {
                id: "customers",
                href: "/customers",
                label: t("قاعدة بيانات العملاء", "Customers CRM"),
                icon: UserCheck,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    playSound("click");
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "11px 14px",
                    borderRadius: "14px",
                    textDecoration: "none",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 900 : 700,
                    transition: "all 0.15s ease",
                    background: isActive ? "linear-gradient(135deg, #8B0000, #B91C1C)" : "transparent",
                    color: isActive ? "#FFFFFF" : "#F3D8C8",
                    boxShadow: isActive ? "0 4px 14px rgba(185, 28, 28, 0.45)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#F3D8C8";
                    }
                  }}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#FFFFFF" : "#C6873E"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Staff Management Button */}
          <Link
            href="/users"
            onClick={() => {
              playSound("click");
              if (isMobile) setMobileMenuOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: currentActive === "users" ? "linear-gradient(135deg, #8B0000, #B91C1C)" : "#220803",
              border: "1px solid #4A1205",
              color: currentActive === "users" ? "#FFFFFF" : "#F3D8C8",
              padding: "10px 14px",
              borderRadius: "14px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 800,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (currentActive !== "users") {
                e.currentTarget.style.borderColor = "#C6873E";
                e.currentTarget.style.color = "#C6873E";
              }
            }}
            onMouseLeave={(e) => {
              if (currentActive !== "users") {
                e.currentTarget.style.borderColor = "#E8DAC8";
                e.currentTarget.style.color = "#F3D8C8";
              }
            }}
          >
            <Users size={15} color={currentActive === "users" ? "#FFFFFF" : "#C6873E"} />
            <span>{t("إدارة الموظفين", "Team Management")}</span>
          </Link>

          {/* Storefront Link */}
          <Link
            href="/"
            onClick={() => {
              playSound("click");
              if (isMobile) setMobileMenuOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              color: "#D4B896",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#C6873E"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7E5E49"; }}
          >
            <Store size={15} />
            <span>{t("المتجر والطلبات أونلاين", "Storefront")}</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: "10px",
              textAlign: dir === "rtl" ? "right" : "left",
            }}
          >
            <LogOut size={15} />
            <span>{t("خروج", "Logout")}</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN AREA (Top Bar + Page Content + Bottom Note)
      ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>

        {/* ── Top Bar — Waffle House Light Theme ── */}
        <header style={{
          minHeight: "64px",
          padding: isMobile ? "10px 14px" : "0 28px",
          borderBottom: "1px solid #3E1005",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#1C0500",
          gap: "10px",
          flexWrap: "wrap",
        }}>
          {/* Right: Hamburger button (on mobile) + User Role & Name Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isMobile && (
              <button
                onClick={() => {
                  playSound("click");
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                style={{
                  background: "rgba(198, 135, 62, 0.12)",
                  border: "1px solid #E8DAC8",
                  color: "#C6873E",
                  borderRadius: "10px",
                  padding: "7px 10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
                aria-label="القائمة"
              >
                <Menu size={18} />
                <span>{t("القائمة", "Menu")}</span>
              </button>
            )}

            <div suppressHydrationWarning style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: mounted ? (isOwner ? "linear-gradient(135deg, #ea580c, #c2410c)" : isManager ? "linear-gradient(135deg, #0284c7, #0369a1)" : "linear-gradient(135deg, #D4954E, #C6873E)") : "linear-gradient(135deg, #ea580c, #c2410c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              flexShrink: 0,
            }}>
              <Shield size={17} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span suppressHydrationWarning style={{ fontSize: "14px", fontWeight: 900, color: "#FFFFFF" }}>
                  {isOwner ? "Owner" : currentUser?.name || "Owner"}
                </span>
                <span style={{ fontSize: "11px", color: "#C6873E", fontWeight: 700 }}>
                  🛡️
                </span>
              </div>
              <div suppressHydrationWarning style={{ fontSize: "11px", color: "#7E5E49", fontWeight: 600 }}>
                {isOwner
                  ? t("الرتبة: مدير / Manager - مالك النظام", "Role: Manager - System Owner")
                  : isManager
                  ? t("الرتبة: مدير / Manager", "Role: Manager")
                  : currentUser
                  ? t(`الرتبة: ${permissions.label}`, `Role: ${currentUser.role}`)
                  : t("الرتبة: مدير / Manager - مالك النظام", "Role: Manager - System Owner")}
              </div>
            </div>
          </div>

          {/* Left: Action controls (Sound test, Settings, Lang) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Test Sound Button */}
            <button
              onClick={handleTestSound}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(198, 135, 62, 0.1)",
                border: "1px solid #E8DAC8",
                borderRadius: "100px",
                height: "36px",
                padding: isMobile ? "0 10px" : "0 14px",
                color: "#C6873E",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(198, 135, 62, 0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(198, 135, 62, 0.1)"; }}
            >
              <Bell size={14} color="#C6873E" />
              <span>{isMobile ? "صوت 🔔" : t("تجربة الصوت 🔔", "Test Audio 🔔")}</span>
            </button>

            {/* Settings button */}
            <button
              onClick={() => { playSound("click"); setShowSettings(true); }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#FAF6EE",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6B4F3B",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C6873E";
                e.currentTarget.style.color = "#C6873E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8DAC8";
                e.currentTarget.style.color = "#6B4F3B";
              }}
              title={t("إعدادات النظام والمتجر", "System & Store Settings")}
            >
              <Settings size={16} />
            </button>

            {/* Language button */}
            <button
              onClick={() => {
                playSound("click");
                toggleLang();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "36px",
                padding: "0 11px",
                borderRadius: "10px",
                background: "#FAF6EE",
                border: "1px solid #E8DAC8",
                color: "#C6873E",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Globe size={13} color="#C6873E" />
              <span>{lang === "ar" ? "EN 🌐" : "ع 🌐"}</span>
            </button>
          </div>
        </header>

        {/* ── Main Page Content ── */}
        <main style={{
          flex: 1,
          padding: isMobile ? "14px 10px" : "28px",
          boxSizing: "border-box",
          minWidth: 0,
          width: "100%",
          overflowX: "hidden",
        }}>
          {children}
        </main>

        {/* ── Bottom Credit Note (Orca Official Stamp) ── */}
        <footer style={{
          padding: "18px 28px 26px",
          textAlign: "center",
          fontSize: "12.5px",
          color: "#7E5E49",
          borderTop: "1px solid #E8DAC8",
          backgroundColor: "#FFFFFF",
          lineHeight: 1.6,
        }}>
          <span>{t("تم تطوير وبرمجة النظام بواسطة ", "System developed by ")}</span>
          <a
            href="https://wa.me/201018671000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A3%D9%88%D8%B1%D9%83%D8%A7%D8%8C%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D8%A7%D9%84%D8%A3%D9%86%D8%B8%D9%85%D8%A9%20%D9%88%D8%A7%D9%84%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%D8%A7%D8%AA%20%F0%9F%9A%80"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#C6873E",
              fontWeight: 800,
              textDecoration: "underline",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              margin: "0 4px",
            }}
          >
            <span>شركة أوركا للحلول البرمجية والخدمات السحابية</span>
            <span style={{ color: "#16a34a", fontSize: "11.5px" }} dir="ltr">(01018671000 💬)</span>
          </a>
          <div>
            <span style={{ fontSize: "11px", color: "#967B66" }}>
              {t("حفاظاً على حقوق ملكيتك الكاملة للفكرة والتطوير والتشغيل السحابي", "Protecting your full intellectual property and cloud operations rights")}
            </span>
          </div>
        </footer>
      </div>

      {/* System Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
