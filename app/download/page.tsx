"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Download, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  BellRing, 
  ChevronRight, 
  CheckCircle2, 
  Share2, 
  ExternalLink, 
  Sparkles 
} from "lucide-react";

export default function DownloadAppPage() {
  const [downloading, setDownloading] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auto") === "1") {
        setAutoCountdown(3);
      }
    }
  }, []);

  useEffect(() => {
    if (autoCountdown === null) return;
    if (autoCountdown > 0) {
      const timer = setTimeout(() => setAutoCountdown(autoCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoCountdown === 0) {
      handleDownload();
      setAutoCountdown(null);
    }
  }, [autoCountdown]);

  function handleDownload() {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = "/api/download/apk";
    link.setAttribute("download", "waffle-house.apk");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 4000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "تطبيق Waffle House للأندرويد",
        text: "حمّل تطبيق Waffle House الرسمي للأندرويد واستمتع بأشهى الوافل والكيك والحلويات بأسرع تجربة طلب!",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div 
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#F8F4EC",
        color: "#2B170E",
        fontFamily: "var(--font-cairo), system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 16px 64px",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Top Navbar */}
      <header 
        style={{
          width: "100%",
          maxWidth: "880px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          zIndex: 10,
        }}
      >
        <Link 
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#7E5E49",
            textDecoration: "none",
            fontSize: "13.5px",
            fontWeight: 700,
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            padding: "8px 18px",
            borderRadius: "100px",
            boxShadow: "0 2px 6px rgba(43,23,14,0.03)",
          }}
        >
          <ChevronRight size={17} />
          <span>الرجوع للمطعم والمنيو</span>
        </Link>

        <button
          onClick={handleShare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            color: "#C6873E",
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            padding: "8px 16px",
            borderRadius: "100px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(43,23,14,0.03)",
          }}
        >
          <Share2 size={15} />
          <span>{copied ? "تم نسخ الرابط! ✓" : "مشاركة التطبيق"}</span>
        </button>
      </header>

      {/* Hero Badge */}
      <div 
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(212, 149, 78, 0.12)",
          border: "1px solid rgba(212, 149, 78, 0.35)",
          padding: "6px 18px",
          borderRadius: "100px",
          color: "#C6873E",
          fontSize: "12px",
          fontWeight: 800,
          marginBottom: "16px",
          zIndex: 10,
        }}
      >
        <Sparkles size={14} />
        <span>النسخة الأصلية الرسمية • Android APK v1.0.0</span>
      </div>

      {/* Main Title */}
      <h1 
        style={{
          fontSize: "clamp(26px, 5vw, 38px)",
          fontWeight: 900,
          textAlign: "center",
          marginBottom: "10px",
          color: "#2B170E",
          lineHeight: 1.25,
          zIndex: 10,
        }}
      >
        حمّل تطبيق Waffle House الرسمي 🧇🍰
      </h1>
      <p 
        style={{
          color: "#7E5E49",
          fontSize: "clamp(14px, 2.5vw, 16px)",
          textAlign: "center",
          maxWidth: "560px",
          lineHeight: 1.6,
          marginBottom: "32px",
          zIndex: 10,
          fontWeight: 600,
        }}
      >
        تجربة طلب فورية وسلسة لأشهى الوافل، الميني بانكيك، والتشيز كيك، مع حاسبة مناطق التوصيل الذكية لـ 84 منطقة، وشات مباشر مع المطعم.
      </p>

      {/* Auto Countdown Banner if triggered */}
      {autoCountdown !== null && (
        <div 
          style={{
            background: "#DCFCE7",
            border: "1px solid #86EFAC",
            borderRadius: "14px",
            padding: "12px 20px",
            marginBottom: "24px",
            color: "#15803D",
            fontSize: "14px",
            fontWeight: 800,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", animation: "pulse 1.2s infinite" }} />
          <span>سيبدأ تحميل التطبيق تلقائياً خلال {autoCountdown} ثانية...</span>
        </div>
      )}

      {/* Download Center Card */}
      <main
        style={{
          width: "100%",
          maxWidth: "880px",
          background: "#FFFFFF",
          border: "1px solid #E8DAC8",
          borderRadius: "28px",
          padding: "36px 28px",
          boxShadow: "0 20px 50px rgba(43, 23, 14, 0.06)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "36px",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Left Column: QR Code & Scan Instructions */}
        <div 
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            background: "#FAF6EE",
            border: "1px solid #E8DAC8",
            borderRadius: "22px",
            padding: "24px 20px",
          }}
        >
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "#C6873E",
              fontSize: "13px",
              fontWeight: 800,
              marginBottom: "14px",
            }}
          >
            <QrCode size={18} />
            <span>امسح الكود بكاميرا الموبايل للتحميل المباشر</span>
          </div>

          <div 
            style={{
              background: "#FFFFFF",
              padding: "12px",
              borderRadius: "18px",
              border: "1px solid #E8DAC8",
              boxShadow: "0 8px 24px rgba(43, 23, 14, 0.08)",
              marginBottom: "16px",
            }}
          >
            <img 
              src="/waffle-apk-qr.png" 
              alt="QR Code لتحميل تطبيق Waffle House"
              style={{
                width: "190px",
                height: "190px",
                display: "block",
                borderRadius: "10px",
              }}
            />
          </div>

          <p style={{ color: "#7E5E49", fontSize: "12.5px", maxWidth: "230px", lineHeight: 1.5 }}>
            وجّه كاميرا هاتفك نحو الكود ليتم فتح صفحة التحميل وتحميل ملف التطبيق تلقائياً.
          </p>
        </div>

        {/* Right Column: Action Buttons & Install Guide */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Smartphone size={24} style={{ color: "#C6873E" }} />
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#2B170E", margin: 0 }}>
                نسخة الأندرويد المباشرة
              </h2>
            </div>
            <p style={{ color: "#7E5E49", fontSize: "13px", margin: 0 }}>
              حجم الملف: <strong>8.7 ميجابايت</strong> • متوافق مع كافة أجهزة Android 8.0 فما فوق
            </p>
          </div>

          {/* Big Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              background: downloading 
                ? "#16a34a" 
                : "linear-gradient(135deg, #D4954E 0%, #C6873E 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "16px",
              padding: "18px 24px",
              fontSize: "16px",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: "0 12px 30px rgba(198, 135, 62, 0.35)",
              transition: "all 0.25s ease",
            }}
          >
            {downloading ? (
              <>
                <CheckCircle2 size={22} />
                <span>جاري بدء التحميل الآن...</span>
              </>
            ) : (
              <>
                <Download size={22} />
                <span>تحميل ملف التطبيق APK للأندرويد</span>
              </>
            )}
          </button>

          {/* Direct link fallback */}
          <div style={{ textAlign: "center" }}>
            <a 
              href="https://github.com/hamzaovet/waffle-cake/releases/latest/download/waffle-cake.apk"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#C6873E",
                fontSize: "12.5px",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 700,
              }}
            >
              <span>رابط تحميل احتياطي مباشر (GitHub Releases)</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Quick 3-Step Install Guide */}
          <div 
            style={{
              background: "#FAF6EE",
              border: "1px solid #E8DAC8",
              borderRadius: "16px",
              padding: "16px 18px",
            }}
          >
            <h3 style={{ fontSize: "13.5px", fontWeight: 800, color: "#2B170E", marginBottom: "12px" }}>
              خطوات التثبيت السريعة (3 خطوات فقط):
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px", color: "#7E5E49" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ 
                  background: "linear-gradient(135deg, #D4954E, #C6873E)", 
                  color: "#FFFFFF", 
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "11px", 
                  fontWeight: 900,
                  flexShrink: 0,
                  marginTop: "1px"
                }}>1</span>
                <span>اضغط على زر <strong>تحميل ملف التطبيق APK</strong> أعلاه أو امسح كود QR.</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ 
                  background: "linear-gradient(135deg, #D4954E, #C6873E)", 
                  color: "#FFFFFF", 
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "11px", 
                  fontWeight: 900,
                  flexShrink: 0,
                  marginTop: "1px"
                }}>2</span>
                <span>افتح الملف من التنزيلات واضغط <strong>تثبيت (Install)</strong>. إذا طلب هاتفك السماح اختر "السماح بالتثبيت من هذا المصدر".</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ 
                  background: "linear-gradient(135deg, #D4954E, #C6873E)", 
                  color: "#FFFFFF", 
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "11px", 
                  fontWeight: 900,
                  flexShrink: 0,
                  marginTop: "1px"
                }}>3</span>
                <span>افتح التطبيق واستمتع بأشهى وافل وحلويات وأسرع متابعة لأوردراتك! 🧇🍰</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Highlights Grid */}
      <section
        style={{
          width: "100%",
          maxWidth: "880px",
          marginTop: "36px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          zIndex: 10,
        }}
      >
        <div 
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(43,23,14,0.03)",
          }}
        >
          <div style={{ background: "rgba(212, 149, 78, 0.15)", padding: "10px", borderRadius: "12px", color: "#C6873E" }}>
            <Zap size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#2B170E", marginBottom: "4px" }}>سرعة استجابة فائقة</h4>
            <p style={{ fontSize: "12px", color: "#7E5E49", lineHeight: 1.5 }}>
              تصفح سلس للمنيو وأصناف الوافل والحلويات بدون الحاجة لفتح المتصفح في كل مرة.
            </p>
          </div>
        </div>

        <div 
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(43,23,14,0.03)",
          }}
        >
          <div style={{ background: "rgba(212, 149, 78, 0.15)", padding: "10px", borderRadius: "12px", color: "#C6873E" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#2B170E", marginBottom: "4px" }}>شات خاص وآمن</h4>
            <p style={{ fontSize: "12px", color: "#7E5E49", lineHeight: 1.5 }}>
              محادثاتك مع المطعم معزولة تماماً وخاصة بك وحدك لمتابعة تفاصيل طلبك.
            </p>
          </div>
        </div>

        <div 
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(43,23,14,0.03)",
          }}
        >
          <div style={{ background: "rgba(212, 149, 78, 0.15)", padding: "10px", borderRadius: "12px", color: "#C6873E" }}>
            <BellRing size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#2B170E", marginBottom: "4px" }}>إشعارات لحظية</h4>
            <p style={{ fontSize: "12px", color: "#7E5E49", lineHeight: 1.5 }}>
              متابعة حالة تحضير الطلب، خروج الكابتن، ووقت الوصول بدقة.
            </p>
          </div>
        </div>
      </section>

      {/* App Stores Roadmap */}
      <footer 
        style={{
          width: "100%",
          maxWidth: "880px",
          marginTop: "48px",
          textAlign: "center",
          borderTop: "1px solid #E8DAC8",
          paddingTop: "24px",
          color: "#7E5E49",
          fontSize: "12.5px",
          zIndex: 10,
        }}
      >
        <p style={{ marginBottom: "8px" }}>
          🚀 جاري تجهيز وإصدار النسخة الرسمية على <strong>Google Play Store</strong> و <strong>Apple App Store</strong>.
        </p>
        <p style={{ color: "#C6873E", fontWeight: 700, marginBottom: "12px" }}>
          جميع الحقوق محفوظة © Waffle House Desserts {new Date().getFullYear()}
        </p>
        <div>
          <a
            href="https://wa.me/201018671000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#C6873E",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "100px",
              background: "#FFFFFF",
              border: "1px solid #E8DAC8",
              boxShadow: "0 2px 6px rgba(43,23,14,0.03)",
            }}
          >
            <span>تم التطوير بواسطة شركة أوركا للحلول البرمجية والخدمات السحابية 🐋</span>
            <span style={{ direction: "ltr", fontFamily: "monospace" }}>01018671000</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
