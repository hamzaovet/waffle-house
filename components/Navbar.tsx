"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { playSound } from "@/lib/sounds";
import {
  ChefHat, BarChart3, MessageCircle, LogIn, LogOut,
  ChevronDown, LayoutDashboard, Menu, X, Shield,
  Store, UtensilsCrossed, ClipboardList, Package,
  CircleDollarSign, ShoppingBag, Globe, Users, ShieldCheck, User,
} from "lucide-react";

const C = {
  dark:   "#140c07",
  card:   "#22140c",
  border: "#4d2d1b",
  gold:   "#d99b56",
  goldWhacka: "#d99b56",
  cream:  "#fbf5ed",
  muted:  "#b49279",
};

export default function Navbar() {
  const pathname  = usePathname();
  const { currentUser, users, switchUserByName, logout, isAuthenticated, permissions } = useStaff();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [cartCount,        setCartCount]         = useState(0);
  const [lang,             setLang]              = useState<"ar"|"en">("ar");
  const [customer,         setCustomer]          = useState<{ id: string; name: string; phone: string; email?: string } | null>(null);
  const [mounted,          setMounted]           = useState(false);

  /* Read cart count & customer from localStorage & sync language */
  useEffect(() => {
    setMounted(true);
    function syncCart() {
      try {
        const raw = localStorage.getItem("choco_cart_count");
        setCartCount(raw ? parseInt(raw, 10) : 0);
      } catch { setCartCount(0); }
    }
    function syncCustomer() {
      try {
        const raw = localStorage.getItem("choco_customer");
        setCustomer(raw ? JSON.parse(raw) : null);
      } catch { setCustomer(null); }
    }
    syncCart();
    syncCustomer();
    window.addEventListener("choco_cart_update", syncCart);
    window.addEventListener("choco_customer_updated", syncCustomer);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") as "ar" | "en" | null;
      if (urlLang === "ar" || urlLang === "en") {
        setLang(urlLang);
        localStorage.setItem("choco_lang", urlLang);
      } else {
        const savedLang = localStorage.getItem("choco_lang") as "ar" | "en";
        if (savedLang === "ar" || savedLang === "en") setLang(savedLang);
      }
    } catch {}

    const onLangChange = (e: any) => {
      const l = e.detail?.lang || e.detail;
      if (l === "ar" || l === "en") setLang(l);
    };
    window.addEventListener("choco_lang_change", onLangChange);

    return () => {
      window.removeEventListener("choco_cart_update", syncCart);
      window.removeEventListener("choco_customer_updated", syncCustomer);
      window.removeEventListener("choco_lang_change", onLangChange);
    };
  }, []);

  function openCustomer() {
    playSound("click");
    window.dispatchEvent(new CustomEvent("choco_open_customer"));
  }

  function toggleLanguage() {
    const nextLang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);
    try {
      localStorage.setItem("choco_lang", nextLang);
    } catch {}
    window.dispatchEvent(new CustomEvent("choco_lang_change", { detail: nextLang }));
    playSound("click");
  }

  if (pathname !== "/") return null;

  const isCustomerPage = true;

  const erpLinks = [
    { href: "/cashier",    label: "الطلبات",     icon: ClipboardList,    show: permissions.canViewOrders },
    { href: "/kitchen",    label: "المطبخ",       icon: ChefHat,          show: permissions.canViewKitchen },
    { href: "/dashboard",  label: "لوحة التحكم", icon: LayoutDashboard,  show: permissions.canViewOrders && (currentUser?.role === "owner" || currentUser?.role === "manager" || currentUser?.role === "accountant") },
    { href: "/menu-admin", label: "إدارة المنيو", icon: UtensilsCrossed,  show: permissions.canEditMenu },
    { href: "/inventory",  label: "المخزون",      icon: Package,          show: permissions.canViewInventory },
    { href: "/expenses",   label: "المصروفات",    icon: CircleDollarSign, show: permissions.canViewExpenses },
    { href: "/reports",    label: "التقارير",     icon: BarChart3,        show: permissions.canViewReports },
    { href: "/customers",  label: "العملاء",      icon: Users,            show: currentUser?.role === "owner" || currentUser?.role === "manager" },
    { href: "/chat",       label: "الشات",        icon: MessageCircle,    show: permissions.canViewChat },
    { href: "/users",      label: "الموظفون",     icon: Users,            show: currentUser?.role === "owner" || currentUser?.role === "manager" },
  ];

  function openCart() {
    playSound("click");
    window.dispatchEvent(new CustomEvent("choco_open_cart"));
  }

  /* ═══════════════════════════════════════════
     CUSTOMER NAVBAR — Exact Whacka 1:1 Replica
  ════════════════════════════════════════════ */
  if (isCustomerPage) {
    return (
      <>
        <style>{`
          .ch-nav-desktop { display: flex !important; }
          .ch-nav-mobile  { display: none  !important; }
          @media (max-width: 960px) {
            .ch-nav-desktop { display: none  !important; }
            .ch-nav-mobile  { display: flex  !important; }
          }
          .whacka-nav-link {
            font-family: var(--font-cairo), system-ui, -apple-system, sans-serif;
            font-size: 15.5px;
            font-weight: 700;
            color: #2B170E;
            text-decoration: none;
            transition: color 0.18s ease;
            white-space: nowrap;
            padding: 4px 0;
          }
          .whacka-nav-link:hover {
            color: #C6873E;
          }
        `}</style>

        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          width: "100%",
          background: "rgba(250, 246, 238, 0.95)",
          borderBottom: "1px solid #E8DAC8",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 2px 14px rgba(78, 44, 21, 0.04)",
        }}>
          <div style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "70px",
            padding: "0 20px",
            direction: lang === "ar" ? "rtl" : "ltr",
            boxSizing: "border-box",
          }}>

            {/* ── 1. LOGO & BRAND ── */}
            <Link
              href="/"
              onClick={() => playSound("click")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {/* WK Circle — Serif font matching Waffle House */}
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#FAF6EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
                border: "1.5px solid #E8DAC8",
              }}>
                <img
                  src="/waffle-house-logo.jpg"
                  alt="Waffle House"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* Brand Text */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                lineHeight: 1.15,
              }}>
                <span style={{
                  fontSize: "19px",
                  fontWeight: 800,
                  color: "#2B170E",
                  fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif",
                  fontStyle: "normal",
                  letterSpacing: "0.2px",
                }}>
                  Waffle House
                </span>
                <span style={{
                  fontSize: lang === "en" ? "9px" : "10px",
                  color: "#C6873E",
                  fontWeight: 700,
                  letterSpacing: lang === "en" ? "2.5px" : "2px",
                  marginTop: "3px",
                  fontFamily: lang === "en" ? "var(--font-playfair), Georgia, serif" : "var(--font-cairo), system-ui, sans-serif",
                  textTransform: "uppercase",
                }}>
                  {lang === "en" ? "PANCAKES • DRINKS" : "وافل هاوس"}
                </span>
              </div>
            </Link>

            {/* ── 2. NAV LINKS (Centered between Logo & Action buttons) ── */}
            <nav className="ch-nav-desktop" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "36px",
              flex: 1,
              margin: "0 24px",
            }}>
              {(lang === "en" ? [
                { href: "/",          label: "Home" },
                { href: "#menu",      label: "Menu" },
                { href: "#offers",    label: "Offers" },
                { href: "#about",     label: "About" },
                { href: "#track",     label: "Track order" },
                { href: "/download",  label: "📱 App" },
              ] : [
                { href: "/",          label: "الرئيسية" },
                { href: "#menu",      label: "المنيو" },
                { href: "#offers",    label: "العروض" },
                { href: "#about",     label: "عن المطعم" },
                { href: "#track",     label: "تتبع الطلب" },
                { href: "/download",  label: "📱 التطبيق" },
              ]).map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => playSound("click")}
                  className="whacka-nav-link"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* ── 3. ACTIONS (Language Toggle, Staff Login, Cart) ── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}>

              {/* Language Toggle — Globe icon + target lang label (EN when AR, ع when EN) */}
              <button
                onClick={toggleLanguage}
                className="ch-nav-desktop"
                title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FFFFFF",
                  border: "1px solid #D9C5B2",
                  color: "#4A2814",
                  borderRadius: "9px",
                  height: "40px",
                  padding: "0 13px",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C6873E";
                  e.currentTarget.style.background = "#FAF6EE";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#D9C5B2";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
              >
                <Globe size={15} color="#C6873E" />
                <span style={{ fontWeight: 800 }}>{lang === "ar" ? "EN" : "ع"}</span>
              </button>

              {/* Customer Account Button */}
              <button
                onClick={openCustomer}
                className="ch-nav-desktop"
                title={mounted && customer ? `أهلاً، ${customer.name}` : (lang === "en" ? "Customer Account" : "حساب العميل")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: mounted && customer ? "#F5EDE0" : "#FFFFFF",
                  border: "1px solid #D9C5B2",
                  color: "#4A2814",
                  borderRadius: "9px",
                  height: "40px",
                  padding: "0 14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C6873E";
                  e.currentTarget.style.background = "#F5EDE0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#D9C5B2";
                  e.currentTarget.style.background = mounted && customer ? "#F5EDE0" : "#FFFFFF";
                }}
              >
                <User size={15} color="#C6873E" />
                <span>{mounted && customer ? customer.name.split(" ")[0] : (lang === "en" ? "Account" : "حسابي")}</span>
              </button>

              {/* Staff Login — Outlined button with shield icon (Hydration Safe) */}
              <Link
                href={mounted && isAuthenticated && currentUser ? permissions.defaultRoute : "/login"}
                onClick={() => playSound("click")}
                className="ch-nav-desktop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "#FFFFFF",
                  border: "1px solid #D9C5B2",
                  color: "#4A2814",
                  borderRadius: "9px",
                  height: "40px",
                  padding: "0 15px",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C6873E";
                  e.currentTarget.style.background = "#FAF6EE";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#D9C5B2";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
              >
                <ShieldCheck size={15} color="#C6873E" />
                <span>
                  {mounted && isAuthenticated && currentUser
                    ? (currentUser.name ? currentUser.name.split(" ")[0] : (lang === "en" ? "Dashboard" : "لوحة التحكم"))
                    : (lang === "en" ? "Staff" : "دخول الموظفين")}
                </span>
              </Link>

              {/* Cart Button — Golden rounded square */}
              <button
                onClick={openCart}
                style={{
                  position: "relative",
                  width: "42px",
                  height: "42px",
                  background: "#d99b56",
                  border: "none",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(217, 155, 86, 0.25)",
                  flexShrink: 0,
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <ShoppingBag size={19} color="#180e06" strokeWidth={2.2} />
                {mounted && cartCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 900,
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #180e06",
                  }}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="ch-nav-mobile"
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "9px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(217, 155, 86, 0.3)",
                  color: "#d99b56",
                  cursor: "pointer",
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div style={{
              borderTop: "1px solid rgba(217, 155, 86, 0.15)",
              background: "rgba(22, 13, 5, 0.98)",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              direction: lang === "ar" ? "rtl" : "ltr",
            }}>
              {(lang === "en" ? [
                { href: "/",          label: "🏠 Home" },
                { href: "#menu",      label: "🍽️ Menu" },
                { href: "#offers",    label: "🏷️ Offers" },
                { href: "#about",     label: "🏪 About" },
                { href: "#track",     label: "📦 Track order" },
                { href: "/download",  label: "📱 Download App" },
              ] : [
                { href: "/",          label: "🏠 الرئيسية" },
                { href: "#menu",      label: "🍽️ المنيو" },
                { href: "#offers",    label: "🏷️ العروض" },
                { href: "#about",     label: "🏪 عن المطعم" },
                { href: "#track",     label: "📦 تتبع الطلب" },
                { href: "/download",  label: "📱 تحميل التطبيق (APK)" },
              ]).map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#e8ded4",
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {l.label}
                </a>
              ))}
              
              {/* Mobile Language Switcher */}
              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(217, 155, 86, 0.45)",
                  background: "rgba(217, 155, 86, 0.1)",
                  color: "#d99b56",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Globe size={16} />
                <span>{lang === "ar" ? "English 🇬🇧" : "العربية 🇪🇬"}</span>
              </button>

              {/* Mobile Customer Account Button */}
              <button
                onClick={() => {
                  openCustomer();
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(217, 155, 86, 0.45)",
                  background: customer ? "rgba(217, 155, 86, 0.2)" : "rgba(255,255,255,0.03)",
                  color: "#d99b56",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <User size={16} />
                <span>{customer ? `${customer.name} (حسابي وطلباتي 📦)` : (lang === "en" ? "My Account / Orders 👤" : "حسابي / طلباتي 👤")}</span>
              </button>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "9px",
                  border: "1px solid rgba(217, 155, 86, 0.45)",
                  color: "#d99b56",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  marginTop: "6px",
                }}
              >
                <ShieldCheck size={16} />
                <span>{lang === "en" ? "Staff Login" : "دخول الموظفين"}</span>
              </Link>
            </div>
          )}
        </header>
      </>
    );
  }

  /* ═══════════════════════════════════════════
     ERP NAVBAR
  ════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .erp-desktop { display: flex !important; }
        .erp-mobile  { display: none  !important; }
        @media (max-width: 860px) {
          .erp-desktop { display: none  !important; }
          .erp-mobile  { display: flex  !important; }
        }
        .erp-link { transition: all 0.18s; }
        .erp-link:hover { color: #fff !important; background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 100, width: "100%",
        background: "#FAF6EE",
        borderBottom: "1px solid #E8DAC8",
        boxShadow: "0 2px 14px rgba(78, 44, 21, 0.04)",
      }}>
        <div style={{
          maxWidth: "1400px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "56px", padding: "0 16px",
          direction: "rtl",
        }}>

          {/* Logo */}
          <Link href="/" onClick={() => playSound("click")} style={{
            display: "flex", alignItems: "center", gap: "9px",
            textDecoration: "none", flexShrink: 0,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#FFFFFF",
              border: "1.5px solid #E8DAC8",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#C6873E", fontFamily: "var(--font-playfair), Georgia, serif" }}>WK</span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{
                  fontSize: "15px", fontWeight: 800, color: "#2B170E",
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "normal",
                }}>
                  Waffle House
                </span>
                <span style={{
                  fontSize: "10px", background: "rgba(212, 149, 78, 0.15)",
                  color: "#C6873E", padding: "2px 7px", borderRadius: "100px",
                  fontWeight: 700, border: "1px solid rgba(212, 149, 78, 0.3)",
                  fontStyle: "normal", fontFamily: "system-ui, sans-serif",
                }}>
                  {currentUser?.role === "owner" ? "Owner"
                   : currentUser?.role === "manager" ? "Manager"
                   : currentUser?.role === "chef" ? "Kitchen"
                   : currentUser?.role === "accountant" ? "Finance"
                   : "Cashier"}
                </span>
              </div>
            </div>
          </Link>

          {/* ERP Nav links */}
          <nav className="erp-desktop" style={{
            alignItems: "center", gap: "1px",
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            borderRadius: "14px", padding: "4px",
            overflowX: "auto",
          }}>
            {erpLinks.filter((l) => l.show).map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  onClick={() => playSound("click")}
                  className="erp-link"
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "6px 11px", borderRadius: "10px",
                    fontSize: "12px", fontWeight: 700,
                    textDecoration: "none", whiteSpace: "nowrap",
                    background: active ? "linear-gradient(135deg, #D4954E, #C6873E)" : "transparent",
                    color: active ? "#FFFFFF" : "#7E5E49",
                  }}
                >
                  <Icon size={12} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/" onClick={() => playSound("click")}
              className="erp-desktop"
              style={{
                display: "flex",
                alignItems: "center", gap: "5px",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                color: "#7E5E49", borderRadius: "9px",
                padding: "6px 11px", fontSize: "12px", fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Store size={12} style={{ color: "#D4954E" }} />
              المتجر
            </Link>

            {isAuthenticated && currentUser ? (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowUserDropdown(!showUserDropdown)} style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  background: "#FFFFFF",
                  border: "1px solid #E8DAC8",
                  borderRadius: "12px", padding: "5px 10px",
                  cursor: "pointer", color: "#2B170E",
                }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFFFFF", fontWeight: 900, fontSize: "12px",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}>
                    {currentUser.name[0]}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "12px" }}>{currentUser.name.split(" ")[0]}</span>
                  <ChevronDown size={12} style={{ color: "#7E5E49" }} />
                </button>

                {showUserDropdown && (
                  <div style={{
                    position: "absolute", left: 0, top: "calc(100% + 8px)",
                    width: "210px", background: "#FFFFFF",
                    border: "1px solid #E8DAC8",
                    borderRadius: "16px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
                    padding: "8px", zIndex: 50, direction: "rtl",
                  }}>
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #E8DAC8", marginBottom: "5px" }}>
                      <p style={{ fontWeight: 900, fontSize: "13px", color: "#2B170E", margin: 0 }}>{currentUser.name}</p>
                      <span style={{
                        display: "inline-block", marginTop: "3px",
                        fontSize: "10px", padding: "2px 7px", borderRadius: "100px",
                        background: "rgba(212, 149, 78, 0.15)", color: "#C6873E",
                        fontWeight: 700, border: "1px solid rgba(212, 149, 78, 0.3)",
                      }}>
                        {permissions.label}
                      </span>
                    </div>
                    {(currentUser.role === "owner" || currentUser.role === "manager") && (
                      <Link href="/users" onClick={() => { setShowUserDropdown(false); playSound("click"); }} style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        padding: "8px 10px", borderRadius: "8px",
                        fontSize: "12px", fontWeight: 700, color: "#C6873E",
                        textDecoration: "none", marginBottom: "6px",
                        background: "rgba(212, 149, 78, 0.08)",
                      }}>
                        <Users size={13} /> إدارة الفريق
                      </Link>
                    )}

                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#7E5E49", padding: "3px 10px", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Shield size={10} /> تبديل:
                    </p>
                    <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                      {users
                        .filter((u) => currentUser.role === "owner" || u.role !== "owner")
                        .map((u) => (
                        <button key={u.id}
                          onClick={() => { switchUserByName(u.name); setShowUserDropdown(false); playSound("click"); }}
                          style={{
                            width: "100%", textAlign: "right",
                            padding: "7px 10px", borderRadius: "8px",
                            fontSize: "12px", cursor: "pointer", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: u.name === currentUser.name ? "rgba(212, 149, 78, 0.12)" : "transparent",
                            color: u.name === currentUser.name ? "#C6873E" : "#7E5E49",
                            fontWeight: u.name === currentUser.name ? 900 : 600,
                          }}
                        >
                          <span>{u.name}</span>
                          <span style={{ fontSize: "10px", color: "#A88B77", fontFamily: "monospace" }}>{u.role}</span>
                        </button>
                      ))}
                    </div>
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #E8DAC8", marginTop: "5px" }}>
                      <button onClick={() => { logout(); setShowUserDropdown(false); window.location.href = "/"; }}
                        style={{
                          display: "flex", alignItems: "center", gap: "7px",
                          padding: "7px 10px", borderRadius: "8px",
                          fontSize: "12px", fontWeight: 700, color: "#dc2626",
                          background: "transparent", border: "none",
                          cursor: "pointer", width: "100%", textAlign: "right",
                        }}
                      >
                        <LogOut size={13} /> تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" onClick={() => playSound("click")} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "linear-gradient(135deg, #D4954E, #C6873E)", color: "#FFFFFF",
                padding: "7px 13px", borderRadius: "9px",
                fontSize: "12px", fontWeight: 900, textDecoration: "none",
              }}>
                <LogIn size={13} /> دخول
              </Link>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="erp-mobile"
              style={{
                alignItems: "center", justifyContent: "center",
                padding: "7px", borderRadius: "9px",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                color: "#2B170E", cursor: "pointer",
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{
            borderTop: "1px solid #E8DAC8",
            background: "#FAF6EE", padding: "10px 14px",
            display: "flex", flexDirection: "column", gap: "3px",
            direction: "rtl",
          }}>
            {erpLinks.filter((l) => l.show).map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block", padding: "9px 12px",
                  borderRadius: "9px", fontWeight: 700,
                  fontSize: "13px", color: "#7E5E49",
                  textDecoration: "none",
                  background: pathname === l.href ? "rgba(212, 149, 78, 0.15)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
