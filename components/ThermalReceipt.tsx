"use client";

import React from "react";
import { Printer, X, Check, Phone, MapPin, User, Bike, Clock, Tag } from "lucide-react";
import { playSound } from "@/lib/sounds";

export interface PrintableOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address?: string | null;
  zone?: string | null;
  orderType?: string | null; // delivery, takeaway, dinein
  status: string;
  items: string; // JSON
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string | null;
  captainName?: string | null;
  captainPhone?: string | null;
  timeline?: string | null;
  createdAt: string;
}

interface ThermalReceiptModalProps {
  order: PrintableOrder | null;
  onClose: () => void;
}

export function printThermalReceipt(order: PrintableOrder) {
  playSound("click");
  const parsedItems: Array<{ nameAr?: string; nameEn?: string; qty: number; unitPrice: number; extras?: string[] }> = (() => {
    try {
      return typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch {
      return [];
    }
  })();

  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  const formattedTime = dateObj.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  const isTakeaway = order.orderType === "takeaway";
  const isDinein = order.orderType === "dinein";
  const isDelivery = !isTakeaway && !isDinein;

  const orderTypeBadge = isTakeaway
    ? "🥡 طلب استلام من الفرع (تيك أواي)"
    : isDinein
    ? "🍽️ طلب تناول بالصالة (داين إن)"
    : "🛵 طلب توصيل سريع (دليفري)";

  const paymentText =
    order.paymentMethod === "cash" ? "كاش عند الاستلام 💵" :
    order.paymentMethod === "instapay" ? "إنستاباي (تم التحويل) ⚡" :
    order.paymentMethod === "wallet" ? "محفظة كاش 📱" : "فيزا / كارت 💳";

  const isOrderEdited = Boolean(order.timeline && order.timeline.includes("edited"));

  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    alert("برجاء السماح بالنوافذ المنبثقة (Popups) لطباعة الريسيت");
    return;
  }

  const receiptHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة ${order.orderNumber}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 78mm;
          margin: 0 auto;
          padding: 8px 6px;
          font-family: 'Cairo', 'Courier New', monospace, Tahoma, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: #000000;
          background: #ffffff;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: 16px; }
        .text-xl { font-size: 18px; }
        .divider {
          border-top: 1px dashed #000000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 2px solid #000000;
          margin: 8px 0;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
        }
        .items-table th {
          border-bottom: 1px solid #000000;
          padding: 4px 0;
          font-size: 12px;
        }
        .items-table td {
          padding: 4px 0;
          vertical-align: top;
        }
        .extra-line {
          font-size: 11px;
          padding-right: 14px;
        }
        .total-box {
          font-size: 16px;
          font-weight: 900;
          padding: 6px 0;
        }
        .footer-note {
          font-size: 11px;
          text-align: center;
          margin-top: 8px;
        }
      </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500);">
      <div class="text-center">
        <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo.jpg" alt="Waffle House" style="width: 44mm; max-width: 170px; height: auto; margin: 0 auto 6px; display: block; border-radius: 50%;" />
        <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">WAFFLE HOUSE • وافل هاوس</div>
        <div style="font-size: 11px; font-weight: 700; color: #333;">SWEET WE HAVE SWEETEST</div>
        <div style="font-size: 11px; color: #222; margin-top: 2px;">حدائق القبة - ش مصر والسودان - بجوار حلواني الشيبي</div>
        <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">هاتف: 01155175799 - 01117649159</div>
      </div>

      <div class="double-divider"></div>

      <!-- Prominent Order Type Banner -->
      <div style="background: #000000; color: #ffffff; text-align: center; font-weight: 900; font-size: 14px; padding: 4px 0; letter-spacing: 0.5px;">
        *** ${orderTypeBadge} ***
      </div>

      ${isOrderEdited ? `
        <div style="background: #333333; color: #ffffff; text-align: center; font-weight: 900; font-size: 12px; padding: 3px 0; margin-top: 3px;">
          ⚠️ فاتورة معدّلة (MODIFIED)
        </div>
      ` : ""}

      <div class="divider"></div>

      <div class="flex-between font-bold">
        <span>رقم الأوردر:</span>
        <span style="font-size: 16px;">${order.orderNumber}</span>
      </div>
      <div class="flex-between" style="font-size: 12px;">
        <span>التاريخ: ${formattedDate}</span>
        <span>الوقت: ${formattedTime}</span>
      </div>

      <div class="divider"></div>

      <!-- Customer Details -->
      <div>
        <div><span class="font-bold">العميل:</span> ${order.customerName}</div>
        <div><span class="font-bold">الموبايل:</span> ${order.phone}</div>
        ${isDelivery ? `
          <div><span class="font-bold">المنطقة:</span> ${order.zone || "حدائق القبة"}</div>
          ${order.address ? `<div><span class="font-bold">العنوان:</span> ${order.address}</div>` : ""}
        ` : `
          <div style="color: #047857; font-weight: bold;">الاستلام: فرع حدائق القبة (شارع مصر والسودان)</div>
        `}
        ${order.notes ? `<div><span class="font-bold">ملاحظات:</span> ⚠️ ${order.notes}</div>` : ""}
      </div>

      <!-- Captain Details if Delivery -->
      ${isDelivery && order.captainName ? `
        <div class="divider"></div>
        <div style="background: #f0f0f0; padding: 4px; border: 1px dashed #000;">
          <div class="font-bold">🛵 كابتن التوصيل:</div>
          <div>${order.captainName} ${order.captainPhone ? `(${order.captainPhone})` : ""}</div>
        </div>
      ` : ""}

      <div class="double-divider"></div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-right" style="width: 55%;">الصنف والحجم</th>
            <th class="text-center" style="width: 20%;">الكمية</th>
            <th class="text-left" style="width: 25%;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${parsedItems.map((item) => `
            <tr>
              <td class="text-right font-bold">${item.nameAr || item.nameEn || "صنف"}</td>
              <td class="text-center font-bold">× ${item.qty}</td>
              <td class="text-left font-bold">${item.unitPrice * item.qty} ج</td>
            </tr>
            ${item.extras && item.extras.length > 0 ? `
              <tr>
                <td colspan="3" class="extra-line">+ ${item.extras.join(" + ")}</td>
              </tr>
            ` : ""}
          `).join("")}
        </tbody>
      </table>

      <div class="divider"></div>

      <!-- Financials -->
      <div class="flex-between">
        <span>المجموع الفرعي:</span>
        <span>${order.subtotal} ج</span>
      </div>
      <div class="flex-between">
        <span>${isDelivery ? `خدمة التوصيل (${order.zone || "حدائق القبة"}):` : "رسوم التوصيل (استلام / صالة):"}</span>
        <span>${isDelivery ? `${order.deliveryFee} ج` : "0 ج (مجاناً)"}</span>
      </div>

      <div class="double-divider"></div>

      <div class="flex-between total-box">
        <span>المطلوب تحصيله:</span>
        <span style="font-size: 19px;">${order.total} ج.م</span>
      </div>

      <div class="flex-between" style="font-size: 12px; margin-top: 4px;">
        <span>طريقة الدفع:</span>
        <span class="font-bold">${paymentText}</span>
      </div>

      <div class="divider"></div>

      <div class="text-center" style="margin-top: 8px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://waffle-house-alpha.vercel.app') + '/receipt/' + order.id)}" style="width: 28mm; height: 28mm; margin: 0 auto 4px; display: block;" alt="Receipt QR" />
        <div style="font-size: 10px; font-weight: bold;">📱 امسح الكود لتتبع الفاتورة والأوردر رقمياً</div>
      </div>

      <div class="footer-note">
        شكراً لطلبكم من Waffle House 🧇✨<br/>
        حدائق القبة - ش مصر والسودان (بجوار حلواني الشيبي)<br/>
        *** برمجة وتطوير: شركة أوركا للحلول البرمجية (01018671000) ***
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}

export default function ThermalReceiptModal({ order, onClose }: ThermalReceiptModalProps) {
  if (!order) return null;

  const parsedItems: Array<{ nameAr?: string; nameEn?: string; qty: number; unitPrice: number; extras?: string[] }> = (() => {
    try {
      return typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch {
      return [];
    }
  })();

  const isTakeaway = order.orderType === "takeaway";
  const isDinein = order.orderType === "dinein";
  const isDelivery = !isTakeaway && !isDinein;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          maxHeight: "92vh",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8DAC8",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(43,23,14,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #E8DAC8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FAF6EE",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(198, 135, 62, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C6873E",
              }}
            >
              <Printer size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#2B170E" }}>
                معاينة ريسيت الطابعة الحرارية 🧾
              </h3>
              <span style={{ fontSize: "12px", color: "#7E5E49" }}>مقاس رول 80mm المعتمد • وافل هاوس</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#7E5E49",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Receipt Preview (Paper Style) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", backgroundColor: "#F8F4EC" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#180e06",
              borderRadius: "14px",
              padding: "24px 20px",
              fontFamily: "'Courier New', monospace, sans-serif",
              fontSize: "13px",
              lineHeight: 1.5,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Store Banner */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <img src="/logo.jpg" alt="Waffle House" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px", display: "block", border: "2px solid #5a3825" }} />
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#180e06" }}>WAFFLE HOUSE (وافل هاوس)</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8B0000" }}>SWEET WE HAVE SWEETEST</div>
              <div style={{ fontSize: "11.5px", color: "#444", fontWeight: 700, marginTop: "2px" }}>حدائق القبة - ش مصر والسودان - بجوار حلواني الشيبي</div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "2px" }}>هاتف: 01155175799 - 01117649159</div>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "10px 0" }} />

            {/* Order Type Banner */}
            <div
              style={{
                backgroundColor: isTakeaway ? "#047857" : isDinein ? "#7c2d12" : "#1e293b",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: 900,
                fontSize: "13px",
                padding: "6px 8px",
                borderRadius: "6px",
                marginBottom: "8px",
              }}
            >
              {isTakeaway ? "🥡 طلب استلام من الفرع (تيك أواي)" : isDinein ? "🍽️ طلب صالة" : "🛵 طلب توصيل سريع (دليفري)"}
            </div>

            {Boolean(order.timeline && order.timeline.includes("edited")) && (
              <div
                style={{
                  background: "#180e06",
                  color: "#d99b56",
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                ⚠️ فاتورة معدّلة (MODIFIED RECEIPT)
              </div>
            )}

            {/* Order & Date */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
              <span>رقم الفاتورة:</span>
              <span style={{ fontSize: "14px" }}>{order.orderNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555" }}>
              <span>التاريخ: {new Date(order.createdAt).toLocaleDateString("ar-EG")}</span>
              <span>الوقت: {new Date(order.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            <div style={{ borderTop: "1px dashed #666", margin: "10px 0" }} />

            {/* Customer */}
            <div style={{ fontSize: "12.5px" }}>
              <div><b>العميل:</b> {order.customerName}</div>
              <div><b>الموبايل:</b> {order.phone}</div>
              {isDelivery ? (
                <>
                  <div><b>المنطقة:</b> {order.zone || "حدائق القبة"}</div>
                  {order.address && <div><b>العنوان:</b> {order.address}</div>}
                </>
              ) : (
                <div style={{ color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                  📍 استلام من فرع حدائق القبة (شارع مصر والسودان)
                </div>
              )}
              {order.notes && <div style={{ color: "#b45309" }}><b>ملاحظات:</b> 📝 {order.notes}</div>}
            </div>

            {/* Captain if Delivery */}
            {isDelivery && order.captainName && (
              <div style={{ marginTop: "8px", padding: "6px", backgroundColor: "#f3f4f6", borderRadius: "6px", border: "1px dashed #999" }}>
                <b>🛵 كابتن التوصيل:</b> {order.captainName} {order.captainPhone ? `(${order.captainPhone})` : ""}
              </div>
            )}

            <div style={{ borderTop: "2px solid #000", margin: "12px 0 8px" }} />

            {/* Items */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333", fontSize: "12px" }}>
                  <th style={{ textAlign: "right", paddingBottom: "4px" }}>الصنف والحجم</th>
                  <th style={{ textAlign: "center", paddingBottom: "4px" }}>الكمية</th>
                  <th style={{ textAlign: "left", paddingBottom: "4px" }}>السعر</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr>
                      <td style={{ fontWeight: 700, paddingTop: "6px" }}>{item.nameAr || item.nameEn}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, paddingTop: "6px" }}>× {item.qty}</td>
                      <td style={{ textAlign: "left", fontWeight: 700, paddingTop: "6px" }}>{item.unitPrice * item.qty} ج</td>
                    </tr>
                    {item.extras && item.extras.length > 0 && (
                      <tr>
                        <td colSpan={3} style={{ fontSize: "11px", color: "#666", paddingRight: "10px" }}>
                          + {item.extras.join(" + ")}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #666", margin: "12px 0 8px" }} />

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>المجموع الفرعي:</span>
              <span>{order.subtotal} ج</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{isDelivery ? "خدمة التوصيل:" : "رسوم الاستلام:"}</span>
              <span>{isDelivery ? `${order.deliveryFee} ج` : "0 ج (استلام من الفرع)"}</span>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "17px", fontWeight: 900 }}>
              <span>المطلوب تحصيله:</span>
              <span>{order.total} ج.م</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
              <span>طريقة الدفع:</span>
              <span style={{ fontWeight: 700 }}>
                {order.paymentMethod === "cash" ? "كاش عند الاستلام 💵" :
                 order.paymentMethod === "instapay" ? "إنستاباي ⚡" :
                 order.paymentMethod === "wallet" ? "محفظة كاش 📱" : "فيزا / كارت 💳"}
              </span>
            </div>

            <div style={{ borderTop: "1px dashed #666", margin: "12px 0 8px" }} />

            {/* Live Digital Receipt QR Code */}
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                  (typeof window !== "undefined" ? window.location.origin : "https://waffle-house-alpha.vercel.app") + "/receipt/" + order.id
                )}`}
                alt="QR Code"
                style={{ width: "95px", height: "95px", margin: "0 auto 4px", display: "block" }}
              />
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#444" }}>
                📱 امسح الكود لتتبع الفاتورة والأوردر رقمياً
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #666", margin: "8px 0" }} />

            <div style={{ textAlign: "center", fontSize: "11px", color: "#555" }}>
              شكراً لطلبكم من Waffle House 🧇✨<br/>
              حدائق القبة - ش مصر والسودان (بجوار حلواني الشيبي)<br/>
              هواتفنا: 01155175799 • 01117649159<br/>
              برمجة وتطوير: شركة أوركا للحلول البرمجية (01018671000)
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #E8DAC8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            backgroundColor: "#FAF6EE",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              backgroundColor: "transparent",
              border: "1px solid #E8DAC8",
              color: "#7E5E49",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>

          <button
            onClick={() => printThermalReceipt(order)}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8B0000, #991B1B)",
              border: "none",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(139, 0, 0, 0.3)",
            }}
          >
            <Printer size={18} />
            <span>طباعة الريسيت الحراري (80mm) 🖨️</span>
          </button>
        </div>
      </div>
    </div>
  );
}
