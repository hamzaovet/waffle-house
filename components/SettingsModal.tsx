"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import {
  Settings, X, ShieldAlert, Store, Phone, MapPin,
  Bell, Volume2, Save, Loader2, Check, ExternalLink, Sparkles,
  Smartphone, QrCode
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { currentUser } = useStaff();
  const { lang, t, dir } = useLanguage();
  const isOwner = currentUser?.role === "owner";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    restaurantName: "Waffle House",
    phone: "01018671000",
    address: "القاهرة - مصر",
    soundsEnabled: true,
    status: "open", // open, busy, closed, disabled
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          restaurantName: data.restaurantName || "Waffle House",
          phone: data.phone || "01018671000",
          address: data.address || "القاهرة - مصر",
          soundsEnabled: data.soundsEnabled ?? true,
          status: data.specialOffers || "open",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    playSound("click");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: settings.restaurantName,
          phone: settings.phone,
          address: settings.address,
          soundsEnabled: settings.soundsEnabled,
          specialOffers: settings.status,
        }),
      });
      if (res.ok) {
        playSound("success");
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div dir={dir} style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      backgroundColor: "rgba(0, 0, 0, 0.78)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "540px",
        maxHeight: "90vh",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8DAC8",
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(43,23,14,0.22)",
        color: "#2B170E",
        fontFamily: "var(--font-cairo), sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #E8DAC8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FAF6EE",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "rgba(198, 135, 62, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C6873E",
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#2B170E" }}>
                {t("إعدادات النظام والتشغيل", "System & Store Settings")}
              </h2>
              <div style={{ fontSize: "11px", color: "#7E5E49", marginTop: "2px" }}>
                {t("التحكم في حالة المطعم، بيانات الفرع، وتنبيهات السيستم", "Control store status, branch info, and system alerts")}
              </div>
            </div>
          </div>

          <button
            onClick={() => { playSound("click"); onClose(); }}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "#FAF6EE",
              border: "1px solid #E8DAC8",
              color: "#7E5E49",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px" }}>
              <Loader2 size={32} className="animate-spin" color="#C6873E" />
            </div>
          ) : (
            <>
              {/* Section 1: Store Operational Status */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 900, color: "#C6873E", marginBottom: "10px" }}>
                  {t("حالة استقبال الطلبات في المتجر", "Store Order Acceptance Status")}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    {
                      id: "open",
                      label: t("مفتوح ويستقبل طلبات 🟢", "Open & Accepting Orders 🟢"),
                      desc: t("الزبائن تطلب كالمعتاد", "Customers order normally"),
                    },
                    {
                      id: "busy",
                      label: t("ضغط طلبات 🟡", "Busy / Rush Hour 🟡"),
                      desc: t("تنبيه بتأخر التحضير", "Warning of delay"),
                    },
                    {
                      id: "closed",
                      label: t("مغلق مؤقتاً 🔴", "Temporarily Closed 🔴"),
                      desc: t("إيقاف استلام الطلبات", "Stop receiving orders"),
                    },
                    {
                      id: "disabled",
                      label: t("تعطيل السيستم 🛑", "Halt System 🛑"),
                      desc: t("إيقاف كامل للنظام (أونر)", "Owner full halt"),
                      ownerOnly: true,
                    },
                  ].map((st) => {
                    const isSelected = settings.status === st.id;
                    const disabled = st.ownerOnly && !isOwner;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) {
                            playSound("click");
                            setSettings({ ...settings, status: st.id });
                          }
                        }}
                        style={{
                          padding: "12px",
                          borderRadius: "14px",
                          border: isSelected
                            ? "2px solid #C6873E"
                            : "1px solid #E8DAC8",
                          background: isSelected
                            ? "rgba(198, 135, 62, 0.12)"
                            : "#FAF6EE",
                          color: disabled ? "rgba(43,23,14,0.3)" : "#2B170E",
                          textAlign: dir === "rtl" ? "right" : "left",
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.4 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: 900, marginBottom: "3px" }}>
                          {st.label}
                        </div>
                        <div style={{ fontSize: "10.5px", color: isSelected ? "#C6873E" : "#7E5E49" }}>
                          {st.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Store Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: 900, color: "#C6873E" }}>
                  {t("بيانات التواصل والفرع", "Contact & Branch Details")}
                </label>

                <div>
                  <span style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#7E5E49", marginBottom: "5px" }}>
                    {t("رقم الهاتف والدليفري / واتساب", "Delivery Phone / WhatsApp")}
                  </span>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      style={{
                        width: "100%",
                        height: "42px",
                        background: "#FAF6EE",
                        border: "1px solid #E8DAC8",
                        borderRadius: "12px",
                        padding: "0 14px",
                        color: "#2B170E",
                        fontSize: "13.5px",
                        fontWeight: 700,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#7E5E49", marginBottom: "5px" }}>
                    {t("عنوان الفرع (6 أكتوبر)", "Branch Address (6th of October)")}
                  </span>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    style={{
                      width: "100%",
                      height: "42px",
                      background: "#FAF6EE",
                      border: "1px solid #E8DAC8",
                      borderRadius: "12px",
                      padding: "0 14px",
                      color: "#2B170E",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Section 3: Audio alerts */}
              <div style={{
                padding: "14px",
                borderRadius: "14px",
                background: "#FAF6EE",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Bell size={18} color="#C6873E" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#2B170E" }}>
                      {t("صوت تنبيه الطلبات الجديدة", "New Orders Audio Chime")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7E5E49" }}>
                      {t("تشغيل نغمة فورية عند استلام أي أوردر من الموقع", "Play instant alert tone on new order")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => playSound("order")}
                    style={{
                      background: "rgba(198, 135, 62, 0.15)",
                      border: "1px solid #E8DAC8",
                      borderRadius: "8px",
                      color: "#C6873E",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t("تجربة", "Test")}
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.soundsEnabled}
                    onChange={(e) => setSettings({ ...settings, soundsEnabled: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#C6873E", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Section: Mobile App & APK Download */}
              <div style={{
                padding: "14px",
                borderRadius: "14px",
                background: "rgba(198, 135, 62, 0.08)",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Smartphone size={20} color="#C6873E" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#2B170E" }}>
                      {t("تطبيق الأندرويد وQR التحميل (APK)", "Android App & Download QR")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7E5E49" }}>
                      {t("تحميل ملف APK مباشرة، ومسح كود QR لتثبيت التطبيق", "Direct APK download & QR code for customers & couriers")}
                    </div>
                  </div>
                </div>

                <a
                  href="/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 900,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 2px 6px rgba(198, 135, 62, 0.25)",
                  }}
                >
                  <QrCode size={14} />
                  <span>{t("فتح صفحة التحميل", "Open Download")}</span>
                </a>
              </div>

              {/* Section 4: Shortcut to Offers Admin */}
              <div style={{
                padding: "14px",
                borderRadius: "14px",
                background: "rgba(198, 135, 62, 0.08)",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles size={18} color="#C6873E" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#2B170E" }}>
                      {t("إدارة العروض الخاصة والبانر", "Special Offers & Banners")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7E5E49" }}>
                      {t("تعديل كروت العروض وبانر الأكثر طلباً في الصفحة الرئيسية", "Edit offer cards and best-sellers on storefront")}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/offers-admin");
                  }}
                  style={{
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>{t("فتح", "Open")}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #E8DAC8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FAF6EE",
        }}>
          <button
            type="button"
            onClick={() => { playSound("click"); onClose(); }}
            style={{
              background: "transparent",
              border: "1px solid #E8DAC8",
              color: "#7E5E49",
              borderRadius: "12px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("إلغاء", "Cancel")}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              background: savedSuccess ? "#16a34a" : "linear-gradient(135deg, #D4954E, #C6873E)",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "12px",
              padding: "10px 24px",
              fontSize: "13.5px",
              fontWeight: 900,
              cursor: saving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 12px rgba(198, 135, 62, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("جاري الحفظ...", "Saving...")}</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={16} />
                <span>{t("تم الحفظ بنجاح!", "Saved Successfully!")}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t("حفظ الإعدادات", "Save Settings")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
