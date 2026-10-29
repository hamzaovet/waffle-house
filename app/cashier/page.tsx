"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import {
  Plus, RefreshCw, Search, Loader2, CheckCircle2, X, Clock,
  ShoppingBag, Truck, Phone, Printer, Utensils, Store, Bike
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

interface CartItem {
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const prevCount = React.useRef(0);

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

  function getPaymentLabel(method: string) {
    switch (method) {
      case "cash": return t("كاش 💵", "Cash 💵");
      case "instapay": return t("إنستاباي ⚡", "InstaPay ⚡");
      case "wallet": return t("محفظة 📱", "Wallet 📱");
      case "card": return t("كارت 💳", "Card 💳");
      default: return method;
    }
  }

  // New order form state
  const [orderType, setOrderType] = useState<"takeaway" | "delivery" | "dinein">("takeaway");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneItem>(DEFAULT_ZONE);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("الكل");

  const fetchData = useCallback(async () => {
    try {
      const [ordRes, prodRes] = await Promise.all([fetch("/api/orders"), fetch("/api/products")]);
      const [ord, prod] = await Promise.all([ordRes.json(), prodRes.json()]);
      const ordList = Array.isArray(ord) ? ord : [];

      // Alert on new orders
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

  async function changeStatus(order: Order, status: string) {
    setUpdating(order.id);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, _updatedBy: currentUser?.name || "cashier" }),
      });
      playSound(status === "delivered" ? "success" : "click");
      await fetchData();
      if (selectedOrder?.id === order.id) setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    } finally {
      setUpdating(null);
    }
  }

  function addVariantToCart(product: Product, size?: ProductSize) {
    playSound("click");
    setCartItems((prev) => {
      const vName = size ? size.nameAr : null;
      const uPrice = size ? size.price : product.basePrice;
      const existing = prev.find((i) => i.product.id === product.id && i.variantName === vName);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id && i.variantName === vName ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1, variantName: vName, unitPrice: uPrice }];
    });
  }

  function removeVariantFromCart(product: Product, sizeName?: string | null) {
    playSound("click");
    setCartItems((prev) =>
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

  async function placeNewOrder() {
    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const deliveryFee = orderType === "delivery" ? selectedZone.fee : 0;
    const finalTotal = subtotal + deliveryFee;

    const items = cartItems.map((i) => ({
      productId: i.product.id,
      nameAr: i.variantName ? `${i.product.nameAr} (${i.variantName})` : i.product.nameAr,
      nameEn: i.variantName ? `${i.product.nameEn || i.product.nameAr} (${i.variantName})` : (i.product.nameEn || i.product.nameAr),
      qty: i.qty,
      unitPrice: i.unitPrice,
      selectedSize: i.variantName || null,
      extras: [],
    }));

    const finalCustomerName = customerName.trim() || (orderType === "takeaway" ? "زبون تيك أواي (استلام فرع)" : orderType === "dinein" ? "زبون صالة" : "عميل دليفري");
    const finalPhone = phone.trim() || "01155175799";
    const finalAddress = orderType === "delivery" ? (address.trim() || selectedZone.nameAr) : "فرع حدائق القبة - شارع مصر والسودان";
    const finalZone = orderType === "delivery" ? selectedZone.nameAr : (orderType === "takeaway" ? "استلام من الفرع" : "صالة");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: finalCustomerName,
        phone: finalPhone,
        address: finalAddress,
        zone: finalZone,
        orderType,
        paymentMethod,
        notes,
        items,
        subtotal,
        deliveryFee,
        total: finalTotal,
      }),
    });

    if (res.ok) {
      playSound("order");
      setNewOrderOpen(false);
      setCartItems([]);
      setCustomerName("");
      setPhone("");
      setAddress("");
      setNotes("");
      await fetchData();
    }
  }

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

  const categories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = productCategoryFilter === "الكل"
    ? products
    : products.filter((p) => p.category === productCategoryFilter);

  const cartSubtotal = cartItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const cartDeliveryFee = orderType === "delivery" ? selectedZone.fee : 0;
  const cartGrandTotal = cartSubtotal + cartDeliveryFee;

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
      className="min-h-screen text-stone-100 p-4 sm:p-6"
      style={{
        background: "linear-gradient(135deg, #1C0500 0%, #2A0802 30%, #4A0E06 70%, #150300 100%)",
        fontFamily: "var(--font-cairo), system-ui, sans-serif",
      }}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#5A0E06] border border-[#F59E0B]/40 flex items-center justify-center shadow-lg">
            <span className="text-xl">🧇</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{t("نقطة البيع والكاشير السريع (POS)", "Cashier Point of Sale (POS)")}</span>
              <span className="text-xs bg-[#8B0000] text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30">
                وافل هاوس • حدائق القبة
              </span>
            </h1>
            <p className="text-xs text-amber-200/70 mt-0.5">
              {t("تسجيل الطلبات (تيك أواي - صالة - دليفري) مع تسعير الأحجام والأنواع فوراً", "Takeaway, Dine-in & Delivery with live two-tier size pricing")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { playSound("click"); toggleLang(); }}
            className="px-3.5 py-1.5 rounded-xl bg-[#240803] border border-[#F59E0B]/30 text-amber-300 font-bold text-xs hover:border-[#F59E0B] transition-colors shadow-sm"
          >
            {lang === "ar" ? "EN 🌐" : "ع 🌐"}
          </button>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-[#240803] border border-amber-900/60 text-stone-300 hover:text-white text-xs font-bold transition-colors shadow-sm"
          >
            {t("الداشبورد", "Dashboard")}
          </Link>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("جديد", "New"), val: stats.new, color: "text-blue-300", bg: "bg-blue-950/40 border-blue-900/60" },
          { label: t("يُحضَّر بالفرن", "Baking / Prep"), val: stats.preparing, color: "text-amber-300", bg: "bg-amber-950/40 border-amber-900/60" },
          { label: t("جاهز للاستلام/التسليم", "Ready"), val: stats.ready, color: "text-emerald-300", bg: "bg-emerald-950/40 border-emerald-900/60" },
          { label: t("إيراد اليوم (ج)", "Today Revenue (EGP)"), val: stats.total.toLocaleString(lang === "ar" ? "ar-EG" : "en-US"), color: "text-amber-400 font-mono", bg: "bg-stone-900/60 border-amber-600/40" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center shadow-lg backdrop-blur-xs ${s.bg}`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-xs text-stone-300 mt-1 font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} style={{ [dir === "rtl" ? "right" : "left"]: "12px" }} className="absolute top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ابحث برقم الطلب، اسم العميل، الموبايل...", "Search by order #, name, phone...")}
            style={{ [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px", [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "16px" }}
            className="w-full h-11 rounded-xl bg-[#240803]/80 border border-amber-900/50 focus:border-[#F59E0B] text-white placeholder:text-stone-400 text-sm outline-none transition-colors shadow-sm"
          />
        </div>

        <div className="flex gap-1 bg-[#240803] border border-amber-900/50 rounded-xl p-1 shadow-sm">
          {[
            { id: "active", label: t("نشط", "Active") },
            { id: "delivered", label: t("مسلَّم", "Delivered") },
            { id: "cancelled", label: t("ملغي", "Cancelled") },
            { id: "all", label: t("الكل", "All") },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === s.id
                  ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-sm"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-[#240803] border border-amber-900/50 text-amber-400 hover:border-[#F59E0B] transition-colors shadow-sm"
          title={t("تحديث", "Refresh")}
        >
          <RefreshCw size={17} />
        </button>

        {permissions.canCreateOrder && (
          <button
            onClick={() => { setNewOrderOpen(true); playSound("click"); }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] via-[#991B1B] to-[#B91C1C] text-white hover:opacity-95 shadow-lg border border-amber-500/30 text-sm font-black flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Plus size={16} /> {t("طلب جديد ➕ (تيك أواي / صالة / دليفري)", "New Order ➕")}
          </button>
        )}
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-[#1F0702]/85 border border-amber-900/40 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-900/40 text-amber-200/80 text-xs bg-[#290903]">
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} font-bold`}>{t("رقم الطلب", "Order #")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} font-bold`}>{t("نوع الطلب", "Type")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} font-bold`}>{t("العميل", "Customer")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} hidden sm:table-cell font-bold`}>{t("المنطقة / العنوان", "Zone / Address")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} font-bold`}>{t("الحالة", "Status")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "left" : "right"} font-bold`}>{t("الإجمالي", "Total")}</th>
                <th className={`p-3.5 text-${dir === "rtl" ? "right" : "left"} hidden md:table-cell font-bold`}>{t("الوقت", "Time")}</th>
                <th className="p-3.5 text-center font-bold">{t("إجراءات وريسيت", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-stone-400">
                    {t("لا توجد طلبات تطابق البحث", "No matching orders")}
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => {
                  const colorCfg = STATUS_COLORS[order.status] || STATUS_COLORS.new;
                  const typeBadge = getOrderTypeBadge(order.orderType);
                  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="border-b border-amber-900/20 hover:bg-[#340B04]/70 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono text-xs text-amber-400 font-bold">{order.orderNumber}</td>
                      <td className="p-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{order.customerName}</p>
                        <p className="text-xs text-stone-400 font-mono">{order.phone}</p>
                      </td>
                      <td className="p-3.5 text-stone-300 hidden sm:table-cell text-xs">
                        {order.zone || order.address || "فرع حدائق القبة"}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${colorCfg.bg} ${colorCfg.color}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className={`p-3.5 text-${dir === "rtl" ? "left" : "right"} font-black text-amber-300 font-mono text-sm`}>
                        {order.total} {t("ج", "EGP")}
                      </td>
                      <td className="p-3.5 hidden md:table-cell text-xs text-stone-400 font-mono">
                        {elapsed} {t("د", "m")}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Print Receipt Button */}
                          <button
                            type="button"
                            onClick={() => window.open(`/receipt/${order.id}`, "_blank")}
                            className="p-1.5 rounded-lg bg-[#2E0A03] border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 hover:text-white transition-colors"
                            title="طباعة ريسيت حراري (80mm)"
                          >
                            <Printer size={15} />
                          </button>

                          {order.status === "new" && permissions.canUpdateOrderStatus && (
                            <button
                              onClick={() => changeStatus(order, "preparing")}
                              disabled={updating === order.id}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-900/80 border border-amber-600/80 text-amber-200 hover:bg-amber-800 transition-colors font-bold shadow-xs"
                            >
                              {updating === order.id ? "..." : t("حضّر 👨‍🍳", "Prep")}
                            </button>
                          )}
                          {order.status === "preparing" && permissions.canUpdateOrderStatus && (
                            <button
                              onClick={() => changeStatus(order, "ready")}
                              disabled={updating === order.id}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-900/80 border border-emerald-600/80 text-emerald-200 hover:bg-emerald-800 transition-colors font-bold shadow-xs"
                            >
                              {updating === order.id ? "..." : t("جاهز 🛵", "Ready")}
                            </button>
                          )}
                          {order.status === "ready" && permissions.canUpdateOrderStatus && (
                            <button
                              onClick={() => changeStatus(order, "delivered")}
                              disabled={updating === order.id}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-green-900/80 border border-green-600/80 text-green-200 hover:bg-green-800 transition-colors font-bold shadow-xs"
                            >
                              {updating === order.id ? "..." : t("سُلِّم ✓", "Delivered ✓")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-[#230903] border border-amber-800/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto animate-fadeIn text-white">
            <button
              onClick={() => setSelectedOrder(null)}
              style={{ [dir === "rtl" ? "left" : "right"]: "16px" }}
              className="absolute top-4 p-1.5 rounded-xl hover:bg-stone-800/60 text-stone-400 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono text-amber-400 font-black text-lg block">{selectedOrder.orderNumber}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold inline-block mt-1 ${getOrderTypeBadge(selectedOrder.orderType).color}`}>
                  {getOrderTypeBadge(selectedOrder.orderType).label}
                </span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${STATUS_COLORS[selectedOrder.status]?.bg} ${STATUS_COLORS[selectedOrder.status]?.color}`}>
                {getStatusLabel(selectedOrder.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4 bg-[#180501] p-3.5 rounded-2xl border border-amber-950/80">
              <div className="flex items-center gap-2 text-stone-300">
                <Phone size={14} className="text-amber-400" />
                <span className="font-bold text-white">{selectedOrder.customerName}</span> — <span className="font-mono text-amber-300">{selectedOrder.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Truck size={14} className="text-amber-400" />
                <span>{selectedOrder.zone || "فرع حدائق القبة"}</span> {selectedOrder.address ? `— ${selectedOrder.address}` : ""}
              </div>
              <div className="flex items-center gap-2 text-stone-400 text-xs font-mono">
                <Clock size={14} className="text-amber-400" />
                {new Date(selectedOrder.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
              </div>
            </div>

            <div className="bg-[#1C0501] border border-amber-900/50 rounded-2xl p-4 space-y-2.5 mb-4">
              <p className="text-xs font-bold text-amber-400 border-b border-amber-900/40 pb-2">تفاصيل الأصناف والخيارات:</p>
              {(() => { try { return JSON.parse(selectedOrder.items); } catch { return []; } })()
                .map((item: any, i: number) => {
                  const itemName = (lang === "en" && item.nameEn) ? item.nameEn : (item.nameAr || item.nameEn || "");
                  return (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-stone-900/40">
                      <div>
                        <span className="text-white font-medium">× {item.qty} {itemName}</span>
                        {item.selectedSize && (
                          <span className="mr-2 text-[11px] bg-red-950 text-red-200 border border-red-800 px-1.5 py-0.5 rounded">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <span className="text-amber-300 font-mono font-bold">{item.unitPrice * item.qty} {t("ج", "EGP")}</span>
                    </div>
                  );
                })}

              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>{t("المجموع الفرعي", "Subtotal")}</span>
                  <span className="font-mono">{selectedOrder.subtotal} {t("ج", "EGP")}</span>
                </div>
                <div className="flex justify-between text-stone-400 text-xs">
                  <span>{t("خدمة التوصيل", "Delivery Fee")}</span>
                  <span className="font-mono">{selectedOrder.deliveryFee} {t("ج", "EGP")}</span>
                </div>
                <div className="flex justify-between font-black text-amber-300 text-base pt-1 border-t border-amber-900/40">
                  <span>{t("الإجمالي النهائي", "Grand Total")}</span>
                  <span className="font-mono">{selectedOrder.total} {t("ج", "EGP")}</span>
                </div>
                <div className="text-xs text-stone-400 mt-1">{getPaymentLabel(selectedOrder.paymentMethod)}</div>
              </div>
            </div>

            {selectedOrder.notes && (
              <p className="text-xs text-amber-200 bg-amber-950/60 rounded-xl p-3 border border-amber-800/60 mb-4 font-medium">
                📝 {selectedOrder.notes}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open(`/receipt/${selectedOrder.id}`, "_blank")}
                className="px-4 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#A81010] text-white text-xs font-black flex items-center gap-1.5 border border-amber-400/40 transition-colors"
              >
                <Printer size={15} /> {t("طباعة ريسيت 80mm", "Print Receipt")}
              </button>

              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && permissions.canUpdateOrderStatus && (
                <>
                  {selectedOrder.status === "new" && (
                    <button
                      onClick={() => { changeStatus(selectedOrder, "preparing"); setSelectedOrder(null); }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white text-xs font-black shadow-sm hover:opacity-95 transition-opacity"
                    >
                      {t("بدء التحضير 👨‍🍳", "Start Prep")}
                    </button>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <button
                      onClick={() => { changeStatus(selectedOrder, "ready"); setSelectedOrder(null); }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] text-white text-xs font-black shadow-sm hover:opacity-95 transition-opacity"
                    >
                      {t("جاهز للتسليم 🛵", "Ready")}
                    </button>
                  )}
                  {selectedOrder.status === "ready" && (
                    <button
                      onClick={() => { changeStatus(selectedOrder, "delivered"); setSelectedOrder(null); }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black transition-colors shadow-sm"
                    >
                      {t("تم التسليم للزبون ✓", "Delivered ✓")}
                    </button>
                  )}
                  <button
                    onClick={() => { changeStatus(selectedOrder, "cancelled"); setSelectedOrder(null); }}
                    className="px-3 py-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
                  >
                    {t("إلغاء", "Cancel")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Order Modal (With Multi-Tier Pricing & Order Type Support) ── */}
      {newOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setNewOrderOpen(false)} />
          <div className="relative bg-[#200802] border border-amber-800/80 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto animate-fadeIn text-white">
            <button
              onClick={() => setNewOrderOpen(false)}
              style={{ [dir === "rtl" ? "left" : "right"]: "16px" }}
              className="absolute top-4 p-1.5 rounded-xl hover:bg-stone-800/60 text-stone-400 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">🧇</span>
              <span>{t("تسجيل طلب كاشير جديد (POS)", "Create POS Order")}</span>
            </h3>

            {/* Order Type Tabs: Takeaway vs Dine-in vs Delivery */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#140401] rounded-2xl border border-amber-900/40 mb-4">
              <button
                type="button"
                onClick={() => setOrderType("takeaway")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  orderType === "takeaway"
                    ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/40"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <span>🥡 استلام فرع (تيك أواي)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("dinein")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  orderType === "dinein"
                    ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/40"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <span>🍽️ صالة</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  orderType === "delivery"
                    ? "bg-gradient-to-r from-[#8B0000] to-[#B91C1C] text-white shadow-lg border border-amber-400/40"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <span>🛵 دليفري وتوصيل</span>
              </button>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("اسم الزبون (اختياري للتيك أواي)", "Customer Name")}
                className="w-full h-10 rounded-xl bg-[#170401] border border-amber-900/50 focus:border-[#F59E0B] px-3.5 text-white placeholder:text-stone-500 text-xs outline-none transition-colors"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("رقم الموبايل", "Phone Number")}
                dir="ltr"
                className="w-full h-10 rounded-xl bg-[#170401] border border-amber-900/50 focus:border-[#F59E0B] px-3.5 text-white placeholder:text-stone-500 text-xs font-mono outline-none transition-colors"
              />

              {orderType === "delivery" && (
                <>
                  <select
                    value={selectedZone.code}
                    onChange={(e) => {
                      const z = CAIRO_DELIVERY_ZONES.find((x) => x.code === e.target.value);
                      if (z) setSelectedZone(z);
                    }}
                    className="w-full h-10 rounded-xl bg-[#170401] border border-amber-900/50 focus:border-[#F59E0B] px-3 text-amber-300 text-xs outline-none transition-colors"
                  >
                    {CAIRO_DELIVERY_ZONES.map((z) => (
                      <option key={z.code} value={z.code} className="bg-[#1A0400] text-white">
                        {z.nameAr} (+{z.fee} ج توصيل)
                      </option>
                    ))}
                  </select>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("العنوان بالتفصيل (الشارع - رقم العمارة)", "Street & building address")}
                    className="w-full h-10 rounded-xl bg-[#170401] border border-amber-900/50 focus:border-[#F59E0B] px-3.5 text-white placeholder:text-stone-500 text-xs outline-none transition-colors"
                  />
                </>
              )}
            </div>

            {/* Menu Items with Multi-Tier Variants */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-400">قائمة الأصناف وأسعار الأحجام / الأنواع:</span>
                {/* Category Filter Pills */}
                <div className="flex gap-1 overflow-x-auto max-w-[60%] pb-1 scrollbar-none">
                  {categories.slice(0, 7).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProductCategoryFilter(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors ${
                        productCategoryFilter === c
                          ? "bg-amber-600 text-white"
                          : "bg-stone-900 text-stone-400 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const parsedSizes: ProductSize[] = p.sizes
                    ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes)
                    : [];

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-[#170401] border border-amber-950 hover:border-amber-900/80 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-white leading-snug">{p.nameAr}</span>
                        <span className="text-[10px] text-amber-400/80 bg-amber-950/60 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>

                      {/* Variant Buttons or Single Button */}
                      {parsedSizes && parsedSizes.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {parsedSizes.map((sz) => {
                            const inCartItem = cartItems.find(
                              (i) => i.product.id === p.id && i.variantName === sz.nameAr
                            );
                            const szShort = sz.nameAr.includes("ساندوتش") ? "🥪 ساندوتش" :
                                            sz.nameAr.includes("مفتوح") ? "🧇 مفتوح" :
                                            sz.nameAr.includes("15") ? "🥞 15 ق" :
                                            sz.nameAr.includes("25") ? "🥞 25 ق" :
                                            sz.nameAr.includes("وسط") || sz.nameAr.includes("M") ? "🥤 وسط" :
                                            sz.nameAr.includes("كبير") || sz.nameAr.includes("L") ? "🥤 كبير" : sz.nameAr;

                            return (
                              <button
                                key={sz.nameAr}
                                type="button"
                                onClick={() => addVariantToCart(p, sz)}
                                className={`text-[11px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 border transition-all ${
                                  inCartItem
                                    ? "bg-[#8B0000] border-red-500 text-white"
                                    : "bg-[#290802] border-amber-900/60 text-stone-200 hover:border-amber-500"
                                }`}
                              >
                                <span>{szShort}</span>
                                <span className="text-amber-300 font-mono font-black">{sz.price}ج</span>
                                {inCartItem && (
                                  <span className="bg-white text-red-950 px-1 rounded-full text-[10px] font-black">
                                    {inCartItem.qty}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-amber-300 font-mono text-xs font-bold">{p.basePrice} ج</span>
                          <button
                            type="button"
                            onClick={() => addVariantToCart(p)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#8B0000] text-white font-bold hover:bg-[#A81010] transition-colors"
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

            {/* Selected Items in Current Order */}
            {cartItems.length > 0 && (
              <div className="bg-[#140401] p-3 rounded-2xl border border-amber-900/50 mb-4">
                <p className="text-xs font-bold text-amber-400 mb-2">أصناف الطلب الحالي ({cartItems.reduce((s, i) => s + i.qty, 0)} قطعة):</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#240803] p-2 rounded-xl">
                      <div>
                        <span className="font-bold text-white">{item.product.nameAr}</span>
                        {item.variantName && (
                          <span className="mr-1.5 text-[11px] text-amber-300 font-bold">
                            ({item.variantName})
                          </span>
                        )}
                        <span className="mr-2 text-stone-400 font-mono">@{item.unitPrice}ج</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removeVariantFromCart(item.product, item.variantName)}
                          className="w-5 h-5 rounded bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold w-4 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => addVariantToCart(item.product, item.variantName ? { nameAr: item.variantName, price: item.unitPrice } : undefined)}
                          className="w-5 h-5 rounded bg-[#8B0000] text-white hover:bg-red-700 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        <span className="text-amber-300 font-mono font-black mr-2">
                          {item.unitPrice * item.qty}ج
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary & Place Order */}
            <div className="p-3 bg-[#170401] rounded-2xl border border-amber-900/40 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-400">
                  الأصناف: <span className="font-mono text-white">{cartSubtotal} ج</span>
                  {orderType === "delivery" && (
                    <span> • التوصيل ({selectedZone.nameAr}): <span className="font-mono text-white">{cartDeliveryFee} ج</span></span>
                  )}
                </div>
                <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                  الإجمالي المستحق: {cartGrandTotal} ج.م
                </div>
              </div>

              <div className="flex gap-1.5">
                {["cash", "instapay", "card"].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                      paymentMethod === pm
                        ? "bg-[#8B0000] text-white border border-amber-400/40"
                        : "bg-stone-900 text-stone-400"
                    }`}
                  >
                    {pm === "cash" ? "كاش 💵" : pm === "instapay" ? "إنستاباي ⚡" : "كارت 💳"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={placeNewOrder}
              disabled={cartItems.length === 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#991B1B] to-[#B91C1C] text-white font-black text-sm disabled:opacity-50 hover:opacity-95 shadow-xl border border-amber-400/30 transition-all"
            >
              {t("حفظ الطلب وطباعة الفاتورة 🖨️", "Confirm Order & Print 🖨️")} ({cartGrandTotal} {t("ج.م", "EGP")})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}