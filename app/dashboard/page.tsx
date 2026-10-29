"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { useLanguage } from "@/context/LanguageContext";
import { playSound } from "@/lib/sounds";
import ErpLayout from "@/components/ErpLayout";
import ThermalReceiptModal, { printThermalReceipt } from "@/components/ThermalReceipt";
import OrderEditModal from "@/components/OrderEditModal";
import {
  ClipboardList, CheckCircle2, Clock, Phone, MapPin,
  RefreshCw, ChefHat, Bike, XCircle, AlertCircle, Printer,
  Volume2, VolumeX, MessageSquare, Send, UserCheck, Eye,
  ExternalLink, User, MessageCircle, DollarSign, QrCode, Copy, Check,
  Edit3, ArrowRight, ArrowLeft, Plus, Trash2, Power, Navigation, Compass,
  Smartphone, CheckCircle
} from "lucide-react";

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
  status: "new" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
  items: string; // JSON
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  captainName?: string | null;
  captainPhone?: string | null;
  customerEmail?: string | null;
  deposit?: number;
  remaining?: number;
  timeline?: string;
  createdAt: string;
}

interface Captain {
  id: string;
  name: string;
  phone: string;
  vehicle?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface ChatMsg {
  id: string;
  senderName: string;
  senderId?: string | null;
  text: string;
  isStaff: boolean;
  customerPhone?: string | null;
  orderId?: string | null;
  createdAt: string;
}

export default function DashboardOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, loading: authLoading } = useStaff();
  const { lang, dir, t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Persistent Alarm State
  const [alarmMuted, setAlarmMuted] = useState(false);

  // Thermal Receipt Preview
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Digital QR Code Modal
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  // Captain Assignment Modal
  const [captainModalOrder, setCaptainModalOrder] = useState<Order | null>(null);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [selectedCaptainPhone, setSelectedCaptainPhone] = useState("");
  const [newCaptainName, setNewCaptainName] = useState("");
  const [newCaptainPhone, setNewCaptainPhone] = useState("");
  const [savingCaptain, setSavingCaptain] = useState(false);

  // Dynamic Fleet Operations Command Center Modal
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [fleetCaptainName, setFleetCaptainName] = useState("");
  const [fleetCaptainPhone, setFleetCaptainPhone] = useState("");
  const [fleetCaptainVehicle, setFleetCaptainVehicle] = useState("سكوتر");
  const [savingFleetCaptain, setSavingFleetCaptain] = useState(false);

  // Dynamic Cairo Delivery Zones Manager State
  const [zonesModalOpen, setZonesModalOpen] = useState(false);
  const [zonesList, setZonesList] = useState<any[]>([]);
  const [zoneSearchQuery, setZoneSearchQuery] = useState("");
  const [newZoneNameAr, setNewZoneNameAr] = useState("");
  const [newZoneFee, setNewZoneFee] = useState("40");
  const [newZoneTime, setNewZoneTime] = useState("45");
  const [savingZone, setSavingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editFeeVal, setEditFeeVal] = useState("");

  // Instant WhatsApp Dispatch Banner after assignment
  const [assignedDispatch, setAssignedDispatch] = useState<{
    order: Order;
    captainName: string;
    captainPhone: string;
  } | null>(null);

  // Live Customer Inquiries / Chat Drawer
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatReplyText, setChatReplyText] = useState("");
  const [chatRecipientPhone, setChatRecipientPhone] = useState("");
  const [selectedChatPhone, setSelectedChatPhone] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [chatView, setChatView] = useState<"list" | "thread">("list");
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const chatCustomers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string; token?: string; count: number; lastMessage: string; lastTime: string }>();
    chatMessages.forEach((m) => {
      const key = m.customerPhone || m.senderId;
      if (key) {
        const existing = map.get(key);
        map.set(key, {
          id: key,
          name: (!m.isStaff && m.senderName) ? m.senderName : (existing?.name || (m.customerPhone ? "عميل" : "زائر ضيف")),
          phone: m.customerPhone || "",
          token: m.senderId || undefined,
          count: (existing?.count || 0) + 1,
          lastMessage: m.text,
          lastTime: m.createdAt,
        });
      }
    });
    return Array.from(map.values());
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedChatPhone && chatCustomers.length > 0) {
      setSelectedChatPhone(chatCustomers[0].id);
      setChatRecipientPhone(chatCustomers[0].phone);
    }
  }, [chatCustomers, selectedChatPhone]);

  const STATUS_TABS = [
    { id: "active",     label: t("النشطة", "Active") },
    { id: "new",        label: t("جديد", "New") },
    { id: "preparing",  label: t("قيد التحضير", "Preparing") },
    { id: "ready",      label: t("جاهز للتسليم", "Ready") },
    { id: "delivering", label: t("مع الكابتن", "With Captain") },
    { id: "delivered",  label: t("تم التسليم والتحصيل", "Delivered & Settled") },
    { id: "cancelled",  label: t("ملغي", "Cancelled") },
  ];

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const list: Order[] = Array.isArray(data) ? data : [];
        setOrders(list);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCaptains = useCallback(async () => {
    try {
      const res = await fetch("/api/captains");
      if (res.ok) {
        const data = await res.json();
        setCaptains(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  const fetchChatMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?isStaffView=1");
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser && !localStorage.getItem("choco_auth_user")) {
        router.push("/login");
        return;
      }
      fetchOrders();
      fetchCaptains();
      fetchChatMessages();
      const interval = setInterval(() => {
        fetchOrders();
        fetchChatMessages();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [authLoading, currentUser, router, fetchOrders, fetchCaptains, fetchChatMessages]);

  // Persistent Looping Alarm for New Orders
  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  useEffect(() => {
    if (newOrdersCount === 0 || alarmMuted) return;

    // Immediately play tone once, then repeat every 3.8s
    playSound("alarm");
    const alarmInterval = setInterval(() => {
      playSound("alarm");
    }, 3800);

    return () => clearInterval(alarmInterval);
  }, [newOrdersCount, alarmMuted]);

  async function updateStatus(orderId: string, nextStatus: string, extraData?: Record<string, any>) {
    setUpdatingId(orderId);
    playSound("click");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          _updatedBy: currentUser?.name || "staff",
          ...extraData,
        }),
      });
      if (res.ok) {
        if (nextStatus === "delivered") playSound("success");
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: nextStatus as any, ...(extraData || {}) }
              : o
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("fleet") === "1" || params.get("view") === "captains") {
        setFleetModalOpen(true);
      }
    }
  }, []);

  // Cairo Delivery Zones API Handlers
  async function fetchZones() {
    try {
      const res = await fetch("/api/delivery-zones?all=1");
      if (res.ok) {
        const data = await res.json();
        setZonesList(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  useEffect(() => {
    fetchZones();
  }, []);

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    if (!newZoneNameAr.trim()) return;
    setSavingZone(true);
    try {
      const res = await fetch("/api/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: newZoneNameAr.trim(),
          fee: parseFloat(newZoneFee) || 0,
          timeMinutes: parseInt(newZoneTime, 10) || 45,
        }),
      });
      if (res.ok) {
        playSound("success");
        setNewZoneNameAr("");
        setNewZoneFee("40");
        setNewZoneTime("45");
        fetchZones();
      }
    } finally {
      setSavingZone(false);
    }
  }

  async function handleToggleZoneActive(id: string, currentActive: boolean) {
    playSound("click");
    try {
      const res = await fetch("/api/delivery-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) fetchZones();
    } catch {}
  }

  async function handleUpdateZoneFee(id: string) {
    if (!editFeeVal) return;
    try {
      const res = await fetch("/api/delivery-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fee: parseFloat(editFeeVal) || 0 }),
      });
      if (res.ok) {
        playSound("success");
        setEditingZoneId(null);
        setEditFeeVal("");
        fetchZones();
      }
    } catch {}
  }

  async function handleDeleteZone(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف منطقة ${name}؟`)) return;
    playSound("alert");
    try {
      const res = await fetch(`/api/delivery-zones?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        playSound("success");
        fetchZones();
      }
    } catch {}
  }

  // Calculate active orders currently with a specific captain
  const getCaptainActiveOrders = useCallback((phone: string) => {
    return orders.filter((o) => o.status === "delivering" && o.captainPhone === phone);
  }, [orders]);

  // Toggle captain on/off duty
  async function handleToggleCaptainActive(cpt: Captain) {
    playSound("click");
    const nextActive = cpt.isActive === false ? true : false;
    try {
      const res = await fetch("/api/captains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cpt.id, isActive: nextActive }),
      });
      if (res.ok) {
        setCaptains((prev) =>
          prev.map((c) => (c.id === cpt.id ? { ...c, isActive: nextActive } : c))
        );
      }
    } catch {}
  }

  // Delete captain from fleet
  async function handleDeleteCaptain(cpt: Captain) {
    if (!confirm(`هل أنت متأكد من حذف الكابتن (${cpt.name}) نهائياً من الأسطول؟`)) return;
    playSound("click");
    try {
      const res = await fetch(`/api/captains?id=${cpt.id}`, { method: "DELETE" });
      if (res.ok) {
        setCaptains((prev) => prev.filter((c) => c.id !== cpt.id));
        playSound("success");
      }
    } catch {}
  }

  // Add new captain to fleet via Command Center
  async function handleAddFleetCaptain(e: React.FormEvent) {
    e.preventDefault();
    if (!fleetCaptainName.trim() || !fleetCaptainPhone.trim()) {
      alert("برجاء إدخال اسم ورقم هاتف الكابتن");
      return;
    }
    setSavingFleetCaptain(true);
    try {
      const res = await fetch("/api/captains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fleetCaptainName.trim(),
          phone: fleetCaptainPhone.trim(),
          vehicle: fleetCaptainVehicle,
          isActive: true,
        }),
      });
      if (res.ok) {
        playSound("success");
        setFleetCaptainName("");
        setFleetCaptainPhone("");
        fetchCaptains();
      }
    } finally {
      setSavingFleetCaptain(false);
    }
  }

  // Assign Captain and change status to 'delivering'
  async function assignCaptainToOrder() {
    if (!captainModalOrder) return;
    setSavingCaptain(true);
    try {
      let captainName = "";
      let captainPhone = "";

      if (selectedCaptainPhone === "custom") {
        captainName = newCaptainName.trim();
        captainPhone = newCaptainPhone.trim();
        if (!captainName || !captainPhone) {
          alert("برجاء إدخال اسم ورقم هاتف الكابتن");
          setSavingCaptain(false);
          return;
        }
        // Save new captain to directory
        await fetch("/api/captains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: captainName, phone: captainPhone, vehicle: "سكوتر دليفري" }),
        });
        fetchCaptains();
      } else {
        const found = captains.find((c) => c.phone === selectedCaptainPhone);
        if (found) {
          captainName = found.name;
          captainPhone = found.phone;
        } else {
          alert("برجاء اختيار كابتن");
          setSavingCaptain(false);
          return;
        }
      }

      await updateStatus(captainModalOrder.id, "delivering", {
        captainName,
        captainPhone,
      });

      playSound("success");
      // Set assigned dispatch banner for 1-click WhatsApp sending
      setAssignedDispatch({
        order: captainModalOrder,
        captainName,
        captainPhone,
      });

      setCaptainModalOrder(null);
      setSelectedCaptainPhone("");
      setNewCaptainName("");
      setNewCaptainPhone("");
    } finally {
      setSavingCaptain(false);
    }
  }

  // Send Staff Reply in Customer Chat
  async function handleSendReply() {
    if (!chatReplyText.trim()) return;
    const activeTarget = chatCustomers.find((c) => c.id === selectedChatPhone);
    const targetPhone = activeTarget?.phone || chatRecipientPhone || null;
    const targetToken = activeTarget?.token || null;
    setSendingReply(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: currentUser?.name || "فريق Waffle House",
          senderRole: currentUser?.role || "staff",
          text: chatReplyText.trim(),
          isStaff: true,
          customerPhone: targetPhone,
          token: targetToken,
        }),
      });
      if (res.ok) {
        setChatReplyText("");
        playSound("chat");
        fetchChatMessages();
      }
    } finally {
      setSendingReply(false);
    }
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((o) => {
    if (selectedTab === "active") {
      return (
        o.status === "new" ||
        o.status === "preparing" ||
        o.status === "ready" ||
        o.status === "delivering"
      );
    }
    return o.status === selectedTab;
  });

  const getTabCount = (tabId: string) => {
    if (tabId === "active") {
      return orders.filter(
        (o) =>
          o.status === "new" ||
          o.status === "preparing" ||
          o.status === "ready" ||
          o.status === "delivering"
      ).length;
    }
    return orders.filter((o) => o.status === tabId).length;
  };

  const parseItems = (raw: string): OrderItem[] => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Helper WhatsApp link for customer
  const getCustomerWhatsAppUrl = (order: Order) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, "");
    const egyptianPhone = cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone;
    const statusLabel =
      order.status === "delivering"
        ? `مع الكابتن ${order.captainName || ""} 🛵 وفي الطريق إليك`
        : order.status === "ready"
        ? "جاهز للتسليم 🛵"
        : order.status === "preparing"
        ? "قيد التحضير في المطبخ 👨‍🍳"
        : "تم استلامه وجاري تنفيذه 📋";

    const msg =
      `مرحباً ${order.customerName} من Waffle House 🧇🍰\n` +
      `بخصوص أوردر رقم: #${order.orderNumber}\n` +
      `الحالة الحالية: ${statusLabel}\n` +
      `الإجمالي المطلوب: ${order.total} ج.م ${order.paymentMethod === "cash" ? "(كاش 💵)" : "(مدفوع إلكترونياً 💳)"}\n` +
      `سعداء بخدمتك دائماً! ❤️`;
    return `https://wa.me/${egyptianPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Smart WhatsApp Dispatch Generator with Google Maps & Full Items Breakdown
  const getCaptainDispatchUrl = (order: Order, captainPhoneOverride?: string, captainNameOverride?: string) => {
    const captPhone = captainPhoneOverride || order.captainPhone || "";
    if (!captPhone) return "#";
    const cleanCaptPhone = captPhone.replace(/[^0-9]/g, "");
    const captIntl = cleanCaptPhone.startsWith("0") ? "2" + cleanCaptPhone : cleanCaptPhone;
    const captName = captainNameOverride || order.captainName || "الكابتن";

    const itemsList = parseItems(order.items)
      .map(
        (it) =>
          `• ${it.qty} × ${lang === "en" ? it.nameEn || it.nameAr : it.nameAr || it.nameEn} ${
            it.extras && it.extras.length ? `(${it.extras.join(" + ")})` : ""
          } [${it.unitPrice * it.qty} ج]`
      )
      .join("\n");

    const addressQuery = encodeURIComponent(
      `${order.address || ""} ${order.zone || "القاهرة"}`
    );
    const mapsUrl = `https://maps.google.com/?q=${addressQuery}`;

    const msg =
      `🛵 *بيان توصيل أوردر جديد — Waffle House 🧇🍰*\n\n` +
      `أهلاً كابتن ${captName}، تفاصيل الطلب للتوصيل الفوري:\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🏷️ *أوردر رقم:* #${order.orderNumber}\n` +
      `👤 *اسم العميل:* ${order.customerName}\n` +
      `📞 *هاتف العميل:* ${order.phone}\n` +
      `📍 *العنوان:* ${order.address || "غير محدد"} (${order.zone || "حدائق القبة"})\n` +
      `🗺️ *لوكيشن الخريطة المباشر:*\n${mapsUrl}\n\n` +
      `🍰 *الأصناف المطلوبة:*\n${itemsList || "أصناف متنوعة"}\n\n` +
      `💰 *المطلوب تحصيله كاش:* ${order.total} ج.م ${
        order.paymentMethod === "cash"
          ? "(💵 كاش عند الاستلام)"
          : "(💳 مدفوع إلكترونياً بالكامل - لا تحصل مبالغ)"
      }\n` +
      (order.notes ? `⚠️ *ملاحظات خاصة:* ${order.notes}\n\n` : `\n`) +
      `بالتوفيق يا بطل! 🚀`;

    return `https://wa.me/${captIntl}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <ErpLayout activeItem="orders">
      <div>
        {/* ── Assigned Dispatch Success Notification (1-Click WhatsApp Send) ── */}
        {assignedDispatch && (
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #7E22CE",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 30px rgba(126, 34, 206, 0.18)",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#FAF5FF",
                  border: "1px solid #E9D5FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7E22CE",
                  flexShrink: 0,
                }}
              >
                <Bike size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 900, color: "#2B170E" }}>
                  🎉 تم إسناد الأوردر #{assignedDispatch.order.orderNumber} للكابتن ({assignedDispatch.captainName}) بنجاح!
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7E5E49" }}>
                  يمكنك إرسال بيان الأوردر ورابط موقع العميل على الخريطة إلى واتساب الكابتن بضغطة زر واحدة الآن
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <a
                href={getCaptainDispatchUrl(
                  assignedDispatch.order,
                  assignedDispatch.captainPhone,
                  assignedDispatch.captainName
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound("click")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                  color: "#FFFFFF",
                  padding: "9px 16px",
                  borderRadius: "12px",
                  fontWeight: 900,
                  fontSize: "13px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(126, 34, 206, 0.3)",
                }}
              >
                <Navigation size={16} />
                <span>إرسال بيان التوصيل واللوكيشن واتساب 📲</span>
              </a>

              <button
                onClick={() => setAssignedDispatch(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7E5E49",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                <XCircle size={22} />
              </button>
            </div>
          </div>
        )}

        {/* ── Persistent Alarm Flashing Banner ── */}
        {newOrdersCount > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              border: "2px solid #fecaca",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 6px 24px rgba(220, 38, 38, 0.45)",
              animation: "pulse 1.8s infinite",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#ffffff" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={26} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 900 }}>
                  {t(
                    `🚨 تنبيه فوري: يوجد ${newOrdersCount} طلب جديد بانتظار استلامك والتحضير!`,
                    `🚨 Alert: ${newOrdersCount} new order(s) waiting for acceptance & prep!`
                  )}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", opacity: 0.9 }}>
                  {t(
                    "صوت المنبه يعمل باستمرار لتنبيه المطبخ والكاشير حتى يتم قبول الطلب",
                    "Continuous kitchen alarm ringing until order is accepted or muted"
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAlarmMuted(!alarmMuted);
                playSound("click");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: alarmMuted ? "#ffffff" : "rgba(0, 0, 0, 0.35)",
                color: alarmMuted ? "#dc2626" : "#ffffff",
                border: "none",
                fontWeight: 900,
                fontSize: "13.5px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              {alarmMuted ? (
                <>
                  <Volume2 size={18} />
                  <span>{t("تشغيل الصوت 🔔", "Unmute Alarm 🔔")}</span>
                </>
              ) : (
                <>
                  <VolumeX size={18} />
                  <span>{t("كتم الصوت مؤقتاً 🔕", "Mute Alarm 🔕")}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Page Header & Top Quick Actions ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#2B170E",
                margin: "0 0 6px 0",
                lineHeight: 1.2,
              }}
            >
              {t("شاشة المطبخ والطلبات ولوجستيات التوصيل", "Kitchen & Delivery Logistics Board")}
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#7E5E49",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {t(
                "إدارة دورة حياة الأوردر — طباعة ريسيت حراري 80mm — تعيين الطيار — تحصيل الفلوس",
                "Full order lifecycle — 80mm thermal receipt printing — Captain assignment & cash settlement"
              )}
            </p>
          </div>

          {/* Quick Actions Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Cairo Delivery Zones Dynamic Pricing Button */}
            <button
              onClick={() => {
                setZonesModalOpen(true);
                fetchZones();
                playSound("click");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1.5px solid #E8DAC8",
                color: "#B45309",
                padding: "9px 16px",
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(180, 83, 9, 0.08)",
                transition: "all 0.15s ease",
              }}
            >
              <span>📍</span>
              <span>مناطق وتسعيرة الدليفري (القاهرة)</span>
              <span
                style={{
                  background: "#FEF3C7",
                  color: "#92400E",
                  fontSize: "11px",
                  padding: "1px 7px",
                  borderRadius: "100px",
                  fontWeight: 900,
                }}
              >
                {zonesList.length} منطقة
              </span>
            </button>

            {/* Dynamic Fleet Command Center Button */}
            <button
              onClick={() => {
                setFleetModalOpen(true);
                playSound("click");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                color: "#7E22CE",
                padding: "9px 16px",
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(126, 34, 206, 0.08)",
                transition: "all 0.15s ease",
              }}
            >
              <Bike size={17} color="#7E22CE" />
              <span>{t("أسطول الطيارين 🛵", "Delivery Fleet 🛵")}</span>
              <span
                style={{
                  background: "#FAF5FF",
                  border: "1px solid #E9D5FF",
                  color: "#7E22CE",
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "1px 7px",
                  borderRadius: "100px",
                }}
              >
                {captains.filter((c) => c.isActive !== false).length} متاح
              </span>
            </button>

            <button
              onClick={() => {
                setChatDrawerOpen(true);
                playSound("click");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                color: "#C6873E",
                padding: "9px 16px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(198, 135, 62, 0.08)",
                transition: "all 0.15s ease",
              }}
            >
              <MessageSquare size={16} />
              <span>{t("شات واستفسارات العملاء 💬", "Customer Live Chat 💬")}</span>
              {chatMessages.length > 0 && (
                <span
                  style={{
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "1px 7px",
                    borderRadius: "100px",
                  }}
                >
                  {chatMessages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                fetchOrders();
                fetchCaptains();
                playSound("click");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                color: "#C6873E",
                padding: "9px 14px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(198, 135, 62, 0.08)",
              }}
            >
              <RefreshCw size={15} />
              <span>{t("تحديث 🔄", "Refresh 🔄")}</span>
            </button>
          </div>
        </div>

        {/* ── Horizontal Status Tabs ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          {STATUS_TABS.map((tab) => {
            const count = getTabCount(tab.id);
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  playSound("click");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 16px",
                  borderRadius: "100px",
                  border: isSelected ? "none" : "1px solid #E8DAC8",
                  background: isSelected
                    ? "linear-gradient(135deg, #D4954E, #C6873E)"
                    : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#6B4F3B",
                  fontSize: "13px",
                  fontWeight: isSelected ? 900 : 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected
                    ? "0 4px 14px rgba(198, 135, 62, 0.28)"
                    : "0 2px 6px rgba(43,23,14,0.04)",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    opacity: 0.9,
                    background: isSelected ? "rgba(0,0,0,0.18)" : "#FAF6EE",
                    color: isSelected ? "#FFFFFF" : "#C6873E",
                    padding: "1px 7px",
                    borderRadius: "100px",
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Orders Display Container ── */}
        {filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8DAC8",
              borderRadius: "24px",
              minHeight: "360px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(43,23,14,0.04)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "#FAF6EE",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
                color: "#C6873E",
              }}
            >
              <ClipboardList size={32} strokeWidth={2} />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: "#2B170E",
                margin: "0 0 6px 0",
              }}
            >
              {t("لا توجد طلبات في هذا القسم", "No orders in this section")}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#7E5E49",
                margin: 0,
                maxWidth: "380px",
                lineHeight: 1.6,
              }}
            >
              {t(
                "أي طلب جديد من الموقع هيظهر هنا فوراً مع تنبيه صوتي مستمر",
                "Any new order from the website will appear here immediately with continuous sound alert"
              )}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredOrders.map((order) => {
              const items = parseItems(order.items);
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#FFFFFF",
                    border:
                      order.status === "new"
                        ? "2px solid #F59E0B"
                        : order.status === "delivering"
                        ? "2px solid #A855F7"
                        : "1px solid #E8DAC8",
                    borderRadius: "20px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 6px 20px rgba(43,23,14,0.06)",
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Header: Order Number + Actions (Receipt & Status Badge) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: "#C6873E",
                            fontWeight: 900,
                            fontSize: "16px",
                          }}
                        >
                          {order.orderNumber}
                        </span>

                        {/* Direct Print Thermal Receipt Button */}
                        <button
                          onClick={() => printThermalReceipt(order as any)}
                          title={t("طباعة ريسيت حراري فوري 🖨️", "Print Thermal Receipt 🖨️")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(198, 135, 62, 0.12)",
                            border: "1px solid #E8DAC8",
                            color: "#C6873E",
                            borderRadius: "8px",
                            padding: "4px 9px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <Printer size={13} />
                          <span>80mm</span>
                        </button>

                        {/* Digital QR Receipt Button */}
                        <button
                          onClick={() => {
                            setQrModalOrder(order);
                            playSound("click");
                          }}
                          title={t("كيو ار الفاتورة الذكية للموبايل 📱", "Digital QR Receipt 📱")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#FAF5FF",
                            border: "1px solid #E9D5FF",
                            color: "#7E22CE",
                            borderRadius: "8px",
                            padding: "4px 9px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <QrCode size={13} />
                          <span>QR 📱</span>
                        </button>

                        {/* Edit Order Button */}
                        {order.status !== "delivered" && order.status !== "cancelled" && (
                          <button
                            onClick={() => {
                              setOrderToEdit(order);
                              playSound("click");
                            }}
                            title={t("تعديل أصناف وتفاصيل الأوردر ✏️", "Edit Order Items & Details ✏️")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#EFF6FF",
                              border: "1px solid #BFDBFE",
                              color: "#1D4ED8",
                              borderRadius: "8px",
                              padding: "4px 9px",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <Edit3 size={13} />
                            <span>{t("تعديل ✏️", "Edit ✏️")}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPreviewOrder(order)}
                          title={t("معاينة الفاتورة", "Preview Receipt")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#7E5E49",
                            cursor: "pointer",
                            padding: "2px",
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      </div>

                      {/* Status Badge + Edited Flag */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {order.timeline?.includes("edited") && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 900,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: "#FFF7ED",
                              border: "1px solid #FDBA74",
                              color: "#C2410C",
                            }}
                            title={t("تم تعديل أصناف هذا الطلب", "Order has been edited")}
                          >
                            معدّل ✏️
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 800,
                            padding: "4px 11px",
                            borderRadius: "100px",
                            background:
                              order.status === "new"
                                ? "#FEF3C7"
                                : order.status === "preparing"
                                ? "#DBEAFE"
                                : order.status === "ready"
                                ? "#D1FAE5"
                                : order.status === "delivering"
                                ? "#F3E8FF"
                                : order.status === "delivered"
                                ? "#DCFCE7"
                                : "#FEE2E2",
                            color:
                              order.status === "new"
                                ? "#92400E"
                                : order.status === "preparing"
                                ? "#1E40AF"
                                : order.status === "ready"
                                ? "#065F46"
                                : order.status === "delivering"
                                ? "#6B21A8"
                                : order.status === "delivered"
                                ? "#15803D"
                                : "#991B1B",
                            border:
                              order.status === "new"
                                ? "1px solid #FCD34D"
                                : order.status === "preparing"
                                ? "1px solid #93C5FD"
                                : order.status === "ready"
                                ? "1px solid #6EE7B7"
                                : order.status === "delivering"
                                ? "1px solid #D8B4FE"
                                : order.status === "delivered"
                                ? "1px solid #86EFAC"
                                : "1px solid #FCA5A5",
                          }}
                        >
                          {order.status === "new"
                            ? t("جديد 📋", "New 📋")
                            : order.status === "preparing"
                            ? t("قيد التحضير 👨‍🍳", "Preparing 👨‍🍳")
                            : order.status === "ready"
                            ? t("جاهز للتسليم 🛵", "Ready 🛵")
                            : order.status === "delivering"
                            ? t("مع الكابتن 🚴", "With Captain 🚴")
                            : order.status === "delivered"
                            ? t("تم التسليم والتحصيل 🎉", "Delivered 🎉")
                            : t("ملغي ❌", "Cancelled ❌")}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info Card */}
                    <div
                      style={{
                        marginBottom: "14px",
                        background: "#FAF6EE",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: "1px solid #E8DAC8",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "15px",
                            fontWeight: 900,
                            color: "#2B170E",
                            margin: 0,
                          }}
                        >
                          {order.customerName}
                        </h4>

                        {/* Customer WhatsApp Free Link */}
                        <a
                          href={getCustomerWhatsAppUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playSound("click")}
                          title={t("مراسلة العميل عبر واتساب مجاناً", "Message Customer on WhatsApp")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#DCFCE7",
                            border: "1px solid #86EFAC",
                            color: "#15803D",
                            borderRadius: "8px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            textDecoration: "none",
                          }}
                        >
                          <MessageCircle size={12} />
                          <span>واتساب 💬</span>
                        </a>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12.5px",
                          color: "#6B4F3B",
                          marginBottom: "4px",
                        }}
                      >
                        <Phone size={13} color="#C6873E" />
                        <a
                          href={`tel:${order.phone}`}
                          style={{ color: "#2B170E", textDecoration: "none", fontWeight: 700 }}
                          dir="ltr"
                        >
                          {order.phone}
                        </a>
                      </div>

                      {order.address && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            color: "#7E5E49",
                          }}
                        >
                          <MapPin size={13} color="#C6873E" />
                          <span>
                            {order.address} ({order.zone || "حدائق القبة"})
                          </span>
                        </div>
                      )}

                      {order.notes && (
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "11.5px",
                            color: "#B45309",
                            background: "#FEF3C7",
                            border: "1px solid #FDE68A",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                        >
                          ⚠️ {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Captain Info (If Assigned) */}
                    {order.captainName && (
                      <div
                        style={{
                          background: "#FAF5FF",
                          border: "1px solid #E9D5FF",
                          borderRadius: "14px",
                          padding: "12px",
                          marginBottom: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "10px",
                                background: "#F3E8FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#7E22CE",
                              }}
                            >
                              <Bike size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", color: "#7E22CE", fontWeight: 700 }}>
                                {t("طيار التوصيل المسؤول:", "Assigned Captain:")}
                              </div>
                              <div style={{ fontSize: "14px", fontWeight: 900, color: "#2B170E" }}>
                                {order.captainName}
                              </div>
                              {order.captainPhone && (
                                <div style={{ fontSize: "11.5px", color: "#6B21A8", fontWeight: 700 }} dir="ltr">
                                  {order.captainPhone}
                                </div>
                              )}
                            </div>
                          </div>

                          {order.captainPhone && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <a
                                href={getCaptainDispatchUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="إرسال بيان الطلب ورابط اللوكيشن للطيار عبر واتساب"
                                style={{
                                  background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                                  color: "#FFFFFF",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "6px 11px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  boxShadow: "0 2px 8px rgba(126, 34, 206, 0.25)",
                                }}
                              >
                                <Navigation size={12} />
                                <span>واتساب الأوردر 📲</span>
                              </a>

                              <a
                                href={`tel:${order.captainPhone}`}
                                title="اتصال مباشر بالطيار"
                                style={{
                                  background: "#FFFFFF",
                                  color: "#7E22CE",
                                  border: "1px solid #D8B4FE",
                                  borderRadius: "8px",
                                  padding: "6px 9px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                              >
                                <Phone size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginBottom: "16px",
                        maxHeight: "180px",
                        overflowY: "auto",
                        background: "#FAF6EE",
                        border: "1px solid #E8DAC8",
                        borderRadius: "12px",
                        padding: "10px 12px",
                      }}
                    >
                      {items.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            borderBottom: idx === items.length - 1 ? "none" : "1px dashed #E8DAC8",
                            paddingBottom: "4px",
                          }}
                        >
                          <div>
                            <span style={{ color: "#2B170E", fontWeight: 800 }}>
                              {it.qty} ×{" "}
                              {lang === "en"
                                ? it.nameEn || it.nameAr
                                : it.nameAr || it.nameEn}
                            </span>
                            {it.extras && it.extras.length > 0 && (
                              <div style={{ fontSize: "11px", color: "#C6873E", marginTop: "2px", fontWeight: 700 }}>
                                + {it.extras.join(" + ")}
                              </div>
                            )}
                          </div>
                          <span style={{ color: "#C6873E", fontWeight: 900 }}>
                            {it.unitPrice * it.qty} {t("ج", "EGP")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Financials & Action Buttons */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderTop: "1px solid #E8DAC8",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "12px", color: "#7E5E49", display: "block" }}>
                          {t("المطلوب تحصيله", "To Collect")}{" "}
                          {order.paymentMethod === "cash" ? "(كاش 💵)" : "(مدفوع 💳)"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#C6873E", fontWeight: 700 }}>
                          + توصيل {order.deliveryFee} ج
                        </span>
                      </div>
                      <span style={{ fontSize: "20px", color: "#C6873E", fontWeight: 900 }}>
                        {order.total} {t("ج", "EGP")}
                      </span>
                    </div>

                    {/* Step-by-Step Logistics Flow */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {/* NEW -> PREPARING */}
                      {order.status === "new" && (
                        <button
                          onClick={() => updateStatus(order.id, "preparing")}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #D4954E, #C6873E)",
                            color: "#FFFFFF",
                            fontWeight: 900,
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(198, 135, 62, 0.25)",
                          }}
                        >
                          <ChefHat size={16} />
                          <span>{t("بدء التحضير 👨‍🍳", "Start Preparing 👨‍🍳")}</span>
                        </button>
                      )}

                      {/* PREPARING -> READY */}
                      {order.status === "preparing" && (
                        <button
                          onClick={() => updateStatus(order.id, "ready")}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #10B981, #059669)",
                            color: "#FFFFFF",
                            fontWeight: 900,
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>{t("جاهز للتوصيل 🛵", "Ready for Delivery 🛵")}</span>
                        </button>
                      )}

                      {/* READY -> ASSIGN CAPTAIN -> DELIVERING */}
                      {order.status === "ready" && (
                        <button
                          onClick={() => {
                            setCaptainModalOrder(order);
                            const firstAvailable = captains.find(
                              (c) => c.isActive !== false && getCaptainActiveOrders(c.phone).length === 0
                            );
                            setSelectedCaptainPhone(firstAvailable?.phone || captains[0]?.phone || "custom");
                            playSound("click");
                          }}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                            color: "#FFFFFF",
                            fontWeight: 900,
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 4px 14px rgba(126, 34, 206, 0.28)",
                          }}
                        >
                          <Bike size={16} />
                          <span>{t("تسليم للطيار 🛵", "Assign to Captain 🛵")}</span>
                        </button>
                      )}

                      {/* DELIVERING -> SETTLED & DELIVERED */}
                      {order.status === "delivering" && (
                        <button
                          onClick={() => updateStatus(order.id, "delivered")}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #22C55E, #16A34A)",
                            color: "#FFFFFF",
                            fontWeight: 900,
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 4px 14px rgba(34, 197, 94, 0.28)",
                          }}
                        >
                          <DollarSign size={16} />
                          <span>{t("تم التحصيل والتسليم 🎉", "Collect Cash & Deliver 🎉")}</span>
                        </button>
                      )}

                      {/* CANCEL */}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(order.id, "cancelled")}
                          disabled={isUpdating}
                          style={{
                            padding: "0 12px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "#FEE2E2",
                            border: "1px solid #FCA5A5",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                          title={t("إلغاء الطلب", "Cancel Order")}
                        >
                          {t("إلغاء ❌", "Cancel ❌")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MODAL 1: SMART CAPTAIN ASSIGNMENT MODAL (INNOVATIVE LOAD TRACKER)
        ══════════════════════════════════════════════════════════ */}
        {captainModalOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              background: "rgba(43, 23, 14, 0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                borderRadius: "24px",
                padding: "26px",
                maxWidth: "520px",
                width: "100%",
                boxShadow: "0 24px 64px rgba(43,23,14,0.22)",
                color: "#2B170E",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid #E8DAC8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#FAF5FF",
                      border: "1px solid #E9D5FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#7E22CE",
                    }}
                  >
                    <Bike size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17.5px", fontWeight: 900, color: "#2B170E" }}>
                      {t("إسناد الأوردر لطيار الدليفري 🛵", "Assign Delivery Captain")}
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#C6873E", fontWeight: 700 }}>
                      أوردر #{captainModalOrder.orderNumber} • المطلوب تحصيله: {captainModalOrder.total} ج.م ({captainModalOrder.zone || "حدائق القبة"})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCaptainModalOrder(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#7E5E49",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Captain Selection List with Live Workload Indicator */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#2B170E",
                    }}
                  >
                    {t("اختر الطيار من الأسطول (مرتب بالحمل والجاهزية):", "Select Captain (Live Load Ranked):")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptainModalOrder(null);
                      setFleetModalOpen(true);
                      playSound("click");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#7E22CE",
                      fontSize: "11.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {t("إدارة الأسطول ⚙️", "Manage Fleet ⚙️")}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
                  {captains.map((cpt) => {
                    const activeLoad = getCaptainActiveOrders(cpt.phone);
                    const isSelected = selectedCaptainPhone === cpt.phone;
                    const isOffline = cpt.isActive === false;

                    return (
                      <label
                        key={cpt.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "14px",
                          background: isSelected
                            ? "rgba(198, 135, 62, 0.1)"
                            : isOffline
                            ? "#F5F5F4"
                            : "#FAF6EE",
                          border: isSelected
                            ? "2px solid #C6873E"
                            : "1px solid #E8DAC8",
                          cursor: "pointer",
                          opacity: isOffline ? 0.65 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="captain"
                          value={cpt.phone}
                          checked={selectedCaptainPhone === cpt.phone}
                          onChange={() => setSelectedCaptainPhone(cpt.phone)}
                          style={{ accentColor: "#C6873E" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                            <span style={{ fontWeight: 900, fontSize: "14px", color: "#2B170E" }}>
                              {cpt.name}
                            </span>
                            {/* Live Load Badge */}
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "100px",
                                background: isOffline
                                  ? "#E7E5E4"
                                  : activeLoad.length === 0
                                  ? "#DCFCE7"
                                  : activeLoad.length === 1
                                  ? "#FEF3C7"
                                  : "#FEE2E2",
                                color: isOffline
                                  ? "#78716C"
                                  : activeLoad.length === 0
                                  ? "#15803D"
                                  : activeLoad.length === 1
                                  ? "#B45309"
                                  : "#B91C1C",
                              }}
                            >
                              {isOffline
                                ? "⚪ غير متاح (استراحة)"
                                : activeLoad.length === 0
                                ? "🟢 متاح وجاهز (0 أوردرات) ⭐"
                                : activeLoad.length === 1
                                ? `🟡 في الطريق (أوردر #${activeLoad[0].orderNumber})`
                                : `🔴 حمولة (${activeLoad.length} أوردرات)`}
                            </span>
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#7E5E49" }} dir="ltr">
                            {cpt.phone} • {cpt.vehicle || "سكوتر دليفري"}
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  {/* Option for New / External Captain */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 14px",
                      borderRadius: "14px",
                      background:
                        selectedCaptainPhone === "custom"
                          ? "rgba(198, 135, 62, 0.1)"
                          : "#FAF6EE",
                      border:
                        selectedCaptainPhone === "custom"
                          ? "2px solid #C6873E"
                          : "1px solid #E8DAC8",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="captain"
                      value="custom"
                      checked={selectedCaptainPhone === "custom"}
                      onChange={() => setSelectedCaptainPhone("custom")}
                      style={{ accentColor: "#C6873E" }}
                    />
                    <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#2B170E" }}>
                      {t("طيار جديد / خارجي مؤقت ➕", "Add New / External Courier ➕")}
                    </div>
                  </label>
                </div>
              </div>

              {/* If Custom Captain Selected */}
              {selectedCaptainPhone === "custom" && (
                <div
                  style={{
                    background: "#FAF6EE",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid #E8DAC8",
                    marginBottom: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", color: "#7E5E49", display: "block", marginBottom: "4px", fontWeight: 700 }}>
                      اسم الكابتن:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: كابتن خالد المصري"
                      value={newCaptainName}
                      onChange={(e) => setNewCaptainName(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        background: "#FFFFFF",
                        border: "1px solid #E8DAC8",
                        borderRadius: "10px",
                        padding: "0 12px",
                        color: "#2B170E",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#7E5E49", display: "block", marginBottom: "4px", fontWeight: 700 }}>
                      رقم موبايل الكابتن:
                    </label>
                    <input
                      type="tel"
                      placeholder="010XXXXXXXX"
                      value={newCaptainPhone}
                      onChange={(e) => setNewCaptainPhone(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        background: "#FFFFFF",
                        border: "1px solid #E8DAC8",
                        borderRadius: "10px",
                        padding: "0 12px",
                        color: "#2B170E",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={assignCaptainToOrder}
                  disabled={savingCaptain}
                  style={{
                    flex: 1,
                    height: "44px",
                    background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "14px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(126, 34, 206, 0.28)",
                  }}
                >
                  {savingCaptain
                    ? t("جاري التعيين...", "Assigning...")
                    : t("تأكيد وإسناد الأوردر للطيار 🛵", "Confirm & Assign 🛵")}
                </button>
                <button
                  onClick={() => setCaptainModalOrder(null)}
                  style={{
                    height: "44px",
                    padding: "0 18px",
                    background: "#FAF6EE",
                    border: "1px solid #E8DAC8",
                    color: "#7E5E49",
                    fontWeight: 700,
                    fontSize: "13px",
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                >
                  {t("إلغاء", "Cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            NEW MODAL: FLEET OPERATIONS COMMAND CENTER (غرفة عمليات وإدارة أسطول الطيارين 🛵)
        ══════════════════════════════════════════════════════════ */}
        {fleetModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              background: "rgba(43, 23, 14, 0.55)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "720px",
                maxHeight: "92vh",
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(43,23,14,0.25)",
                color: "#2B170E",
              }}
            >
              {/* Fleet Modal Header */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #E8DAC8",
                  background: "#FAF6EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#FAF5FF",
                      border: "1px solid #E9D5FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#7E22CE",
                    }}
                  >
                    <Bike size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#2B170E" }}>
                      {t("غرفة عمليات وإدارة أسطول التوصيل والطيارين 🛵", "Delivery Fleet Operations Center")}
                    </h2>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7E5E49" }}>
                      {t(
                        "متابعة حية لحمولة كل طيار، إرسال بيانات اللوكيشن، التبديل بين متاح واستراحة، وإضافة طيارين",
                        "Live courier workload tracking, WhatsApp GPS dispatch, active toggles & fleet CRUD"
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setFleetModalOpen(false)}
                  style={{
                    background: "#FAF6EE",
                    border: "1px solid #E8DAC8",
                    color: "#7E5E49",
                    borderRadius: "10px",
                    padding: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Fleet Modal Body */}
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 4 Fleet Overview Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "#FAF6EE",
                      border: "1px solid #E8DAC8",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#7E5E49", fontWeight: 700 }}>
                      إجمالي الأسطول
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#2B170E", marginTop: "2px" }}>
                      {captains.length} 🛵
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#DCFCE7",
                      border: "1px solid #86EFAC",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#15803D", fontWeight: 700 }}>
                      متاحون للطلب الآن
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#15803D", marginTop: "2px" }}>
                      {captains.filter((c) => c.isActive !== false).length} 🟢
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#FAF5FF",
                      border: "1px solid #E9D5FF",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#7E22CE", fontWeight: 700 }}>
                      أوردرات في الطريق حالياً
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#7E22CE", marginTop: "2px" }}>
                      {orders.filter((o) => o.status === "delivering").length} ⚡
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#FEF3C7",
                      border: "1px solid #FDE68A",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#92400E", fontWeight: 700 }}>
                      طلبات سُلمت بالكامل
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#92400E", marginTop: "2px" }}>
                      {orders.filter((o) => o.status === "delivered").length} ✅
                    </div>
                  </div>
                </div>

                {/* Section 1: Quick Add Captain to Fleet */}
                <form
                  onSubmit={handleAddFleetCaptain}
                  style={{
                    background: "#FAF6EE",
                    border: "1px solid #E8DAC8",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#2B170E", marginBottom: "10px" }}>
                    {t("إضافة طيار جديد لأسطول وافل هاوس ➕", "Add New Courier to Fleet ➕")}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <input
                        type="text"
                        placeholder="اسم الكابتن (مثال: كابتن أحمد حسن)"
                        value={fleetCaptainName}
                        onChange={(e) => setFleetCaptainName(e.target.value)}
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "13px",
                          color: "#2B170E",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="رقم الموبايل (مثال: 010XXXXXXXX)"
                        value={fleetCaptainPhone}
                        onChange={(e) => setFleetCaptainPhone(e.target.value)}
                        dir="ltr"
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "13px",
                          color: "#2B170E",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <select
                        value={fleetCaptainVehicle}
                        onChange={(e) => setFleetCaptainVehicle(e.target.value)}
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 10px",
                          fontSize: "13px",
                          color: "#2B170E",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      >
                        <option value="سكوتر">🛵 سكوتر دليفري</option>
                        <option value="موتوسيكل">🏍️ موتوسيكل</option>
                        <option value="عجلة">🚲 دراجة / عجلة</option>
                        <option value="سيارة">🚗 سيارة خاصة</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingFleetCaptain || !fleetCaptainName.trim() || !fleetCaptainPhone.trim()}
                    style={{
                      height: "40px",
                      padding: "0 20px",
                      background: "linear-gradient(135deg, #D4954E, #C6873E)",
                      color: "#FFFFFF",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 900,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(198, 135, 62, 0.25)",
                    }}
                  >
                    <Plus size={16} />
                    <span>{savingFleetCaptain ? t("جاري الحفظ...", "Saving...") : t("حفظ وإضافة للأسطول 🚀", "Save Courier 🚀")}</span>
                  </button>
                </form>

                {/* Section 2: Fleet Directory & Live Operations List */}
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#2B170E", marginBottom: "12px" }}>
                    {t("قائمة الطيارين والتشغيل المباشر:", "Active Fleet Couriers & Real-Time Status:")}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {captains.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 20px", color: "#7E5E49" }}>
                        لا يوجد طيارين مسجلين بعد. أضف أول طيار من النموذج أعلاه.
                      </div>
                    ) : (
                      captains.map((cpt) => {
                        const activeOrders = getCaptainActiveOrders(cpt.phone);
                        const isOffline = cpt.isActive === false;

                        return (
                          <div
                            key={cpt.id}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #E8DAC8",
                              borderRadius: "16px",
                              padding: "16px",
                              boxShadow: "0 2px 8px rgba(43,23,14,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "12px",
                                    background: isOffline ? "#F5F5F4" : "#FAF5FF",
                                    border: isOffline ? "1px solid #E7E5E4" : "1px solid #E9D5FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: isOffline ? "#78716C" : "#7E22CE",
                                    fontSize: "20px",
                                  }}
                                >
                                  {cpt.vehicle?.includes("موتوسيكل")
                                    ? "🏍️"
                                    : cpt.vehicle?.includes("عجلة")
                                    ? "🚲"
                                    : cpt.vehicle?.includes("سيارة")
                                    ? "🚗"
                                    : "🛵"}
                                </div>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#2B170E" }}>
                                      {cpt.name}
                                    </h4>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 800,
                                        padding: "2px 8px",
                                        borderRadius: "100px",
                                        background: isOffline ? "#F5F5F4" : "#DCFCE7",
                                        color: isOffline ? "#78716C" : "#15803D",
                                        border: isOffline ? "1px solid #E7E5E4" : "1px solid #86EFAC",
                                      }}
                                    >
                                      {isOffline ? "⚪ خارج الخدمة (إجازة)" : "🟢 نشط بالخدمة"}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#7E5E49", marginTop: "2px" }} dir="ltr">
                                    {cpt.phone} • {cpt.vehicle || "سكوتر دليفري"}
                                  </div>
                                </div>
                              </div>

                              {/* Controls: Active Toggle, Direct WhatsApp, Direct Call, Delete */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCaptainActive(cpt)}
                                  title={isOffline ? "تفعيل الكابتن للخدمة" : "تعطيل الكابتن مؤقتاً"}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    height: "34px",
                                    padding: "0 10px",
                                    borderRadius: "8px",
                                    background: isOffline ? "#FAF6EE" : "#F0FDF4",
                                    border: isOffline ? "1px solid #E8DAC8" : "1px solid #BBF7D0",
                                    color: isOffline ? "#7E5E49" : "#15803D",
                                    fontSize: "11.5px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                >
                                  <Power size={13} />
                                  <span>{isOffline ? "تفعيل 🟢" : "استراحة ⚪"}</span>
                                </button>

                                <a
                                  href={`https://wa.me/${
                                    cpt.phone.replace(/[^0-9]/g, "").startsWith("0")
                                      ? "2" + cpt.phone.replace(/[^0-9]/g, "")
                                      : cpt.phone.replace(/[^0-9]/g, "")
                                  }?text=${encodeURIComponent("مرحباً كابتن " + cpt.name + " من إدارة Waffle House 🧇🍰")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="مراسلة الكابتن عبر واتساب"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "8px",
                                    background: "#DCFCE7",
                                    border: "1px solid #86EFAC",
                                    color: "#15803D",
                                    textDecoration: "none",
                                  }}
                                >
                                  <MessageCircle size={15} />
                                </a>

                                <a
                                  href={`tel:${cpt.phone}`}
                                  title="اتصال هاتفي بالكابتن"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "8px",
                                    background: "#FAF6EE",
                                    border: "1px solid #E8DAC8",
                                    color: "#2B170E",
                                    textDecoration: "none",
                                  }}
                                >
                                  <Phone size={14} />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCaptain(cpt)}
                                  title="حذف الكابتن من الأسطول"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "8px",
                                    background: "#FEE2E2",
                                    border: "1px solid #FCA5A5",
                                    color: "#DC2626",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Active Orders List with this Captain */}
                            {activeOrders.length > 0 ? (
                              <div
                                style={{
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px dashed #E8DAC8",
                                }}
                              >
                                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#7E22CE", marginBottom: "6px" }}>
                                  ⚡ أوردرات في الطريق حالياً مع هذا الكابتن ({activeOrders.length}):
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {activeOrders.map((ord) => (
                                    <div
                                      key={ord.id}
                                      style={{
                                        background: "#FAF5FF",
                                        border: "1px solid #E9D5FF",
                                        borderRadius: "10px",
                                        padding: "8px 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <div>
                                        <strong style={{ color: "#7E22CE" }}>#{ord.orderNumber}</strong> •{" "}
                                        <span style={{ fontWeight: 800, color: "#2B170E" }}>{ord.customerName}</span> •{" "}
                                        <span style={{ color: "#7E5E49" }}>{ord.address || ord.zone || "حدائق القبة"}</span>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontWeight: 900, color: "#C6873E" }}>
                                          تحصيل: {ord.total} ج
                                        </span>
                                        <a
                                          href={getCaptainDispatchUrl(ord, cpt.phone, cpt.name)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                                            color: "#FFFFFF",
                                            borderRadius: "6px",
                                            padding: "3px 8px",
                                            fontSize: "11px",
                                            fontWeight: 800,
                                            textDecoration: "none",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                          }}
                                        >
                                          <Navigation size={11} />
                                          <span>واتساب الأوردر واللوكيشن</span>
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  marginTop: "8px",
                                  fontSize: "11.5px",
                                  color: isOffline ? "#78716C" : "#15803D",
                                  fontWeight: 700,
                                }}
                              >
                                {isOffline ? "• خارج الوردية حالياً" : "• متاح ولا يحمل أي طلبات حالياً (جاهز للتحميل)"}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Fleet Modal Footer */}
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid #E8DAC8",
                  background: "#FAF6EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "12px", color: "#7E5E49", fontWeight: 700 }}>
                  Waffle House Fleet Intelligence Engine 🛵
                </span>
                <button
                  type="button"
                  onClick={() => setFleetModalOpen(false)}
                  style={{
                    height: "36px",
                    padding: "0 18px",
                    background: "#FFFFFF",
                    border: "1px solid #E8DAC8",
                    color: "#2B170E",
                    fontWeight: 800,
                    fontSize: "13px",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  {t("إغلاق", "Close")}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ═══════════════════════════════════════════════════════
            NEW MODAL: CAIRO DELIVERY ZONES & DYNAMIC PRICING MANAGER 📍
        ══════════════════════════════════════════════════════════ */}
        {zonesModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              background: "rgba(43, 23, 14, 0.55)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "760px",
                maxHeight: "90vh",
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "1.5px solid #E8DAC8",
                boxShadow: "0 25px 60px rgba(43, 23, 14, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                direction: "rtl",
                fontFamily: "var(--font-cairo), system-ui, sans-serif",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px 24px",
                  background: "linear-gradient(135deg, #FFFDF8 0%, #FAF7F2 100%)",
                  borderBottom: "1.5px solid #E8DAC8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #B45309, #D97706)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    📍
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#3E0E00" }}>
                      إدارة مناطق وتسعيرة الدليفري — محافظة القاهرة 🛵
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7E5E49", fontWeight: 700 }}>
                      تعديل تسعيرة التوصيل حسب كل منطقة في القاهرة ديناميكياً مع التحديث الفوري في السلة والكاشير
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setZonesModalOpen(false)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#FAF7F2",
                    border: "1px solid #E8DAC8",
                    color: "#7E5E49",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 900,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                {/* Add New Zone Form */}
                <form
                  onSubmit={handleAddZone}
                  style={{
                    background: "#FAF7F2",
                    border: "1.5px dashed #D97706",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#92400E", marginBottom: "12px" }}>
                    ➕ إضافة منطقة توصيل جديدة في القاهرة:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "flex-end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#3E0E00", marginBottom: "4px" }}>
                        اسم المنطقة (بالعربي):
                      </label>
                      <input
                        type="text"
                        value={newZoneNameAr}
                        onChange={(e) => setNewZoneNameAr(e.target.value)}
                        placeholder="مثال: التجمع الخامس، مدينة نصر..."
                        required
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1.5px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "13px",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#3E0E00", marginBottom: "4px" }}>
                        رسوم التوصيل (ج.م):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={newZoneFee}
                        onChange={(e) => setNewZoneFee(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1.5px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "13px",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#3E0E00", marginBottom: "4px" }}>
                        الوقت المتوقع (دقيقة):
                      </label>
                      <input
                        type="number"
                        min="15"
                        step="5"
                        value={newZoneTime}
                        onChange={(e) => setNewZoneTime(e.target.value)}
                        style={{
                          width: "100%",
                          height: "40px",
                          background: "#FFFFFF",
                          border: "1.5px solid #E8DAC8",
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "13px",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingZone}
                      style={{
                        height: "40px",
                        padding: "0 18px",
                        background: "linear-gradient(135deg, #3E0E00, #6E2208)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 900,
                        fontSize: "13px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {savingZone ? "جاري الإضافة..." : "حفظ المنطقة"}
                    </button>
                  </div>
                </form>

                {/* Filter Search Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
                  <input
                    type="text"
                    value={zoneSearchQuery}
                    onChange={(e) => setZoneSearchQuery(e.target.value)}
                    placeholder="🔍 ابحث عن منطقة (مثلاً: التجمع، المعادي، المهندسين...)"
                    style={{
                      flex: 1,
                      height: "40px",
                      background: "#FAF7F2",
                      border: "1px solid #E8DAC8",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#7E5E49", fontWeight: 800 }}>
                    إجمالي المناطق: {zonesList.length}
                  </div>
                </div>

                {/* Zones List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {zonesList
                    .filter((z) => !zoneSearchQuery.trim() || z.nameAr?.includes(zoneSearchQuery.trim()) || z.nameEn?.toLowerCase().includes(zoneSearchQuery.toLowerCase()))
                    .map((z) => (
                      <div
                        key={z.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: z.isActive !== false ? "#FFFFFF" : "#F3F4F6",
                          border: "1.5px solid #E8DAC8",
                          borderRadius: "14px",
                          opacity: z.isActive !== false ? 1 : 0.65,
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>📍</span>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: "14px", color: "#3E0E00" }}>
                              {z.nameAr}
                            </div>
                            <div style={{ fontSize: "11px", color: "#8A7565" }}>
                              {z.nameEn || z.nameAr} • وقت التوصيل التقديري: {z.timeMinutes || 45} دقيقة
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Fee Badge & Inline Editor */}
                          {editingZoneId === z.id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="number"
                                value={editFeeVal}
                                onChange={(e) => setEditFeeVal(e.target.value)}
                                autoFocus
                                style={{
                                  width: "70px",
                                  height: "32px",
                                  border: "1.5px solid #D97706",
                                  borderRadius: "8px",
                                  padding: "0 8px",
                                  fontSize: "13px",
                                  fontWeight: 900,
                                  textAlign: "center",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateZoneFee(z.id)}
                                style={{
                                  height: "32px",
                                  padding: "0 10px",
                                  background: "#059669",
                                  color: "#FFFFFF",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontWeight: 900,
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingZoneId(null)}
                                style={{
                                  height: "32px",
                                  padding: "0 8px",
                                  background: "#E5E7EB",
                                  color: "#374151",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingZoneId(z.id);
                                setEditFeeVal(String(z.fee));
                              }}
                              title="انقر لتعديل رسوم التوصيل"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#FEF3C7",
                                border: "1px solid #FCD34D",
                                color: "#92400E",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontWeight: 900,
                                fontSize: "13px",
                                cursor: "pointer",
                              }}
                            >
                              <span>{z.fee} ج.م</span>
                              <span style={{ fontSize: "10px", opacity: 0.7 }}>✏️</span>
                            </button>
                          )}

                          {/* Duty Status Toggle (Active / Inactive) */}
                          <button
                            type="button"
                            onClick={() => handleToggleZoneActive(z.id, z.isActive !== false)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "100px",
                              border: "none",
                              fontSize: "11px",
                              fontWeight: 900,
                              cursor: "pointer",
                              background: z.isActive !== false ? "#ECFDF5" : "#F3F4F6",
                              color: z.isActive !== false ? "#065F46" : "#6B7280",
                            }}
                          >
                            {z.isActive !== false ? "🟢 متاح" : "⚪ موقوف"}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteZone(z.id, z.nameAr)}
                            title="حذف المنطقة"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#DC2626",
                              fontSize: "14px",
                              padding: "4px",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "14px 24px",
                  background: "#FAF7F2",
                  borderTop: "1px solid #E8DAC8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "12px", color: "#7E5E49", fontWeight: 700 }}>
                  Waffle House Cairo Dynamic Delivery Zones & Pricing Engine 🛵
                </span>
                <button
                  type="button"
                  onClick={() => setZonesModalOpen(false)}
                  style={{
                    height: "36px",
                    padding: "0 20px",
                    background: "#3E0E00",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "13px",
                    borderRadius: "100px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  تم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MODAL 2: CUSTOMER INQUIRIES & LIVE CHAT DRAWER
        ══════════════════════════════════════════════════════════ */}
        {chatDrawerOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              justifyContent: dir === "rtl" ? "flex-start" : "flex-end",
              background: "rgba(43, 23, 14, 0.55)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setChatDrawerOpen(false);
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "460px",
                height: "100%",
                background: "#FFFFFF",
                borderRight: dir === "rtl" ? "1px solid #E8DAC8" : "none",
                borderLeft: dir === "ltr" ? "1px solid #E8DAC8" : "none",
                display: "flex",
                flexDirection: "column",
                boxShadow: dir === "rtl" ? "10px 0 35px rgba(43,23,14,0.18)" : "-10px 0 35px rgba(43,23,14,0.18)",
                color: "#2B170E",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #E8DAC8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#FAF6EE",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {chatView === "thread" && (
                    <button
                      onClick={() => {
                        setChatView("list");
                        playSound("click");
                      }}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8DAC8",
                        color: "#7E5E49",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                      }}
                    >
                      {dir === "rtl" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                      <span>{t("المحادثات", "Chats")}</span>
                    </button>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(198, 135, 62, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#C6873E",
                      }}
                    >
                      <MessageSquare size={17} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#2B170E" }}>
                        {chatView === "thread" && selectedChatPhone
                          ? chatCustomers.find((c) => c.id === selectedChatPhone)?.name || "محادثة عميل"
                          : t("شات واستفسارات العملاء", "Customer Inquiries Chat")}
                      </h3>
                      <p style={{ margin: 0, fontSize: "11px", color: "#7E5E49" }}>
                        {chatView === "thread" && selectedChatPhone
                          ? (chatCustomers.find((c) => c.id === selectedChatPhone)?.phone || "عميل عبر المتجر")
                          : `${chatCustomers.length} ${t("محادثة نشطة", "active chats")}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {chatView === "thread" && selectedChatPhone && (
                    <a
                      href={`https://wa.me/${
                        selectedChatPhone.replace(/[^0-9]/g, "").startsWith("0")
                          ? "2" + selectedChatPhone.replace(/[^0-9]/g, "")
                          : selectedChatPhone.replace(/[^0-9]/g, "")
                      }?text=${encodeURIComponent("مرحباً من فريق Waffle House 🧇🍰")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="مراسلة العميل عبر واتساب مباشرة"
                      style={{
                        background: "#DCFCE7",
                        border: "1px solid #86EFAC",
                        color: "#15803D",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 800,
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MessageCircle size={13} />
                      <span>واتساب</span>
                    </a>
                  )}

                  <button
                    onClick={() => setChatDrawerOpen(false)}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E8DAC8",
                      color: "#7E5E49",
                      borderRadius: "8px",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* View 1: CONVERSATIONS LIST (WhatsApp style vertical list) */}
              {chatView === "list" ? (
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Broadcast Option */}
                  <div
                    onClick={() => {
                      setSelectedChatPhone("");
                      setChatRecipientPhone("");
                      setChatView("thread");
                      playSound("click");
                    }}
                    style={{
                      background: "#FAF6EE",
                      border: "1px dashed #C6873E",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #D4954E, #C6873E)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "14px",
                        }}
                      >
                        📢
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#2B170E" }}>
                          {t("بث رسالة عامة للجميع", "Broadcast Message to All")}
                        </div>
                        <div style={{ fontSize: "11px", color: "#7E5E49" }}>
                          إرسال تنبيه أو إشعار لجميع زوار المتجر
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#C6873E", fontWeight: 800 }}>
                      {chatMessages.length} رسالة
                    </span>
                  </div>

                  {chatCustomers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#7E5E49" }}>
                      <MessageSquare size={36} color="#C6873E" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#2B170E", marginBottom: "4px" }}>
                        لا توجد محادثات عملاء حتى الآن
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        أي استفسار يكتبه عميل في المتجر سيظهر هنا فوراً للتواصل معه
                      </div>
                    </div>
                  ) : (
                    chatCustomers.map((cust) => {
                      const isSelected = selectedChatPhone === cust.id;
                      return (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedChatPhone(cust.id);
                            setChatRecipientPhone(cust.phone);
                            setChatView("thread");
                            playSound("click");
                          }}
                          style={{
                            background: isSelected ? "#FAF6EE" : "#FFFFFF",
                            border: isSelected ? "1.5px solid #C6873E" : "1px solid #E8DAC8",
                            borderRadius: "14px",
                            padding: "12px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 4px rgba(43,23,14,0.03)",
                          }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              background: isSelected ? "linear-gradient(135deg, #D4954E, #C6873E)" : "#FAF6EE",
                              border: isSelected ? "none" : "1px solid #E8DAC8",
                              color: isSelected ? "#FFFFFF" : "#C6873E",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              fontSize: "15px",
                              flexShrink: 0,
                            }}
                          >
                            {cust.name.slice(0, 1) || "ع"}
                          </div>

                          {/* Info & Last Message */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                              <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 800, color: "#2B170E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cust.name}
                              </h4>
                              {cust.lastTime && (
                                <span style={{ fontSize: "10.5px", color: "#7E5E49" }}>
                                  {new Date(cust.lastTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "12px",
                                  color: "#7E5E49",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {cust.lastMessage || (cust.phone ? `هاتف: ${cust.phone}` : "محادثة نشطة")}
                              </p>
                              <span
                                style={{
                                  background: "linear-gradient(135deg, #D4954E, #C6873E)",
                                  color: "#FFFFFF",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                  padding: "1px 7px",
                                  borderRadius: "100px",
                                  flexShrink: 0,
                                }}
                              >
                                {cust.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* View 2: ACTIVE CONVERSATION THREAD */
                <>
                  <div
                    style={{
                      flex: 1,
                      padding: "16px 18px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {chatMessages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#7E5E49", fontSize: "13px" }}>
                        لا توجد رسائل في هذه المحادثة حتى الآن
                      </div>
                    ) : (
                      (selectedChatPhone
                        ? chatMessages.filter(
                            (m) =>
                              (m.customerPhone && m.customerPhone === selectedChatPhone) ||
                              (m.senderId && m.senderId === selectedChatPhone) ||
                              (!m.customerPhone && !m.senderId && m.isStaff)
                          )
                        : chatMessages
                      ).map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: msg.isStaff ? "flex-start" : "flex-end",
                            maxWidth: "85%",
                            background: msg.isStaff ? "#FAF6EE" : "#FFFFFF",
                            border: "1px solid #E8DAC8",
                            borderRadius: "14px",
                            padding: "10px 14px",
                            boxShadow: "0 1px 4px rgba(43,23,14,0.04)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: msg.isStaff ? "#C6873E" : "#2563EB",
                              marginBottom: "3px",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <span>{msg.senderName}</span>
                            {msg.customerPhone && (
                              <span dir="ltr" style={{ color: "#7E5E49" }}>
                                {msg.customerPhone}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "13.5px", color: "#2B170E", lineHeight: 1.4, wordBreak: "break-word" }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: "10px", color: "#7E5E49", marginTop: "4px", textAlign: "left" }}>
                            {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Reply Input */}
                  <div
                    style={{
                      padding: "14px 18px",
                      borderTop: "1px solid #E8DAC8",
                      background: "#FAF6EE",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                      <span style={{ color: "#7E5E49", fontWeight: 700 }}>
                        الرد موجه إلى:{" "}
                        <strong style={{ color: "#2B170E" }}>
                          {selectedChatPhone
                            ? chatCustomers.find((c) => c.id === selectedChatPhone)?.name || selectedChatPhone
                            : "جميع العملاء (بث عام)"}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="اكتب ردك للعميل..."
                        value={chatReplyText}
                        onChange={(e) => setChatReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply();
                        }}
                        style={{
                          flex: 1,
                          height: "42px",
                          background: "#FFFFFF",
                          border: "1px solid #E8DAC8",
                          borderRadius: "12px",
                          padding: "0 14px",
                          color: "#2B170E",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !chatReplyText.trim()}
                        style={{
                          width: "44px",
                          height: "42px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #D4954E, #C6873E)",
                          border: "none",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(198,135,62,0.25)",
                        }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MODAL 3: THERMAL RECEIPT MODAL PREVIEW
        ══════════════════════════════════════════════════════════ */}
        {previewOrder && (
          <ThermalReceiptModal
            order={previewOrder as any}
            onClose={() => setPreviewOrder(null)}
          />
        )}

        {/* ═══════════════════════════════════════════════════════
            MODAL 4: DIGITAL QR RECEIPT MODAL
        ══════════════════════════════════════════════════════════ */}
        {qrModalOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              background: "rgba(43, 23, 14, 0.55)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                borderRadius: "24px",
                padding: "26px",
                maxWidth: "400px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 24px 64px rgba(43,23,14,0.25)",
                color: "#2B170E",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#FAF6EE",
                      border: "1px solid #E8DAC8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#C6873E",
                    }}
                  >
                    <QrCode size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#2B170E" }}>
                    الفاتورة الذكية والتتبع (QR) 📱
                  </h3>
                </div>
                <button
                  onClick={() => setQrModalOrder(null)}
                  style={{
                    background: "#FAF6EE",
                    border: "1px solid #E8DAC8",
                    color: "#7E5E49",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <XCircle size={18} />
                </button>
              </div>

              <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "#7E5E49" }}>
                امسح الرمز بكاميرا الموبايل لفتح الفاتورة الذكية والتتبع للطيار أو العميل بدون طابعة
              </p>

              <div
                style={{
                  background: "#FAF6EE",
                  border: "1px solid #E8DAC8",
                  padding: "16px",
                  borderRadius: "16px",
                  display: "inline-block",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(43,23,14,0.06)",
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    (typeof window !== "undefined" ? window.location.origin : "") +
                      "/receipt/" +
                      qrModalOrder.id
                  )}`}
                  alt="Order QR Code"
                  style={{ width: "190px", height: "190px", display: "block" }}
                />
              </div>

              <div style={{ marginBottom: "18px", fontSize: "13px" }}>
                <div style={{ fontFamily: "monospace", fontWeight: 900, color: "#C6873E", fontSize: "18px" }}>
                  {qrModalOrder.orderNumber}
                </div>
                <div style={{ color: "#2B170E", fontWeight: 700, marginTop: "2px" }}>
                  العميل: {qrModalOrder.customerName} ({qrModalOrder.phone})
                </div>
                <div style={{ color: "#15803D", fontWeight: 900, marginTop: "2px", fontSize: "14px" }}>
                  المطلوب تحصيله: {qrModalOrder.total} ج.م
                </div>
                {qrModalOrder.captainName && (
                  <div style={{ color: "#7E22CE", fontSize: "12px", marginTop: "4px", fontWeight: 800 }}>
                    🛵 الكابتن: {qrModalOrder.captainName}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    const url =
                      (typeof window !== "undefined" ? window.location.origin : "") +
                      "/receipt/" +
                      qrModalOrder.id;
                    navigator.clipboard.writeText(url);
                    setCopiedQrLink(true);
                    playSound("click");
                    setTimeout(() => setCopiedQrLink(false), 2500);
                  }}
                  style={{
                    flex: 1,
                    height: "42px",
                    background: copiedQrLink ? "#15803D" : "#FAF6EE",
                    border: copiedQrLink ? "1px solid #15803D" : "1px solid #E8DAC8",
                    color: copiedQrLink ? "#FFFFFF" : "#7E5E49",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copiedQrLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedQrLink ? "تم النسخ!" : "نسخ الرابط 📋"}</span>
                </button>

                <a
                  href={`/receipt/${qrModalOrder.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    height: "42px",
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    color: "#FFFFFF",
                    borderRadius: "12px",
                    fontWeight: 900,
                    fontSize: "12.5px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(198,135,62,0.25)",
                  }}
                >
                  <ExternalLink size={16} />
                  <span>فتح الفاتورة 🔗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MODAL 5: ORDER EDIT MODAL
        ══════════════════════════════════════════════════════════ */}
        {orderToEdit && (
          <OrderEditModal
            order={orderToEdit}
            isOpen={Boolean(orderToEdit)}
            onClose={() => setOrderToEdit(null)}
            onOrderUpdated={(updated) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              );
              setOrderToEdit(null);
            }}
            onPrintReceipt={(ord) => printThermalReceipt(ord as any)}
            lang={lang}
          />
        )}
      </div>
    </ErpLayout>
  );
}
