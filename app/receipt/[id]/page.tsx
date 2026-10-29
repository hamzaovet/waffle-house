"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2, Clock, MapPin, Phone, Bike, ChefHat,
  Printer, ArrowRight, MessageCircle, AlertCircle, RefreshCw, ShieldCheck, ShoppingBag, Utensils
} from "lucide-react";
import { printThermalReceipt } from "@/components/ThermalReceipt";

interface OrderItem {
  nameAr?: string;
  nameEn?: string;
  qty: number;
  unitPrice: number;
  extras?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address?: string;
  zone?: string;
  orderType?: string; // delivery, takeaway, dinein
  status: "new" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
  items: string; // JSON
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  captainName?: string | null;
  captainPhone?: string | null;
  createdAt: string;
}

export default function DigitalReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError("لم يتم العثور على الفاتورة المطلوبة");
      }
    } catch {
      setError("حدث خطأ أثناء تحميل الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function handleMarkDelivered() {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "delivered",
          _updatedBy: "captain_digital_scan",
        }),
      });
      if (res.ok) {
        fetchOrder();
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#1C0600", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cairo), sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧇✨</div>
          <p style={{ fontWeight: 800, fontSize: "16px", color: "#FFFFFF" }}>جاري تحميل الفاتورة الذكية - وافل هاوس...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#1C0600", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-cairo), sans-serif" }}>
        <div style={{ maxWidth: "420px", width: "100%", background: "#2A0A02", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "20px", padding: "28px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <AlertCircle size={44} color="#ef4444" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "8px" }}>تعذر فتح الفاتورة</h2>
          <p style={{ color: "#E5E7EB", fontSize: "13px", marginBottom: "20px" }}>{error || "تأكد من صحة رمز الـ QR أو رقم الأوردر"}</p>
          <Link href="/" style={{ display: "inline-block", background: "linear-gradient(135deg, #8B0000, #991B1B)", color: "#FFFFFF", padding: "10px 20px", borderRadius: "10px", fontWeight: 800, textDecoration: "none" }}>
            العودة للمنيو الرئيسي
          </Link>
        </div>
      </div>
    );
  }

  const items: OrderItem[] = (() => {
    try {
      return JSON.parse(order.items);
    } catch {
      return [];
    }
  })();

  const isTakeaway = order.orderType === "takeaway";
  const isDinein = order.orderType === "dinein";
  const isDelivery = !isTakeaway && !isDinein;

  const cleanCustomerPhone = order.phone.replace(/[^0-9]/g, "");
  const customerWaPhone = cleanCustomerPhone.startsWith("0") ? "2" + cleanCustomerPhone : cleanCustomerPhone;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1C0600 0%, #2A0A02 50%, #450A0A 100%)", color: "#FFFFFF", padding: "20px 14px", fontFamily: "var(--font-cairo), system-ui, sans-serif" }}>
      <div style={{ maxWidth: "460px", margin: "0 auto" }}>
        {/* Top Back Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#F59E0B", textDecoration: "none", fontSize: "13px", fontWeight: 800 }}>
            <ArrowRight size={16} />
            <span>WAFFLE HOUSE • العودة للمنيو</span>
          </Link>

          <button
            onClick={() => fetchOrder()}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <RefreshCw size={12} />
            <span>تحديث</span>
          </button>
        </div>

        {/* Digital Receipt Card */}
        <div style={{ background: "#FFFFFF", color: "#180e06", borderRadius: "22px", padding: "24px 20px", boxShadow: "0 16px 45px rgba(0,0,0,0.7)" }}>
          {/* Logo & Header */}
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <img src="/logo.jpg" alt="Waffle House" style={{ width: "85px", height: "85px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px", display: "block", border: "2px solid #8B0000" }} />
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#180e06" }}>WAFFLE HOUSE • وافل هاوس</div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#8B0000" }}>SWEET WE HAVE SWEETEST</div>
            <div style={{ fontSize: "11.5px", color: "#444", fontWeight: 700, marginTop: "2px" }}>حدائق القبة - شارع مصر والسودان - بجوار حلواني الشيبي</div>
            <div style={{ fontSize: "12.5px", fontWeight: 800, marginTop: "2px" }}>هاتف الطلبات: 01155175799 - 01117649159</div>
          </div>

          <div style={{ borderTop: "2px solid #180e06", margin: "12px 0" }} />

          {/* Order Type Pill */}
          <div
            style={{
              backgroundColor: isTakeaway ? "#047857" : isDinein ? "#7c2d12" : "#8B0000",
              color: "#ffffff",
              textAlign: "center",
              fontWeight: 900,
              fontSize: "13px",
              padding: "6px 8px",
              borderRadius: "8px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isTakeaway ? (
              <>
                <ShoppingBag size={16} />
                <span>طلب استلام من الفرع (تيك أواي)</span>
              </>
            ) : isDinein ? (
              <>
                <Utensils size={16} />
                <span>طلب صالة (تناول داخل الفرع)</span>
              </>
            ) : (
              <>
                <Bike size={16} />
                <span>طلب توصيل سريع (دليفري)</span>
              </>
            )}
          </div>

          {/* Order Number & Live Status Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#666", display: "block" }}>رقم الأوردر:</span>
              <span style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: 900, color: "#8B0000" }}>
                {order.orderNumber}
              </span>
            </div>

            {/* Status Pill */}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 900,
                padding: "4px 12px",
                borderRadius: "100px",
                background:
                  order.status === "new" ? "#fef3c7"
                  : order.status === "preparing" ? "#ffedd5"
                  : order.status === "ready" ? "#d1fae5"
                  : order.status === "delivering" ? "#f3e8ff"
                  : order.status === "delivered" ? "#dcfce7"
                  : "#fee2e2",
                color:
                  order.status === "new" ? "#b45309"
                  : order.status === "preparing" ? "#c2410c"
                  : order.status === "ready" ? "#047857"
                  : order.status === "delivering" ? "#7e22ce"
                  : order.status === "delivered" ? "#15803d"
                  : "#b91c1c",
              }}
            >
              {order.status === "new" ? "تم الاستلام 📋"
               : order.status === "preparing" ? "قيد التحضير 👨‍🍳"
               : order.status === "ready" ? (isTakeaway ? "جاهز للاستلام بالفرع 🥡" : "جاهز للتسليم 🛵")
               : order.status === "delivering" ? "مع الكابتن في الطريق 🚴"
               : order.status === "delivered" ? "تم الاستلام والتسليم بنجاح 🎉"
               : "ملغي ❌"}
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#666", display: "flex", justifyContent: "space-between" }}>
            <span>التاريخ: {new Date(order.createdAt).toLocaleDateString("ar-EG")}</span>
            <span>الساعة: {new Date(order.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div style={{ borderTop: "1px dashed #666", margin: "12px 0" }} />

          {/* Customer Details */}
          <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
            <div><strong>العميل:</strong> {order.customerName}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><strong>الموبايل:</strong> <span dir="ltr">{order.phone}</span></div>
              <div style={{ display: "flex", gap: "6px" }}>
                <a href={`tel:${order.phone}`} style={{ background: "#f3f4f6", color: "#180e06", padding: "2px 8px", borderRadius: "6px", textDecoration: "none", fontSize: "11px", fontWeight: 800 }}>
                  اتصال 📞
                </a>
                <a href={`https://wa.me/${customerWaPhone}`} target="_blank" rel="noopener noreferrer" style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "6px", textDecoration: "none", fontSize: "11px", fontWeight: 800 }}>
                  واتساب 💬
                </a>
              </div>
            </div>
            {isDelivery ? (
              <>
                <div><strong>منطقة التوصيل:</strong> {order.zone || "حدائق القبة"}</div>
                {order.address && <div><strong>العنوان:</strong> {order.address}</div>}
              </>
            ) : (
              <div style={{ color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                📍 الاستلام من: فرع حدائق القبة (شارع مصر والسودان)
              </div>
            )}
            {order.notes && <div style={{ color: "#b45309", background: "#fef3c7", padding: "4px 8px", borderRadius: "6px", marginTop: "4px" }}><strong>ملاحظات:</strong> {order.notes}</div>}
          </div>

          {/* Captain Details Box if Delivery */}
          {isDelivery && order.captainName && (
            <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f3e8ff", border: "1px dashed #c084fc", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#7e22ce", fontWeight: 800 }}>كابتن التوصيل:</div>
                <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#180e06" }}>{order.captainName}</div>
                {order.captainPhone && <div style={{ fontSize: "11.5px", color: "#581c87" }} dir="ltr">{order.captainPhone}</div>}
              </div>
              {order.captainPhone && (
                <a href={`tel:${order.captainPhone}`} style={{ background: "#9333ea", color: "#ffffff", padding: "4px 10px", borderRadius: "8px", textDecoration: "none", fontSize: "11.5px", fontWeight: 800 }}>
                  اتصال بالطيار 📞
                </a>
              )}
            </div>
          )}

          <div style={{ borderTop: "2px solid #180e06", margin: "14px 0 10px" }} />

          {/* Items Table */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "12.5px", borderBottom: "1px solid #180e06", paddingBottom: "4px", marginBottom: "6px" }}>
              <span>الصنف والحجم</span>
              <span>الكمية</span>
              <span>السعر</span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} style={{ padding: "4px 0", borderBottom: "1px dashed #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ fontWeight: 800 }}>{it.nameAr || it.nameEn || "صنف"}</span>
                  <span style={{ fontWeight: 700 }}>× {it.qty}</span>
                  <span style={{ fontWeight: 900 }}>{it.unitPrice * it.qty} ج</span>
                </div>
                {it.extras && it.extras.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#666", paddingRight: "10px" }}>
                    + {it.extras.join(" + ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #666", margin: "10px 0" }} />

          {/* Financials Breakdown */}
          <div style={{ fontSize: "13px", lineHeight: 1.7 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>المجموع الفرعي:</span>
              <span style={{ fontWeight: 700 }}>{order.subtotal} ج</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{isDelivery ? `خدمة التوصيل (${order.zone || "حدائق القبة"}):` : "رسوم الاستلام من الفرع:"}</span>
              <span style={{ fontWeight: 700 }}>{isDelivery ? `${order.deliveryFee} ج` : "0 ج (مجاناً)"}</span>
            </div>

            <div style={{ borderTop: "2px solid #180e06", margin: "8px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "16px", fontWeight: 900 }}>
              <span>المطلوب تحصيله:</span>
              <span style={{ fontSize: "20px", color: "#8B0000" }}>{order.total} ج.م</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
              <span>طريقة الدفع:</span>
              <span style={{ fontWeight: 800 }}>
                {order.paymentMethod === "cash" ? "كاش عند الاستلام 💵"
                 : order.paymentMethod === "instapay" ? "إنستاباي (تم الدفع) ⚡"
                 : "فيزا / كارت 💳"}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1.5px dashed #444", margin: "14px 0 10px" }} />

          {/* Action for Captain: Complete & Collect Cash */}
          {order.status === "delivering" && (
            <div style={{ marginTop: "14px" }}>
              <button
                onClick={handleMarkDelivered}
                disabled={updating}
                style={{
                  width: "100%",
                  height: "46px",
                  background: "#22c55e",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                }}
              >
                <CheckCircle2 size={18} />
                <span>{updating ? "جاري التحديث..." : "تأكيد التسليم واستلام النقدية ✅"}</span>
              </button>
            </div>
          )}

          {/* Print Button */}
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={() => printThermalReceipt(order as any)}
              style={{
                width: "100%",
                height: "42px",
                background: "#f3f4f6",
                color: "#180e06",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Printer size={16} />
              <span>طباعة الريسيت الحراري (80mm) 🖨️</span>
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "11px", color: "#666", marginTop: "14px", lineHeight: 1.6 }}>
            شكراً لطلبكم من Waffle House 🧇✨<br />
            حدائق القبة - ش مصر والسودان (بجوار حلواني الشيبي)<br />
            هواتفنا: 01155175799 • 01117649159<br />
            <a
              href="https://wa.me/201018671000"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#8B0000", textDecoration: "none", fontWeight: 800, fontSize: "11px" }}
            >
              تم التطوير بواسطة شركة أوركا للحلول البرمجية والخدمات السحابية 🐋 (01018671000)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
