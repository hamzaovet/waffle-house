"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import { RefreshCw, ChefHat, Clock, CheckCircle2, Loader2, AlertCircle, Bell, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  zone: string;
  items: string;
  notes?: string;
  status: string;
  orderType?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FLOW = ["new", "preparing", "ready", "delivered"];
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new:       { color: "text-blue-300",    bg: "bg-blue-500/20 border-blue-500/40" },
  preparing: { color: "text-orange-300", bg: "bg-orange-500/20 border-orange-500/40" },
  ready:     { color: "text-emerald-300", bg: "bg-emerald-500/20 border-emerald-500/40" },
  delivered: { color: "text-green-300", bg: "bg-green-500/20 border-green-500/40" },
  cancelled: { color: "text-red-300", bg: "bg-red-500/20 border-red-500/40" },
};

export default function KitchenPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, loading: authLoading } = useStaff();
  const { lang, toggleLang, dir, t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const prevNewCount = React.useRef(0);

  function getStatusLabel(status: string) {
    switch (status) {
      case "new": return t("جديد", "New");
      case "preparing": return t("يُحضَّر", "Preparing");
      case "ready": return t("جاهز 🛵", "Ready 🛵");
      case "delivered": return t("تم التسليم", "Delivered");
      case "cancelled": return t("ملغي", "Cancelled");
      default: return status;
    }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=new");
      const newOrd = await res.json();
      const res2 = await fetch("/api/orders?status=preparing");
      const prepOrd = await res2.json();
      const all = [...(Array.isArray(newOrd) ? newOrd : []), ...(Array.isArray(prepOrd) ? prepOrd : [])];
      all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Sound on new order
      const newCount = all.filter((o) => o.status === "new").length;
      if (newCount > prevNewCount.current) playSound("kitchen");
      prevNewCount.current = newCount;

      setOrders(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !permissions.canViewKitchen) { router.push("/login"); return; }
      fetchOrders();
      const t = setInterval(fetchOrders, 15000);
      return () => clearInterval(t);
    }
  }, [authLoading, isAuthenticated, permissions, router, fetchOrders]);

  async function updateStatus(order: Order, newStatus: string) {
    setUpdating(order.id);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, _updatedBy: "chef" }),
      });
      playSound(newStatus === "ready" ? "success" : "click");
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  }

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#C6873E]" size={40} />
    </div>
  );

  const newOrders = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");

  return (
    <div dir={dir} className="min-h-screen bg-[#F8F4EC] p-4 sm:p-6 text-[#2B170E]" style={{ fontFamily: "var(--font-cairo), system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#FFFFFF] border border-[#E8DAC8] flex items-center justify-center shadow-sm">
            <ChefHat className="text-[#C6873E]" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#2B170E]">{t("شاشة المطبخ (KDS)", "Kitchen Display System (KDS)")}</h1>
            <p className="text-xs text-[#7E5E49]">{newOrders.length} {t("جديد", "New")} • {preparingOrders.length} {t("يُحضَّر", "Preparing")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle Button */}
          <button
            onClick={() => { playSound("click"); toggleLang(); }}
            className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8DAC8] text-[#7E5E49] font-bold text-xs hover:border-[#C6873E] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>{lang === "ar" ? "EN 🌐" : "ع 🌐"}</span>
          </button>

          <button onClick={fetchOrders} className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8DAC8] text-[#C6873E] hover:border-[#C6873E] transition-colors shadow-sm" title={t("تحديث الطلبات", "Refresh Orders")}>
            <RefreshCw size={18} />
          </button>

          <Link href="/dashboard" className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8DAC8] text-[#7E5E49] hover:text-[#2B170E] text-xs font-bold transition-colors shadow-sm">
            {t("الداشبورد", "Dashboard")}
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 text-[#7E5E49]">
          <ChefHat size={48} className="mx-auto mb-3 opacity-50 text-[#C6873E]" />
          <p className="text-lg font-bold text-[#2B170E]">{t("لا توجد طلبات حالياً 🎉", "No active orders right now 🎉")}</p>
          <p className="text-sm mt-1">{t("بيجيلك طلب هيرن هنا تلقائياً", "Incoming orders will chime and appear here automatically")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const items = (() => { try { return JSON.parse(order.items); } catch { return []; } })();
            const colorCfg = STATUS_COLORS[order.status] || STATUS_COLORS.new;
            const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isUrgent = elapsed >= 15 && order.status === "new";
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

            return (
              <div key={order.id} className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all shadow-sm ${
                isUrgent ? "border-red-500 bg-red-50" : `border-[#E8DAC8] bg-[#FFFFFF]`
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#C6873E] font-bold">{order.orderNumber}</span>
                  <div className="flex items-center gap-1.5">
                    {isUrgent && <AlertCircle size={14} className="text-red-600" />}
                    <Clock size={12} className={isUrgent ? "text-red-600" : "text-[#7E5E49]"} />
                    <span className={`text-xs font-bold ${isUrgent ? "text-red-600" : "text-[#7E5E49]"}`}>{elapsed} {t("د", "m")}</span>
                  </div>
                </div>
                {/* Order Type Badge */}
                {order.orderType === "takeaway" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-400 text-amber-800">
                    🥡 تيك أواي
                  </span>
                )}
                {order.orderType === "delivery" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-red-100 border border-red-400 text-red-800">
                    🛵 دليفري
                  </span>
                )}
                {order.orderType === "dinein" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-400 text-purple-800">
                    🍽️ صالة
                  </span>
                )}

                <div>
                  <p className="font-bold text-[#2B170E]">{order.customerName}</p>
                  <p className="text-xs text-[#7E5E49]">{order.zone}</p>
                </div>

                <div className="bg-[#FAF6EE] border border-[#E8DAC8] rounded-xl p-2.5 space-y-1.5">
                  {items.map((item: { nameAr?: string; nameEn?: string; qty: number; extras: string[] }, i: number) => {
                    const itemName = (lang === "en" && item.nameEn) ? item.nameEn : (item.nameAr || item.nameEn || "");
                    return (
                      <div key={i} className="text-sm">
                        <span className="font-bold text-[#2B170E]">× {item.qty} {itemName}</span>
                        {item.extras?.length > 0 && (
                          <p className="text-[11px] text-[#C6873E]">+ {item.extras.join(" + ")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.notes && (
                  <p className="text-xs text-amber-900 bg-amber-50 rounded-xl p-2 border border-amber-200">
                    📝 {order.notes}
                  </p>
                )}

                <div className={`text-center text-xs font-bold px-3 py-1.5 rounded-xl border ${colorCfg.bg} ${colorCfg.color}`}>
                  {getStatusLabel(order.status)}
                </div>

                {nextStatus && nextStatus !== "delivered" && (
                  <button onClick={() => updateStatus(order, nextStatus)}
                    disabled={updating === order.id}
                    className="w-full btn-gold py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 text-white shadow-md">
                    {updating === order.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {nextStatus === "preparing" ? t("بدأ التحضير 🔥", "Start Preparing 🔥") : t("جاهز للتوصيل ✅", "Ready for Delivery ✅")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
