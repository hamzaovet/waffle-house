"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import {
  Plus, RefreshCw, Search, Loader2, CheckCircle2, X, Clock,
  ShoppingBag, Truck, Phone, Printer, Utensils, Store, Bike,
  Trash2, CreditCard, DollarSign, Zap, ArrowRight, User
} from "lucide-react";
import Link from "next/link";
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

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new:       { color: "text-blue-300",    bg: "bg-blue-950/70 border-blue-800" },
  preparing: { color: "text-amber-300",   bg: "bg-amber-950/70 border-amber-800" },
  ready:     { color: "text-emerald-300", bg: "bg-emerald-950/70 border-emerald-800" },
  delivered: { color: "text-green-300",   bg: "bg-green-950/70 border-green-800" },
  cancelled: { color: "text-red-300",     bg: "bg-red-950/70 border-red-800" },
};

export default function CashierPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, loading: authLoading, currentUser } = useStaff();
  const { lang, toggleLang, dir, t } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<"pos" | "history">("pos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const prevCount = React.useRef(0);

  // ── POS Live Ticket State (Direct Walk-in / Counter Sale) ──
  const [ticketOrderType, setTicketOrderType] = useState<"takeaway" | "dinein" | "delivery">("takeaway");
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [ticketCustomerPhone, setTicketCustomerPhone] = useState("");
  const [ticketAddress, setTicketAddress] = useState("");
  const [ticketSelectedZone, setTicketSelectedZone] = useState<ZoneItem>(DEFAULT_ZONE);
  const [ticketPaymentMethod, setTicketPaymentMethod] = useState("cash");
  const [ticketNotes, setTicketNotes] = useState("");

  // Category and Product Filter in POS Menu
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
    if (type === "takeaway") return { label: "استلام فرع (تيك أواي) 🥡", color: "bg-amber-900/60 text-amber-200 border-amber-700" };
    if (type === "dinein") return { label: "صالة 🍽️", color: "bg-purple-900/60 text-purple-200 border-purple-700" };
    return { label: "توصيل سريع 🛵", color: "bg-red-900/60 text-red-200 border-red-700" };
  }

  const fetchData = useCallback(async () => {
    try {
      const [ordRes, prodRes] = await Promise.all([fetch("/api/orders"), fetch("/api/products")]);
      const [ord, prod] = await Promise.all([ordRes.json(), prodRes.json()]);
      const ordList = Array.isArray(ord) ? ord : [];

      // Alert sound on new incoming orders
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

  // Add Item or Variant directly to ticket
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
        .map((i) => {
          if (i.product.id === product.id && i.variantName === sizeName) {
            return { ...i, qty: i.qty - 1 };
          }
          return i;
        })
        .filter((i) => i.qty > 0)
    );
  }

  function deleteTicketItem(product: Product, sizeName?: string | null) {
    playSound("click");
    setTicketItems((prev) =>
      prev.filter((i) => !(i.product.id === product.id && i.variantName === sizeName))
    );
  }

  function clearTicket() {
    playSound("click");
    setTicketItems([]);
    setTicketCustomerName("");
    setTicketCustomerPhone("");
    setTicketAddress("");
    setTicketNotes("");
  }

  // Submit and Instant Print Receipt
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
          customerName: finalName,
          phone: finalPhone,
          address: finalAddress,
          zone: finalZone,
          orderType: ticketOrderType,
          status: "delivered", // Counter takeaway is settled on the spot
          paymentMethod: ticketPaymentMethod,
          notes: ticketNotes,
          items,
          subtotal,
          deliveryFee,
          total,
        }),
      });

      if (res.ok) {
        const createdOrder = await res.json();
        playSound("order");

        // Immediately open thermal receipt for auto-print
        if (createdOrder?.id) {
          window.open(`/receipt/${createdOrder.id}`, "_blank");
        }

        clearTicket();
        await fetchData();
      }
    } finally {
      setSubmittingOrder(false);
    }
  }

  // Filter products by category and search
  const categories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products
    .filter((p) => activeCategory === "الكل" || p.category === activeCategory)
    .filter((p) => !menuSearchQuery.trim() || p.nameAr.includes(menuSearchQuery.trim()) || p.nameEn.toLowerCase().includes(menuSearchQuery.toLowerCase()));

  // Calculations for current active ticket
  const ticketSubtotal = ticketItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const ticketDeliveryFee = ticketOrderType === "delivery" ? ticketSelectedZone.fee : 0;
  const ticketGrandTotal = ticketSubtotal + ticketDeliveryFee;
  const ticketItemCount = ticketItems.reduce((s, i) => s + i.qty, 0);

  // History orders
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
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    total: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0),
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1C0500] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F59E0B]" size={42} />
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className="min-h-screen text-stone-100 p-3 sm:p-5"
      style={{
        background: "linear-gradient(135deg, #1A0400 0%, #2A0802 30%, #4A0E06 70%, #150300 100%)",
        fontFamily: "var(--font-cairo), system-ui, sans-serif",
      }}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 pb-3 border-b border-amber-900/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#5A0E06] border border-[#F59E0B]/50 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🧇</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{t("ماكينة الكاشير والبيع المباشر (POS)", "Direct Counter Sale & POS")}</span>
              <span className="text-xs bg-[#8B0000] text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold">
                فرع حدائق القبة
              </span>
            </h1>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {t("بيع مباشر وتيك أواي للكاونتر (0 ج توصيل) وتسجيل فوري وطباعة ريسيت 80mm", "Instant counter sales & 80mm thermal receipts")}
            </p>
          </div>
        </div>

        {/* Navigation & Mode Switches */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 bg-[#240803] border border-amber-900/60 rounded-xl">
            <button
              onClick={() => { setActiveMainTab("pos"); playSound("click"); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMainTab === "pos"
                  ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/40"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Store size={15} />
              <span>ماكينة البيع المباشر (POS)</span>
            </button>
            <button
              onClick={() => { setActiveMainTab("history"); playSound("click"); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMainTab === "history"
                  ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/40"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <ShoppingBag size={15} />
              <span>فواتير اليوم ({stats.total} ج)</span>
            </button>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-[#240803] border border-amber-900/60 text-stone-300 hover:text-white text-xs font-bold transition-colors"
          >
            الموقع 🌐
          </Link>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-[#240803] border border-amber-900/60 text-amber-300 hover:text-white text-xs font-bold transition-colors"
          >
            الداشبورد 📊
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODE 1: LIVE POS TOUCH REGISTER (Counter & Direct Sale)
      ══════════════════════════════════════════════════════════ */}
      {activeMainTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── Left Column: Active Register Order Ticket (فاتورة الكاونتر) ── */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#200802]/95 border border-amber-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between backdrop-blur-md min-h-[680px]">
            <div>
              {/* Ticket Header & Type Selection */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧾</span>
                  <span className="font-black text-white text-base">فاتورة الكاونتر الحالية</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    {ticketItemCount} أصناف
                  </span>
                </div>
                {ticketItems.length > 0 && (
                  <button
                    onClick={clearTicket}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} /> إفراغ
                  </button>
                )}
              </div>

              {/* Order Type Tabs: Takeaway (DEFAULT: 0 FEE) vs Dine-in vs Delivery */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#140401] rounded-2xl border border-amber-950 mb-3">
                <button
                  type="button"
                  onClick={() => { setTicketOrderType("takeaway"); playSound("click"); }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                    ticketOrderType === "takeaway"
                      ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-md border border-amber-400/50"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <span>🥡 تيك أواي</span>
                  <span className="text-[10px] opacity-80 font-normal">بيع مباشر (0ج)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTicketOrderType("dinein"); playSound("click"); }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                    ticketOrderType === "dinein"
                      ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-md border border-amber-400/50"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <span>🍽️ صالة</span>
                  <span className="text-[10px] opacity-80 font-normal">داخل المحل (0ج)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTicketOrderType("delivery"); playSound("click"); }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                    ticketOrderType === "delivery"
                      ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-md border border-amber-400/50"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <span>🛵 دليفري</span>
                  <span className="text-[10px] opacity-80 font-normal">توصيل القاهرة</span>
                </button>
              </div>

              {/* Optional Quick Fields for Takeaway / Mandatory for Delivery */}
              {ticketOrderType === "delivery" ? (
                <div className="space-y-2 mb-3 bg-[#170401] p-3 rounded-2xl border border-amber-900/40">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={ticketCustomerName}
                      onChange={(e) => setTicketCustomerName(e.target.value)}
                      placeholder="اسم العميل *"
                      className="w-full h-9 rounded-xl bg-[#240803] border border-amber-900/50 px-2.5 text-white text-xs outline-none"
                    />
                    <input
                      value={ticketCustomerPhone}
                      onChange={(e) => setTicketCustomerPhone(e.target.value)}
                      placeholder="رقم الموبايل *"
                      dir="ltr"
                      className="w-full h-9 rounded-xl bg-[#240803] border border-amber-900/50 px-2.5 text-white text-xs font-mono outline-none"
                    />
                  </div>
                  <select
                    value={ticketSelectedZone.code}
                    onChange={(e) => {
                      const z = CAIRO_DELIVERY_ZONES.find((x) => x.code === e.target.value);
                      if (z) setTicketSelectedZone(z);
                    }}
                    className="w-full h-9 rounded-xl bg-[#240803] border border-amber-900/50 px-2 text-amber-300 text-xs outline-none"
                  >
                    {CAIRO_DELIVERY_ZONES.map((z) => (
                      <option key={z.code} value={z.code} className="bg-[#1A0400] text-white">
                        {z.nameAr} (+{z.fee} ج توصيل)
                      </option>
                    ))}
                  </select>
                  <input
                    value={ticketAddress}
                    onChange={(e) => setTicketAddress(e.target.value)}
                    placeholder="العنوان بالتفصيل..."
                    className="w-full h-9 rounded-xl bg-[#240803] border border-amber-900/50 px-2.5 text-white text-xs outline-none"
                  />
                </div>
              ) : (
                <div className="flex gap-2 mb-3">
                  <input
                    value={ticketCustomerName}
                    onChange={(e) => setTicketCustomerName(e.target.value)}
                    placeholder="اسم الزبون (اختياري للريسيت)"
                    className="flex-1 h-8 rounded-xl bg-[#170401] border border-amber-900/40 px-2.5 text-white text-xs placeholder:text-stone-500 outline-none"
                  />
                  <input
                    value={ticketCustomerPhone}
                    onChange={(e) => setTicketCustomerPhone(e.target.value)}
                    placeholder="موبايل (اختياري)"
                    dir="ltr"
                    className="w-32 h-8 rounded-xl bg-[#170401] border border-amber-900/40 px-2 text-white text-xs placeholder:text-stone-500 font-mono outline-none"
                  />
                </div>
              )}

              {/* Ticket Items List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {ticketItems.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-amber-900/40 rounded-2xl bg-[#170401]/50">
                    <span className="text-4xl block mb-2">🧇</span>
                    <p className="text-sm font-bold text-white mb-1">الفاتورة جاهزة لطلب العميل</p>
                    <p className="text-xs text-stone-400">
                      اضغط على أي صنف من قائمة المنيو لإضافته فوراً للفاتورة 👈
                    </p>
                  </div>
                ) : (
                  ticketItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#170401] border border-amber-950 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.nameAr}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.variantName && (
                            <span className="text-[10.5px] bg-[#8B0000] text-amber-200 px-1.5 py-0.5 rounded font-black">
                              {item.variantName}
                            </span>
                          )}
                          <span className="text-[11px] text-amber-400 font-mono font-bold">
                            {item.unitPrice} ج
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => removeFromTicket(item.product, item.variantName)}
                          className="w-6 h-6 rounded-lg bg-[#290802] text-white hover:bg-stone-800 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-white text-xs w-5 text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToTicket(item.product, item.variantName ? { nameAr: item.variantName, price: item.unitPrice } : undefined)}
                          className="w-6 h-6 rounded-lg bg-[#8B0000] text-white hover:bg-red-700 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                        <span className="font-mono font-black text-amber-300 text-xs w-12 text-left mr-1">
                          {item.unitPrice * item.qty}ج
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteTicketItem(item.product, item.variantName)}
                          className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ticket Totals & Checkout Button */}
            <div className="mt-4 pt-3 border-t border-amber-900/50 space-y-2.5">
              <div className="bg-[#140401] p-3 rounded-2xl border border-amber-950 space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>المجموع الفرعي ({ticketItemCount} قطعة)</span>
                  <span className="font-mono text-white">{ticketSubtotal} ج</span>
                </div>
                <div className="flex justify-between text-xs text-stone-400">
                  <span>خدمة التوصيل ({ticketOrderType === "delivery" ? ticketSelectedZone.nameAr : "تيك أواي مباشر"})</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {ticketOrderType === "delivery" ? `${ticketDeliveryFee} ج` : "0 ج (مجاناً)"}
                  </span>
                </div>
                <div className="flex justify-between font-black text-amber-300 text-lg pt-1 border-t border-amber-900/40">
                  <span>المطلوب سداده</span>
                  <span className="font-mono">{ticketGrandTotal} ج.م</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "cash", label: "كاش 💵" },
                  { id: "instapay", label: "إنستاباي ⚡" },
                  { id: "card", label: "كارت 💳" },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => { setTicketPaymentMethod(pm.id); playSound("click"); }}
                    className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                      ticketPaymentMethod === pm.id
                        ? "bg-[#8B0000] text-white border border-amber-400/50 shadow-md"
                        : "bg-[#180501] text-stone-400 border border-stone-900 hover:text-white"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Big Action Button: Save & Print Thermal Receipt */}
              <button
                type="button"
                onClick={submitAndPrintTicket}
                disabled={ticketItems.length === 0 || submittingOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#047857] hover:opacity-95 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 border border-emerald-400/40 disabled:opacity-50 transition-all hover:scale-[1.01]"
              >
                {submittingOrder ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Printer size={18} />
                    <span>حفظ وطباعة الفاتورة للعميل (80mm)</span>
                    <span className="font-mono mr-1">({ticketGrandTotal} ج)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right Column: Counter Menu Catalog (أصناف وافل هاوس) ── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
            {/* Category Filter Carousel */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCategory(cat); playSound("click"); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/50"
                      : "bg-[#200802] text-stone-300 hover:text-white border border-amber-900/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Search */}
            <div className="relative">
              <Search size={16} style={{ [dir === "rtl" ? "right" : "left"]: "12px" }} className="absolute top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم في أصناف المنيو..."
                style={{ [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px" }}
                className="w-full h-10 rounded-xl bg-[#200802] border border-amber-900/50 focus:border-[#F59E0B] text-white text-xs outline-none"
              />
            </div>

            {/* Products Grid with Clear Variant Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const parsedSizes: ProductSize[] = p.sizes
                  ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes)
                  : [];

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-[#200802] border border-amber-900/40 hover:border-amber-600/70 transition-all shadow-md flex flex-col justify-between"
                  >
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-black text-white text-sm leading-snug">{p.nameAr}</span>
                        <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          {p.category}
                        </span>
                      </div>
                    </div>

                    {/* Direct Variant Buttons (Sandwich vs Open / 15 vs 25 / M vs L) */}
                    {parsedSizes && parsedSizes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {parsedSizes.map((sz) => {
                          const inTicket = ticketItems.find(
                            (i) => i.product.id === p.id && i.variantName === sz.nameAr
                          );
                          const szLabel = sz.nameAr.includes("ساندوتش") ? "🥪 ساندوتش" :
                                          sz.nameAr.includes("مفتوح") ? "🧇 مفتوح" :
                                          sz.nameAr.includes("15") ? "🥞 15 قطعة" :
                                          sz.nameAr.includes("25") ? "🥞 25 قطعة" :
                                          sz.nameAr.includes("وسط") || sz.nameAr.includes("M") ? "🥤 وسط M" :
                                          sz.nameAr.includes("كبير") || sz.nameAr.includes("L") ? "🥤 كبير L" : sz.nameAr;

                          return (
                            <button
                              key={sz.nameAr}
                              type="button"
                              onClick={() => addToTicket(p, sz)}
                              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all ${
                                inTicket
                                  ? "bg-[#8B0000] border-amber-400 text-white shadow-md scale-[1.02]"
                                  : "bg-[#140401] border-amber-900/60 text-stone-200 hover:border-amber-500"
                              }`}
                            >
                              <span className="text-xs font-black">{szLabel}</span>
                              <span className="text-amber-300 font-mono font-black text-xs">
                                {sz.price} ج.م
                              </span>
                              {inTicket && (
                                <span className="text-[9.5px] bg-white text-red-950 px-1.5 py-0.2 rounded-full font-black">
                                  بالفاتورة ({inTicket.qty}) ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-800/60">
                        <span className="text-amber-300 font-mono font-black text-sm">{p.basePrice} ج.م</span>
                        <button
                          type="button"
                          onClick={() => addToTicket(p)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white font-black text-xs hover:opacity-95 shadow-sm"
                        >
                          + أضف للفاتورة
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

      {/* ══════════════════════════════════════════════════════════
          MODE 2: ORDERS ARCHIVE & TODAY'S RECEIPTS
      ══════════════════════════════════════════════════════════ */}
      {activeMainTab === "history" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={16} style={{ [dir === "rtl" ? "right" : "left"]: "12px" }} className="absolute top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم الطلب، اسم العميل، الهاتف..."
                style={{ [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px" }}
                className="w-full h-10 rounded-xl bg-[#200802] border border-amber-900/50 text-white text-xs outline-none"
              />
            </div>

            <div className="flex gap-1 bg-[#200802] border border-amber-900/50 rounded-xl p-1">
              {[
                { id: "active", label: "النشط" },
                { id: "delivered", label: "مسلَّم ومحصَّل" },
                { id: "cancelled", label: "ملغي" },
                { id: "all", label: "الكل" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterStatus(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === s.id
                      ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-[#200802] border border-amber-900/50 text-amber-400 hover:border-amber-400 transition-colors"
              title="تحديث"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Orders Table */}
          <div className="bg-[#200802]/90 border border-amber-900/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-900/40 text-amber-200/80 text-xs bg-[#290903]">
                    <th className="p-3 text-right font-bold">رقم الفاتورة</th>
                    <th className="p-3 text-right font-bold">نوع الطلب</th>
                    <th className="p-3 text-right font-bold">العميل</th>
                    <th className="p-3 text-right font-bold">الحالة</th>
                    <th className="p-3 text-left font-bold">الإجمالي</th>
                    <th className="p-3 text-center font-bold">طباعة ريسيت 80mm</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-stone-400">
                        لا توجد فواتير مطابقة
                      </td>
                    </tr>
                  ) : (
                    displayOrders.map((order) => {
                      const colorCfg = STATUS_COLORS[order.status] || STATUS_COLORS.new;
                      const typeBadge = getOrderTypeBadge(order.orderType);

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-amber-900/20 hover:bg-[#340B04]/70 transition-colors"
                        >
                          <td className="p-3 font-mono text-xs text-amber-400 font-bold">{order.orderNumber}</td>
                          <td className="p-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${typeBadge.color}`}>
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-white text-xs">{order.customerName}</p>
                            <p className="text-[11px] text-stone-400 font-mono">{order.phone}</p>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-0.5 rounded-lg border font-bold ${colorCfg.bg} ${colorCfg.color}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="p-3 text-left font-black text-amber-300 font-mono">
                            {order.total} ج.م
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => window.open(`/receipt/${order.id}`, "_blank")}
                              className="px-3 py-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A81010] text-white text-xs font-black inline-flex items-center gap-1.5 border border-amber-400/40 shadow-sm"
                            >
                              <Printer size={14} /> طباعة ريسيت
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
  );
}