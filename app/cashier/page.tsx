"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import {
  RefreshCw, Search, Loader2, ShoppingBag, Printer,
  Store, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import ErpLayout from "@/components/ErpLayout";
import { CAIRO_DELIVERY_ZONES, ZoneItem, DEFAULT_ZONE } from "@/lib/zones";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address?: string;
  zone?: string;
  orderType?: "delivery" | "takeaway" | "dinein" | string;
  status: string;
  items: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

interface ProductSize {
  nameAr: string;
  nameEn?: string;
  price: number;
}

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  basePrice: number;
  image?: string | null;
  sizes?: string | null;
}

interface TicketItem {
  product: Product;
  qty: number;
  variantName?: string | null;
  unitPrice: number;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  new:       { color: "#93c5fd", bg: "rgba(23,37,84,0.7)",  border: "#1e40af" },
  preparing: { color: "#fcd34d", bg: "rgba(78,35,0,0.7)",   border: "#92400e" },
  ready:     { color: "#6ee7b7", bg: "rgba(6,46,37,0.7)",   border: "#065f46" },
  delivered: { color: "#86efac", bg: "rgba(5,46,22,0.7)",   border: "#166534" },
  cancelled: { color: "#fca5a5", bg: "rgba(69,10,10,0.7)",  border: "#991b1b" },
};

// ─── Inline Style Constants ───────────────────────────────
const S = {
  card: {
    background: "rgba(32,8,2,0.95)",
    border: "1px solid rgba(217,119,6,0.5)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  } as React.CSSProperties,
  input: {
    width: "100%",
    height: "36px",
    borderRadius: "10px",
    background: "#240803",
    border: "1px solid rgba(217,119,6,0.4)",
    padding: "0 10px",
    color: "#fff",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  inputMono: {
    width: "100%",
    height: "36px",
    borderRadius: "10px",
    background: "#240803",
    border: "1px solid rgba(217,119,6,0.4)",
    padding: "0 10px",
    color: "#fff",
    fontSize: "12px",
    outline: "none",
    fontFamily: "monospace",
    boxSizing: "border-box",
  } as React.CSSProperties,
  select: {
    width: "100%",
    height: "36px",
    borderRadius: "10px",
    background: "#240803",
    border: "1px solid rgba(217,119,6,0.4)",
    padding: "0 8px",
    color: "#fcd34d",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  activeTab: {
    background: "linear-gradient(135deg, #8B0000, #B91C1C)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(139,0,0,0.5)",
    border: "1px solid rgba(251,191,36,0.4)",
  } as React.CSSProperties,
  inactiveTab: {
    background: "transparent",
    color: "#d6d3d1",
    border: "1px solid transparent",
  } as React.CSSProperties,
};

export default function CashierPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, loading: authLoading } = useStaff();
  const { dir, t } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<"pos" | "history">("pos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const prevCount = React.useRef(0);

  // POS Ticket State
  const [ticketOrderType, setTicketOrderType] = useState<"takeaway" | "dinein" | "delivery">("takeaway");
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [ticketCustomerPhone, setTicketCustomerPhone] = useState("");
  const [ticketAddress, setTicketAddress] = useState("");
  const [ticketSelectedZone, setTicketSelectedZone] = useState<ZoneItem>(DEFAULT_ZONE);
  const [ticketPaymentMethod, setTicketPaymentMethod] = useState("cash");
  const [ticketNotes, setTicketNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  function getStatusLabel(status: string) {
    switch (status) {
      case "new": return t("جديد ⚡", "New ⚡");
      case "preparing": return t("يُحضَّر 👨‍🍳", "Preparing 👨‍🍳");
      case "ready": return t("جاهز 🛵", "Ready 🛵");
      case "delivered": return t("سُلِّم ✓", "Delivered ✓");
      case "cancelled": return t("ملغي ✕", "Cancelled ✕");
      default: return status;
    }
  }

  function getOrderTypeBadge(type?: string) {
    if (type === "takeaway") return { label: "تيك أواي 🥡", color: "#fcd34d", bg: "rgba(120,53,15,0.6)", border: "#92400e" };
    if (type === "dinein") return { label: "صالة 🍽️", color: "#c4b5fd", bg: "rgba(46,16,101,0.6)", border: "#6d28d9" };
    return { label: "دليفري 🛵", color: "#fca5a5", bg: "rgba(69,10,10,0.6)", border: "#991b1b" };
  }

  const fetchData = useCallback(async () => {
    try {
      const [ordRes, prodRes] = await Promise.all([fetch("/api/orders"), fetch("/api/products")]);
      const [ord, prod] = await Promise.all([ordRes.json(), prodRes.json()]);
      const ordList = Array.isArray(ord) ? ord : [];
      const newCount = ordList.filter((o: Order) => o.status === "new").length;
      if (newCount > prevCount.current) playSound("order");
      prevCount.current = newCount;
      setOrders(ordList);
      setProducts(Array.isArray(prod) ? prod : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !permissions.canViewOrders) {
        router.push("/login");
        return;
      }
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, permissions, router, fetchData]);

  function addToTicket(product: Product, size?: ProductSize) {
    playSound("click");
    setTicketItems((prev) => {
      const vName = size ? size.nameAr : null;
      const uPrice = size ? size.price : product.basePrice;
      const existing = prev.find((i) => i.product.id === product.id && i.variantName === vName);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id && i.variantName === vName ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1, variantName: vName, unitPrice: uPrice }];
    });
  }

  function removeFromTicket(product: Product, sizeName?: string | null) {
    playSound("click");
    setTicketItems((prev) =>
      prev
        .map((i) => (i.product.id === product.id && i.variantName === sizeName ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function deleteTicketItem(product: Product, sizeName?: string | null) {
    playSound("click");
    setTicketItems((prev) => prev.filter((i) => !(i.product.id === product.id && i.variantName === sizeName)));
  }

  function clearTicket() {
    playSound("click");
    setTicketItems([]);
    setTicketCustomerName("");
    setTicketCustomerPhone("");
    setTicketAddress("");
    setTicketNotes("");
  }

  async function submitAndPrintTicket() {
    if (ticketItems.length === 0 || submittingOrder) return;
    setSubmittingOrder(true);
    try {
      const subtotal = ticketItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const deliveryFee = ticketOrderType === "delivery" ? ticketSelectedZone.fee : 0;
      const total = subtotal + deliveryFee;
      const items = ticketItems.map((i) => ({
        productId: i.product.id,
        nameAr: i.variantName ? `${i.product.nameAr} (${i.variantName})` : i.product.nameAr,
        nameEn: i.variantName ? `${i.product.nameEn || i.product.nameAr} (${i.variantName})` : (i.product.nameEn || i.product.nameAr),
        qty: i.qty,
        unitPrice: i.unitPrice,
        selectedSize: i.variantName || null,
        extras: [],
      }));
      const finalName = ticketCustomerName.trim() || (ticketOrderType === "takeaway" ? "عميل تيك أواي كاونتر" : ticketOrderType === "dinein" ? "عميل صالة" : "عميل دليفري");
      const finalPhone = ticketCustomerPhone.trim() || "01155175799";
      const finalAddress = ticketOrderType === "delivery" ? (ticketAddress.trim() || ticketSelectedZone.nameAr) : "فرع حدائق القبة - شارع مصر والسودان";
      const finalZone = ticketOrderType === "delivery" ? ticketSelectedZone.nameAr : (ticketOrderType === "takeaway" ? "استلام فرع (تيك أواي)" : "صالة");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: finalName, phone: finalPhone, address: finalAddress, zone: finalZone,
          orderType: ticketOrderType, status: "new", paymentMethod: ticketPaymentMethod,
          notes: ticketNotes, items, subtotal, deliveryFee, total,
        }),
      });

      if (res.ok) {
        const createdOrder = await res.json();
        playSound("order");
        if (createdOrder?.id) window.open(`/receipt/${createdOrder.id}`, "_blank");
        clearTicket();
        await fetchData();
      }
    } finally {
      setSubmittingOrder(false);
    }
  }

  const categories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products
    .filter((p) => activeCategory === "الكل" || p.category === activeCategory)
    .filter((p) => !menuSearchQuery.trim() || p.nameAr.includes(menuSearchQuery.trim()) || p.nameEn.toLowerCase().includes(menuSearchQuery.toLowerCase()));

  const ticketSubtotal = ticketItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const ticketDeliveryFee = ticketOrderType === "delivery" ? ticketSelectedZone.fee : 0;
  const ticketGrandTotal = ticketSubtotal + ticketDeliveryFee;
  const ticketItemCount = ticketItems.reduce((s, i) => s + i.qty, 0);

  const displayOrders = orders
    .filter((o) => {
      if (filterStatus === "active") return ["new", "preparing", "ready"].includes(o.status);
      if (filterStatus !== "all") return o.status === filterStatus;
      return true;
    })
    .filter((o) => !search || o.orderNumber.includes(search) || o.customerName.includes(search) || o.phone.includes(search))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    new: orders.filter((o) => o.status === "new").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    total: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0),
  };

  if (authLoading || loading) {
    return (
      <ErpLayout activeItem="cashier">
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 style={{ animation: "spin 1s linear infinite", color: "#F59E0B" }} size={42} />
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout activeItem="cashier">
      <div dir={dir} style={{ color: "#f5f0eb", fontFamily: "var(--font-cairo), system-ui, sans-serif" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid rgba(198,135,62,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #8B0000, #5A0E06)", border: "1px solid rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🧇
            </div>
            <div>
              <h1 style={{ fontSize: "19px", fontWeight: 900, color: "#FFFFFF", margin: 0, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {t("ماكينة الكاشير والبيع المباشر (POS)", "Direct Counter Sale & POS")}
                <span style={{ fontSize: "11px", background: "#8B0000", color: "#fde68a", padding: "2px 10px", borderRadius: "100px", fontWeight: 700 }}>
                  فرع حدائق القبة
                </span>
              </h1>
              <p style={{ fontSize: "12px", color: "rgba(253,230,138,0.75)", margin: "3px 0 0" }}>
                {t("بيع مباشر وتيك أواي (0 ج توصيل) • تسجيل فوري • طباعة ريسيت 80mm", "Instant counter sales • 0 delivery fee • 80mm thermal print")}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", padding: "4px", background: "#1a0401", border: "1px solid rgba(198,135,62,0.4)", borderRadius: "14px" }}>
            {[
              { id: "pos", label: "ماكينة البيع المباشر (POS)", icon: <Store size={14} /> },
              { id: "history", label: `فواتير اليوم (${stats.total} ج)`, icon: <ShoppingBag size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveMainTab(tab.id as "pos" | "history"); playSound("click"); }}
                style={{
                  padding: "7px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 900,
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "all 0.15s",
                  ...(activeMainTab === tab.id ? S.activeTab : S.inactiveTab),
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════ POS MODE ══════════════════════════ */}
        {activeMainTab === "pos" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 400px) 1fr", gap: "20px", alignItems: "start" }}>

            {/* ── LEFT: Ticket Panel ── */}
            <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: "14px", minHeight: "680px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Ticket Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid rgba(198,135,62,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🧾</span>
                    <span style={{ fontWeight: 900, color: "#fff", fontSize: "14px" }}>فاتورة الكاونتر الحالية</span>
                    <span style={{ fontSize: "11px", background: "rgba(245,158,11,0.15)", color: "#fcd34d", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", border: "1px solid rgba(245,158,11,0.3)" }}>
                      {ticketItemCount} أصناف
                    </span>
                  </div>
                  {ticketItems.length > 0 && (
                    <button
                      onClick={clearTicket}
                      style={{ background: "none", border: "none", color: "#f87171", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Trash2 size={13} /> إفراغ
                    </button>
                  )}
                </div>

                {/* Order Type Tabs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "4px", background: "#140401", borderRadius: "14px", border: "1px solid rgba(120,40,0,0.6)" }}>
                  {[
                    { id: "takeaway", emoji: "🥡", label: "تيك أواي", sub: "بيع مباشر (0ج)" },
                    { id: "dinein",   emoji: "🍽️", label: "صالة",     sub: "داخل المحل (0ج)" },
                    { id: "delivery", emoji: "🛵", label: "دليفري",   sub: "توصيل القاهرة" },
                  ].map((ot) => (
                    <button
                      key={ot.id}
                      type="button"
                      onClick={() => { setTicketOrderType(ot.id as typeof ticketOrderType); playSound("click"); }}
                      style={{
                        padding: "8px 4px", borderRadius: "10px", fontSize: "12px", fontWeight: 900,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                        cursor: "pointer", transition: "all 0.15s",
                        ...(ticketOrderType === ot.id
                          ? { background: "linear-gradient(135deg, #8B0000, #B91C1C)", color: "#fff", border: "1px solid rgba(251,191,36,0.5)", boxShadow: "0 2px 8px rgba(139,0,0,0.4)" }
                          : { background: "transparent", color: "#a8a29e", border: "1px solid transparent" }),
                      }}
                    >
                      <span>{ot.emoji} {ot.label}</span>
                      <span style={{ fontSize: "10px", opacity: 0.8, fontWeight: 400 }}>{ot.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Customer Fields */}
                {ticketOrderType === "delivery" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#170401", padding: "12px", borderRadius: "14px", border: "1px solid rgba(198,135,62,0.2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <input value={ticketCustomerName} onChange={(e) => setTicketCustomerName(e.target.value)} placeholder="اسم العميل *" style={S.input} />
                      <input value={ticketCustomerPhone} onChange={(e) => setTicketCustomerPhone(e.target.value)} placeholder="رقم الموبايل *" dir="ltr" style={S.inputMono} />
                    </div>
                    <select value={ticketSelectedZone.code} onChange={(e) => { const z = CAIRO_DELIVERY_ZONES.find((x) => x.code === e.target.value); if (z) setTicketSelectedZone(z); }} style={S.select}>
                      {CAIRO_DELIVERY_ZONES.map((z) => (
                        <option key={z.code} value={z.code} style={{ background: "#1A0400", color: "#fff" }}>
                          {z.nameAr} (+{z.fee} ج توصيل)
                        </option>
                      ))}
                    </select>
                    <input value={ticketAddress} onChange={(e) => setTicketAddress(e.target.value)} placeholder="العنوان بالتفصيل..." style={S.input} />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px" }}>
                    <input value={ticketCustomerName} onChange={(e) => setTicketCustomerName(e.target.value)} placeholder="اسم الزبون (اختياري للريسيت)" style={{ ...S.input, fontSize: "11px" }} />
                    <input value={ticketCustomerPhone} onChange={(e) => setTicketCustomerPhone(e.target.value)} placeholder="موبايل" dir="ltr" style={{ ...S.inputMono, width: "120px", fontSize: "11px" }} />
                  </div>
                )}

                {/* Ticket Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto" }}>
                  {ticketItems.length === 0 ? (
                    <div style={{ padding: "40px 16px", textAlign: "center", border: "2px dashed rgba(198,135,62,0.3)", borderRadius: "16px", background: "rgba(23,4,1,0.5)" }}>
                      <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🧇</span>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>الفاتورة جاهزة لطلب العميل</p>
                      <p style={{ fontSize: "11px", color: "#78716c", margin: 0 }}>اضغط على أي صنف من المنيو لإضافته فوراً للفاتورة 👈</p>
                    </div>
                  ) : (
                    ticketItems.map((item, idx) => (
                      <div key={idx} style={{ padding: "10px 12px", borderRadius: "12px", background: "#170401", border: "1px solid rgba(120,40,0,0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product.nameAr}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                            {item.variantName && (
                              <span style={{ fontSize: "10px", background: "#8B0000", color: "#fde68a", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>{item.variantName}</span>
                            )}
                            <span style={{ fontSize: "11px", color: "#fcd34d", fontFamily: "monospace", fontWeight: 700 }}>{item.unitPrice} ج</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                          <button type="button" onClick={() => removeFromTicket(item.product, item.variantName)} style={{ width: "24px", height: "24px", borderRadius: "7px", background: "#290802", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                          <span style={{ fontFamily: "monospace", fontWeight: 900, color: "#fff", fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                          <button type="button" onClick={() => addToTicket(item.product, item.variantName ? { nameAr: item.variantName, price: item.unitPrice } : undefined)} style={{ width: "24px", height: "24px", borderRadius: "7px", background: "#8B0000", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#fcd34d", fontSize: "12px", minWidth: "40px", textAlign: "end" }}>{item.unitPrice * item.qty}ج</span>
                          <button type="button" onClick={() => deleteTicketItem(item.product, item.variantName)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px", display: "flex" }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals + Checkout */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid rgba(198,135,62,0.25)" }}>
                <div style={{ background: "#140401", padding: "12px", borderRadius: "14px", border: "1px solid rgba(120,40,0,0.8)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#a8a29e" }}>
                    <span>المجموع الفرعي ({ticketItemCount} قطعة)</span>
                    <span style={{ fontFamily: "monospace", color: "#fff" }}>{ticketSubtotal} ج</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#a8a29e" }}>
                    <span>خدمة التوصيل ({ticketOrderType === "delivery" ? ticketSelectedZone.nameAr : "بيع مباشر"})</span>
                    <span style={{ fontFamily: "monospace", color: "#6ee7b7", fontWeight: 700 }}>
                      {ticketOrderType === "delivery" ? `${ticketDeliveryFee} ج` : "0 ج (مجاناً)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#fcd34d", fontSize: "17px", paddingTop: "6px", borderTop: "1px solid rgba(198,135,62,0.2)" }}>
                    <span>المطلوب سداده</span>
                    <span style={{ fontFamily: "monospace" }}>{ticketGrandTotal} ج.م</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {[{ id: "cash", label: "كاش 💵" }, { id: "instapay", label: "إنستاباي ⚡" }, { id: "card", label: "كارت 💳" }].map((pm) => (
                    <button
                      key={pm.id} type="button"
                      onClick={() => { setTicketPaymentMethod(pm.id); playSound("click"); }}
                      style={{
                        padding: "8px 4px", borderRadius: "10px", fontSize: "12px", fontWeight: 900, cursor: "pointer",
                        ...(ticketPaymentMethod === pm.id
                          ? { background: "#8B0000", color: "#fff", border: "1px solid rgba(251,191,36,0.5)", boxShadow: "0 2px 8px rgba(139,0,0,0.4)" }
                          : { background: "#180501", color: "#a8a29e", border: "1px solid rgba(60,20,0,0.8)" }),
                      }}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {/* Big Print Button */}
                <button
                  type="button"
                  onClick={submitAndPrintTicket}
                  disabled={ticketItems.length === 0 || submittingOrder}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(52,211,153,0.4)",
                    background: ticketItems.length === 0 ? "#1a0401" : "linear-gradient(135deg, #059669, #10B981, #047857)",
                    color: ticketItems.length === 0 ? "#4b5563" : "#fff",
                    fontWeight: 900, fontSize: "14px", cursor: ticketItems.length === 0 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: ticketItems.length > 0 ? "0 4px 20px rgba(5,150,105,0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {submittingOrder ? <Loader2 style={{ animation: "spin 1s linear infinite" }} size={18} /> : <Printer size={18} />}
                  <span>حفظ وطباعة الفاتورة للعميل (80mm)</span>
                  {ticketItems.length > 0 && <span style={{ fontFamily: "monospace" }}>({ticketGrandTotal} ج)</span>}
                </button>
              </div>
            </div>

            {/* ── RIGHT: Menu Catalog ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Category Filter */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat} type="button"
                    onClick={() => { setActiveCategory(cat); playSound("click"); }}
                    style={{
                      padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer",
                      ...(activeCategory === cat
                        ? { background: "linear-gradient(135deg, #8B0000, #B91C1C)", color: "#fff", border: "1px solid rgba(251,191,36,0.4)", boxShadow: "0 2px 8px rgba(139,0,0,0.4)" }
                        : { background: "#200802", color: "#d6d3d1", border: "1px solid rgba(198,135,62,0.3)" }),
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [dir === "rtl" ? "right" : "left"]: "12px", color: "#6b7280" }} />
                <input
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="ابحث في أصناف المنيو..."
                  style={{ ...S.input, height: "40px", [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px" }}
                />
              </div>

              {/* Products Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", maxHeight: "640px", overflowY: "auto" }}>
                {filteredProducts.map((p) => {
                  const parsedSizes: ProductSize[] = p.sizes
                    ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes)
                    : [];

                  return (
                    <div
                      key={p.id}
                      style={{ padding: "12px", borderRadius: "16px", background: "#200802", border: "1px solid rgba(198,135,62,0.3)", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "border-color 0.15s" }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px" }}>
                          <span style={{ fontWeight: 900, color: "#fff", fontSize: "13px", lineHeight: 1.4 }}>{p.nameAr}</span>
                          <span style={{ fontSize: "10px", background: "rgba(120,53,15,0.7)", color: "#fcd34d", padding: "2px 6px", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{p.category}</span>
                        </div>
                      </div>

                      {parsedSizes && parsedSizes.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {parsedSizes.map((sz) => {
                            const inTicket = ticketItems.find((i) => i.product.id === p.id && i.variantName === sz.nameAr);
                            const szLabel = sz.nameAr.includes("ساندوتش") ? "🥪 ساندوتش"
                              : sz.nameAr.includes("مفتوح") ? "🧇 مفتوح"
                              : sz.nameAr.includes("15") ? "🥞 15 قطعة"
                              : sz.nameAr.includes("25") ? "🥞 25 قطعة"
                              : sz.nameAr.includes("وسط") || sz.nameAr.includes("M") ? "🥤 وسط M"
                              : sz.nameAr.includes("كبير") || sz.nameAr.includes("L") ? "🥤 كبير L"
                              : sz.nameAr;
                            return (
                              <button
                                key={sz.nameAr} type="button"
                                onClick={() => addToTicket(p, sz)}
                                style={{
                                  padding: "8px 4px", borderRadius: "10px", cursor: "pointer",
                                  display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                                  transition: "all 0.15s",
                                  ...(inTicket
                                    ? { background: "#8B0000", border: "1px solid #fbbf24", boxShadow: "0 2px 8px rgba(139,0,0,0.5)" }
                                    : { background: "#140401", border: "1px solid rgba(198,135,62,0.35)" }),
                                }}
                              >
                                <span style={{ fontSize: "11px", fontWeight: 900, color: inTicket ? "#fff" : "#e7e5e4" }}>{szLabel}</span>
                                <span style={{ color: "#fcd34d", fontFamily: "monospace", fontWeight: 900, fontSize: "12px" }}>{sz.price} ج</span>
                                {inTicket && <span style={{ fontSize: "9px", background: "#fff", color: "#450a0a", padding: "1px 5px", borderRadius: "100px", fontWeight: 900 }}>({inTicket.qty}) ✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(60,20,0,0.6)" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 900, color: "#fcd34d", fontSize: "14px" }}>{p.basePrice} ج.م</span>
                          <button
                            type="button"
                            onClick={() => addToTicket(p)}
                            style={{ padding: "6px 12px", borderRadius: "10px", background: "linear-gradient(135deg, #8B0000, #B91C1C)", border: "none", color: "#fff", fontWeight: 900, fontSize: "12px", cursor: "pointer" }}
                          >
                            + أضف
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ HISTORY MODE ══════════════════════════ */}
        {activeMainTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 240px" }}>
                <Search size={15} style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [dir === "rtl" ? "right" : "left"]: "12px", color: "#6b7280" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الطلب، اسم العميل، الهاتف..."
                  style={{ ...S.input, height: "40px", [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "4px", background: "#200802", border: "1px solid rgba(198,135,62,0.3)", borderRadius: "12px", padding: "4px" }}>
                {[{ id: "active", label: "النشط" }, { id: "delivered", label: "مسلَّم" }, { id: "cancelled", label: "ملغي" }, { id: "all", label: "الكل" }].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFilterStatus(s.id)}
                    style={{
                      padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none",
                      ...(filterStatus === s.id
                        ? { background: "linear-gradient(135deg, #8B0000, #B91C1C)", color: "#fff" }
                        : { background: "transparent", color: "#a8a29e" }),
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={fetchData} style={{ padding: "10px", borderRadius: "10px", background: "#200802", border: "1px solid rgba(198,135,62,0.3)", color: "#fcd34d", cursor: "pointer", display: "flex" }}>
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Orders Table */}
            <div style={{ background: "rgba(32,8,2,0.9)", border: "1px solid rgba(198,135,62,0.3)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(198,135,62,0.25)", background: "#290903" }}>
                      {["رقم الفاتورة", "نوع الطلب", "العميل", "الحالة", "الإجمالي", "طباعة ريسيت 80mm"].map((h, i) => (
                        <th key={i} style={{ padding: "12px 14px", textAlign: i === 4 ? "left" : i === 5 ? "center" : "right", fontWeight: 700, color: "rgba(253,230,138,0.8)", fontSize: "12px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>لا توجد فواتير مطابقة</td>
                      </tr>
                    ) : (
                      displayOrders.map((order) => {
                        const colorCfg = STATUS_COLORS[order.status] || STATUS_COLORS.new;
                        const typeBadge = getOrderTypeBadge(order.orderType);
                        return (
                          <tr key={order.id} style={{ borderBottom: "1px solid rgba(198,135,62,0.1)", transition: "background 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52,11,4,0.7)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "12px", color: "#fcd34d", fontWeight: 700 }}>{order.orderNumber}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, color: typeBadge.color, background: typeBadge.bg, border: `1px solid ${typeBadge.border}` }}>
                                {typeBadge.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <p style={{ fontWeight: 700, color: "#fff", fontSize: "13px", margin: 0 }}>{order.customerName}</p>
                              <p style={{ fontSize: "11px", color: "#78716c", fontFamily: "monospace", margin: "2px 0 0" }}>{order.phone}</p>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "8px", fontWeight: 700, color: colorCfg.color, background: colorCfg.bg, border: `1px solid ${colorCfg.border}` }}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "left", fontFamily: "monospace", fontWeight: 900, color: "#fcd34d" }}>{order.total} ج.م</td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => window.open(`/receipt/${order.id}`, "_blank")}
                                style={{ padding: "6px 14px", borderRadius: "10px", background: "#8B0000", border: "1px solid rgba(251,191,36,0.35)", color: "#fff", fontSize: "12px", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                              >
                                <Printer size={13} /> طباعة
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </ErpLayout>
  );
}
