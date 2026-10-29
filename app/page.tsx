"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { playSound } from "@/lib/sounds";
import CustomerAccountModal from "@/components/CustomerAccountModal";
import CustomerChatWidget from "@/components/CustomerChatWidget";
import { ALL_DELIVERY_ZONES, DEFAULT_ZONE, findZone, ZoneItem } from "@/lib/zones";
import {
  ShoppingCart, X, Plus, Minus, Search,
  MapPin, Phone, Clock, CheckCircle2, Loader2,
  Star, Bike, CreditCard, ChefHat, ChevronDown,
  Truck, Sparkles, Wallet, BadgeCheck,
  PartyPopper, GraduationCap, Flame, Gift, Store,
} from "lucide-react";

interface OfferCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export interface DiscountRule {
  enabled: boolean;
  title: string;
  type: "percentage" | "fixed";
  value: number;
  scope: "all" | "category" | "products";
  categoryName?: string;
  productIds?: string[];
}

interface OfferData {
  enabled?: boolean;
  badge?: string;
  title: string;
  subtitle: string;
  cards: OfferCard[];
  banner: {
    badge: string;
    title: string;
    linkText: string;
    linkHref: string;
    image: string;
  };
  discount?: DiscountRule;
}

const DEFAULT_OFFERS: OfferData = {
  badge: "عروض محدودة",
  title: "العروض الخاصة",
  subtitle: "عروض متجددة كل أسبوع — اسأل الكاشير عن عرض اليوم",
  cards: [
    {
      id: "combo",
      title: "كومبو الشلة",
      desc: "وافل + ميلك شيك + تشيز كيك بسعر 299 ج م بدل 320 ج م",
      icon: "party",
    },
    {
      id: "delivery",
      title: "توصيل مجاني",
      desc: "اطلب بأكثر من 350 ج م والتوصيل علينا داخل حدائق القبة",
      icon: "delivery",
    },
    {
      id: "student",
      title: "خصم الطلبة",
      desc: "10% خصم على المنيو كله بكارنيه الطالب",
      icon: "student",
    },
  ],
  banner: {
    badge: "الأكثر طلباً هذا الأسبوع",
    title: "ميني بان كيك نوتيلا",
    linkText: "شـوفـه فـي الـمـنـيـو",
    linkHref: "#menu",
    image: "/whacka-offers-banner.jpg",
  },
};

function renderOfferIcon(icon: string) {
  switch (icon) {
    case "party":
      return <PartyPopper size={24} color="#d99b56" strokeWidth={1.8} />;
    case "delivery":
      return <Bike size={24} color="#d99b56" strokeWidth={1.8} />;
    case "student":
      return <GraduationCap size={24} color="#d99b56" strokeWidth={1.8} />;
    case "fire":
      return <Flame size={24} color="#d99b56" strokeWidth={1.8} />;
    default:
      return <Gift size={24} color="#d99b56" strokeWidth={1.8} />;
  }
}

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  basePrice: number;
  sizes?: string | null;
  image?: string | null;
  description?: string | null;
  isAvailable: boolean;
  sortOrder?: number;
}

interface CartItem {
  product: Product;
  qty: number;
  extras: string[];
  unitPrice: number;
  selectedSize?: string | null;
}

/* ─── constants ───────────────────────────────────────────── */
const C = {
  dark:    "#FAF6EE",
  card:    "#FFFFFF",
  card2:   "#F5EDE1",
  border:  "#E8DAC8",
  gold:    "#C6873E",
  goldL:   "#D4954E",
  cream:   "#2B170E",
  muted:   "#6B4F3B",
  muted2:  "#967B66",
};

const CATEGORY_EMOJI: Record<string, string> = {
  "الكل": "🧇",
  "وافل": "🧇",
  "بان كيك": "🥞",
  "تشيز كيك": "🍰",
  "مولتن كيك": "🌋",
  "كيك وحلويات": "🎂",
  "ميلك شيك": "🥤",
  "سموزي": "🍹",
  "مشروبات": "☕",
  "All": "🧇",
  "Waffles": "🧇",
  "Mini Pancakes": "🥞",
  "Cheesecakes": "🍰",
  "Molten Cakes": "🌋",
  "Cakes & Desserts": "🎂",
  "Milkshakes": "🥤",
  "Smoothies": "🍹",
  "Drinks": "☕",
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  "وافل": "مقرمش من بره .. ناعم ولذيذ من جوا",
  "بان كيك": "صغير الحجم .. كبير وفخم في الطعم",
  "تشيز كيك": "نعومة الكريمة مع لمسة صوص غنية",
  "مولتن كيك": "انفجار شوكولاتة ساخنة لا يُقاوم",
  "كيك وحلويات": "تشكيلة حلويات تُعد طازجة يومياً",
  "ميلك شيك": "انتعاش كريمي غني بنكهاتك المفضلة",
  "سموزي": "فواكه طبيعية 100% تروي عطشك",
  "بوبا": "حبيبات البوبا المنعشة في مشروبات فاخرة",
  "مشروبات": "مشروبات ساخنة ومثلجة بمذاق مميز",
};

const ORDERED_CATEGORIES = [
  "الكل",
  "وافل",
  "بان كيك",
  "تشيز كيك",
  "مولتن كيك",
  "كيك وحلويات",
  "ميلك شيك",
  "سموزي",
  "مشروبات",
];

const CATEGORY_PRIORITY: Record<string, number> = {
  "وافل": 1,
  "بان كيك": 2,
  "تشيز كيك": 3,
  "مولتن كيك": 4,
  "كيك وحلويات": 5,
  "ميلك شيك": 6,
  "سموزي": 7,
  "مشروبات": 8,
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  "الكل": "All",
  "وافل": "Waffles",
  "بان كيك": "Mini Pancakes",
  "تشيز كيك": "Cheesecakes",
  "مولتن كيك": "Molten Cakes",
  "كيك وحلويات": "Cakes & Desserts",
  "ميلك شيك": "Milkshakes",
  "سموزي": "Smoothies",
  "مشروبات": "Drinks",
};

/* ─── 1:1 Product Names in English (Whacka Replica) ─── */
const PRODUCT_NAMES_EN: Record<string, string> = {
  // Waffles
  "وافل نوتيلا بيضاء مشكل": "Mixed White Nutella Waffle",
  "وافل نوتيلا": "Classic Nutella Waffle",
  "وافل لوتس": "Original Lotus Waffle",
  "وافل نوتيلا بالاوريو": "Oreo Nutella Waffle",
  "وافل كراميل": "Caramel Waffle",
  "وافل كيندر": "Kinder Chocolate Waffle",
  "وافل شوكولاتة بيضاء فراولة": "White Chocolate Strawberry Waffle",

  // Cheesecakes
  "تشيز كيك بالتوت الأزرق": "Blueberry Cheesecake",
  "تشيز كيك لوتس": "Lotus Cheesecake",
  "تشيز كيك فراولة": "Strawberry Cheesecake",
  "تشيز كيك نوتيلا": "Nutella Cheesecake",

  // Mini Pancakes
  "ميني بان كيك نوتيلا بيضاء": "White Nutella Mini Pancakes",
  "ميني بان كيك نوتيلا": "Nutella Mini Pancakes",
  "ميني بان كيك لوتس": "Lotus Mini Pancakes",
  "ميني بان كيك بيضاء": "White Mini Pancakes",

  // Milkshakes
  "ميلك شيك نوتيلا": "Nutella Milkshake",
  "ميلك شيك أوريو": "Oreo Milkshake",
  "ميلك شيك لوتس": "Lotus Milkshake",
  "ميلك شيك فراولة": "Strawberry Milkshake",
  "ميلك شيك توت أزرق": "Blueberry Milkshake",

  // Smoothies
  "سموزي بالتوت الأزرق": "Blueberry Smoothie",
  "سموزي فراولة": "Strawberry Smoothie",
  "سموزي خوخ": "Peach Smoothie",
  "سموزي مانجو": "Mango Smoothie",

  // Boba Drinks
  "سموزي توت أزرق بوبا": "Boba Blueberry Smoothie",
  "سموزي فراولة بوبا": "Boba Strawberry Smoothie",
  "ميلك شيك توت أزرق بوبا": "Boba Blueberry Milkshake",
  "ميلك شيك خوخ بوبا": "Boba Peach Milkshake",
};

/* ─── Gourmet Arabic Descriptions ─── */
const PRODUCT_DESCRIPTIONS_AR: Record<string, string> = {
  "وافل نوتيلا بيضاء مشكل": "وافل مقرمش من الخارج وطري من الداخل مع نوتيلا بيضاء وشوكولاتة مشكلة.",
  "وافل نوتيلا": "كلاسيك وافل هاوس: نوتيلا أصلية غزيرة على وافل سخن وطازة ومقرمش.",
  "وافل لوتس": "صوص لوتس أصلي مع قطع بسكويت لوتس مقرمشة وطعم لا يقاوم.",
  "وافل نوتيلا بالاوريو": "مزيج النوتيلا الغنية مع قطع بسكويت الأوريو المقرمش.",
  "وافل كراميل": "وافل ذهبي مغطى بصوص الكراميل الغني والحلو الفاخر.",
  "وافل كيندر": "شوكولاتة كيندر أصلية تذوب فوق الوافل الساخن الفاخر.",
  "وافل شوكولاتة بيضاء فراولة": "شوكولاتة بيضاء ناعمة مع قطع فراولة طازجة ولذيذة.",
  "تشيز كيك بالتوت الأزرق": "تشيز كيك كريمي فاخر مغطى بصوص التوت الأزرق المركز.",
  "تشيز كيك لوتس": "طبقة تشيز كيك كريمية غنية بطعم بسكويت اللوتس الأصلي.",
  "تشيز كيك فراولة": "تشيز كيك ناعم مزين بصوص الفراولة الطازجة الشهية.",
  "تشيز كيك نوتيلا": "تشيز كيك مخملي مغطى بطبقة كثيفة من النوتيلا الأصلية.",
  "ميني بان كيك نوتيلا بيضاء": "قطع ميني بان كيك هشة وغارقة في النوتيلا البيضاء الفاخرة.",
  "ميني بان كيك نوتيلا": "ميني بان كيك طازج مغطى بنوتيلا أصلية غنية وسخنة.",
  "ميني بان كيك لوتس": "ميني بان كيك هش مع زبدة وصوص اللوتس المقرمش اللذيذ.",
  "ميني بان كيك بيضاء": "ميني بان كيك بنكهة الشوكولاتة البيضاء الناعمة الفاخرة.",
  "ميلك شيك نوتيلا": "ميلك شيك مثلج وغني بنوتيلا أصلية مع كريمة مخفوقة.",
  "ميلك شيك أوريو": "ميلك شيك بارد ولذيذ مطحون بقطع بسكويت الأوريو المقرمشة.",
  "ميلك شيك لوتس": "ميلك شيك كريمي بطعم اللوتس الفاخر ورشة بسكويت مقرمش.",
  "ميلك شيك فراولة": "ميلك شيك منعش بالفراولة الطبيعية والحليب الطازج.",
  "ميلك شيك توت أزرق": "ميلك شيك بارد بنكهة التوت الأزرق الغنية والمنعشة.",
  "سموزي بالتوت الأزرق": "سموزي طبيعي مثلج ومحضر من حبات التوت الأزرق الطازج.",
  "سموزي فراولة": "سموزي فراولة طازج ومنعش 100% بدون أي مواد صناعية.",
  "سموزي خوخ": "سموزي خوخ طبيعي منعش بطعم الصيف اللذيذ.",
  "سموزي مانجو": "سموزي مانجو طبيعي مثلج ومحضر من مانجو فاخرة بيوريه.",
  "سموزي توت أزرق بوبا": "سموزي توت أزرق مثلج مع كرات البوبا اللذيذة المنعشة.",
  "سموزي فراولة بوبا": "سموزي فراولة طبيعي مثلج مع لآلئ البوبا الممتعة.",
  "ميلك شيك توت أزرق بوبا": "ميلك شيك توت أزرق كريمي مثلج مع حبيبات البوبا الأصلية.",
  "ميلك شيك خوخ بوبا": "ميلك شيك خوخ بارد ومنعش مع لآلئ بوبا طبيعية ولذيذة.",
};

/* ─── Gourmet English Descriptions (Whacka 1:1 Replica) ─── */
const PRODUCT_DESCRIPTIONS_EN: Record<string, string> = {
  // Waffles (Exact Whacka descriptions from reference)
  "وافل نوتيلا بيضاء مشكل": "Crisp outside, fluffy inside waffle with white Nutella and mixed chocolate.",
  "وافل نوتيلا": "The Waffle House classic: generous original Nutella over a hot crispy waffle.",
  "وافل لوتس": "Authentic Lotus spread topped with crunchy Lotus biscuit pieces.",
  "وافل نوتيلا بالاوريو": "Nutella plus crunchy Oreo chunks and a cream layer.",
  "وافل كراميل": "Balanced salted caramel sauce with a hint of sea salt.",
  "وافل كيندر": "Kinder Bueno pieces with a creamy milk filling.",
  "وافل شوكولاتة بيضاء فراولة": "Silky white chocolate topped with fresh ripe strawberry slices.",

  // Cheesecakes
  "تشيز كيك بالتوت الأزرق": "Rich creamy cheesecake topped with concentrated wild blueberry compote.",
  "تشيز كيك لوتس": "Creamy cheesecake infused with authentic Lotus biscuit crunch.",
  "تشيز كيك فراولة": "Smooth silky cheesecake glazed with fresh strawberry sauce.",
  "تشيز كيك نوتيلا": "Velvety New York style cheesecake loaded with rich original Nutella.",

  // Mini Pancakes
  "ميني بان كيك نوتيلا بيضاء": "Fluffy bite-sized pancakes drenched in premium warm white Nutella.",
  "ميني بان كيك نوتيلا": "Fresh mini pancakes loaded with generous original hot Nutella.",
  "ميني بان كيك لوتس": "Golden mini pancakes smothered in rich crunchy Lotus spread.",
  "ميني بان كيك بيضاء": "Mini pancake bites drizzled with velvety melted white chocolate.",

  // Milkshakes
  "ميلك شيك نوتيلا": "Chilled thick shake blended with genuine Nutella and whipped cream.",
  "ميلك شيك أوريو": "Thick frosty shake loaded with crushed crispy Oreo cookies.",
  "ميلك شيك لوتس": "Creamy Lotus spread blended shake topped with crunchy biscuit crumble.",
  "ميلك شيك فراولة": "Refreshing milkshake prepared with natural strawberries and fresh milk.",
  "ميلك شيك توت أزرق": "Cold creamy milkshake bursting with sweet wild blueberry flavour.",

  // Smoothies
  "سموزي بالتوت الأزرق": "100% natural iced smoothie crafted from crushed wild blueberries.",
  "سموزي فراولة": "Refreshing all-natural strawberry smoothie with pure fruit pulp.",
  "سموزي خوخ": "Frosty natural peach smoothie bursting with sun-ripened summer flavour.",
  "سموزي مانجو": "Iced tropical smoothie made from luscious premium mango puree.",

  // Boba Drinks
  "سموزي توت أزرق بوبا": "Frosty wild blueberry smoothie paired with chewy sweet boba pearls.",
  "سموزي فراولة بوبا": "Natural iced strawberry smoothie served with fun popping boba.",
  "ميلك شيك توت أزرق بوبا": "Creamy blueberry milkshake loaded with authentic chewy boba pearls.",
  "ميلك شيك خوخ بوبا": "Cold peach-infused milkshake complete with delicious signature boba pearls.",
};

/* Fallback images per category when product has no image (100% verified local assets) */
const CATEGORY_FALLBACK: Record<string, string> = {
  "وافل": "/categories/waffle.jpg",
  "بان كيك": "/categories/pancake.jpg",
  "تشيز كيك": "/categories/cheesecake.jpg",
  "ميلك شيك": "/categories/milkshake.jpg",
  "سموزي": "/categories/smoothie.jpg",
  "بوبا": "/categories/boba.jpg",
  "كيك وحلويات": "/categories/cake.jpg",
  "مشروبات": "/categories/drinks.jpg",
  "مولتن كيك": "/categories/molten.jpg",
  "عروض خاصة": "/categories/offers.jpg",
};

const EXTRAS_AR = [
  { label: "نوتيلا إضافية",  price: 25 },
  { label: "لوتس إضافي",    price: 25 },
  { label: "كيندر إضافي",   price: 35 },
  { label: "بوبا إضافي",    price: 30 },
  { label: "آيس كريم",      price: 25 },
  { label: "مكسرات",        price: 20 },
];

const EXTRAS_EN = [
  { label: "Extra Nutella", price: 25 },
  { label: "Extra Lotus",   price: 25 },
  { label: "Extra Kinder",  price: 35 },
  { label: "Extra Boba",    price: 30 },
  { label: "Ice Cream",     price: 25 },
  { label: "Nuts",          price: 20 },
];

const ZONES_AR = ALL_DELIVERY_ZONES.map((z) => ({
  name: z.nameAr,
  fee: z.fee,
  timeMinutes: z.timeMinutes,
  code: z.code,
}));

const ZONES_EN = ALL_DELIVERY_ZONES.map((z) => ({
  name: z.nameEn,
  fee: z.fee,
  timeMinutes: z.timeMinutes,
  code: z.code,
}));

const ORDER_STATUSES_AR: Record<string, { label: string; color: string }> = {
  new:       { label: "قيد الاستلام 📋",          color: "#3b82f6" },
  preparing: { label: "جاري التحضير 👨‍🍳",         color: "#f97316" },
  ready:     { label: "جاهز — في الطريق إليك 🛵", color: "#10b981" },
  delivered: { label: "تم التسليم بنجاح 🎉",       color: "#22c55e" },
  cancelled: { label: "ملغي ❌",                   color: "#ef4444" },
};

const ORDER_STATUSES_EN: Record<string, { label: string; color: string }> = {
  new:       { label: "Order Received 📋",        color: "#3b82f6" },
  preparing: { label: "Preparing 👨‍🍳",            color: "#f97316" },
  ready:     { label: "Out for Delivery 🛵",      color: "#10b981" },
  delivered: { label: "Delivered 🎉",             color: "#22c55e" },
  cancelled: { label: "Cancelled ❌",             color: "#ef4444" },
};

/* Hero background — real food photos (waffle/chocolate) */
const HERO_IMAGES = [
  // Real waffle photo from elmenus (same as Whacka reference)
  "https://s3-eu-west-1.amazonaws.com/elmenusv5-stg/Normal/e82d47ee-9ef8-4cef-b175-d8d258d58856.jpg",
  // Chocolate dessert
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=85&fit=crop",
  // Pancake stack
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1600&q=85&fit=crop",
];

/* ─── main component ──────────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [categoryObjects, setCategoryObjects]     = useState<{ id: string; nameAr: string; image?: string }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [offers, setOffers]         = useState<OfferData>(DEFAULT_OFFERS);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productSizes = React.useMemo(() => {
    if (!selectedProduct?.sizes) return [];
    try {
      return typeof selectedProduct.sizes === "string" ? JSON.parse(selectedProduct.sizes) : selectedProduct.sizes;
    } catch {
      return [];
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (productSizes && productSizes.length > 0) {
      setSelectedVariantSize(productSizes[0]);
    } else {
      setSelectedVariantSize(null);
    }
  }, [productSizes]);
  const [selectedExtras, setSelectedExtras]   = useState<string[]>([]);
  const [selectedVariantSize, setSelectedVariantSize] = useState<{ nameAr: string; nameEn?: string; price: number } | null>(null);
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "dinein">("takeaway");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  function scrollCategories(direction: "left" | "right") {
    if (categoryScrollRef.current) {
      const scrollAmount = 240;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }
  const [lang, setLang]             = useState<"ar" | "en">("ar");
  const [heroImg, setHeroImg]       = useState(0);

  // Sync language with Navbar & localStorage (supports ?lang=en / ?lang=ar)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") as "ar" | "en" | null;
      if (urlLang === "ar" || urlLang === "en") {
        setLang(urlLang);
        localStorage.setItem("choco_lang", urlLang);
        window.dispatchEvent(new CustomEvent("choco_lang_change", { detail: urlLang }));
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
    return () => window.removeEventListener("choco_lang_change", onLangChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    setOrderForm((prev) => {
      const z = findZone(prev.zone);
      return { ...prev, zone: lang === "en" ? z.nameEn : z.nameAr };
    });
  }, [lang]);

  const currentZones  = lang === "en" ? ZONES_EN : ZONES_AR;
  const currentExtras = lang === "en" ? EXTRAS_EN : EXTRAS_AR;

  // Customer Account & Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerProfile, setCustomerProfile]     = useState<any>(null);

  // Store dynamic settings (phone, name, address)
  const [storeSettings, setStoreSettings] = useState<{
    restaurantName: string;
    phone: string;
    address: string;
  }>({
    restaurantName: "Waffle House",
    phone: "01155175799",
    address: "القاهرة - مصر",
  });

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [zoneFilter, setZoneFilter]     = useState("");
  const [orderForm, setOrderForm] = useState({
    customerName: "", phone: "", address: "",
    zone: DEFAULT_ZONE.nameAr, paymentMethod: "cash", notes: "",
  });
  const [placing, setPlacing]     = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null);

  // Track
  const [trackQuery, setTrackQuery]   = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError]   = useState("");

  useEffect(() => {
    // Fetch live system settings for dynamic phone & address
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) {
          setStoreSettings({
            restaurantName: d.restaurantName || "Waffle House",
            phone: d.phone || "01155175799",
            address: d.address || "القاهرة - مصر",
          });
        }
      })
      .catch(() => {});

    // Load customer profile from storage if available
    try {
      const rawCust = localStorage.getItem("choco_customer");
      if (rawCust) {
        const cust = JSON.parse(rawCust);
        setCustomerProfile(cust);
        setOrderForm((prev) => ({
          ...prev,
          customerName: prev.customerName || cust.name || "",
          phone: prev.phone || cust.phone || "",
          address: prev.address || cust.address || "",
          zone: cust.zone || prev.zone,
        }));
      }
    } catch {}

    fetch("/api/public/menu")
      .then((r) => r.json())
      .then((d) => { setProducts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/public/offers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.enabled === "boolean") {
          setOffers((prev) => ({ ...prev, ...d, enabled: d.enabled }));
        } else if (d && d.cards) {
          setOffers(d);
        }
      })
      .catch(() => {});

    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoryObjects(data);
          setDynamicCategories(data.map((c: any) => c.nameAr));
        }
      })
      .catch(() => {});
    // rotate hero image every 5s
    const iv = setInterval(() => setHeroImg((n) => (n + 1) % HERO_IMAGES.length), 5000);

    // Listen to navbar cart-open event
    const onOpen = () => setCartOpen(true);
    window.addEventListener("choco_open_cart", onOpen);

    // Listen to navbar customer account event
    const onOpenCustomer = () => setCustomerModalOpen(true);
    window.addEventListener("choco_open_customer", onOpenCustomer);

    return () => {
      clearInterval(iv);
      window.removeEventListener("choco_open_cart", onOpen);
      window.removeEventListener("choco_open_customer", onOpenCustomer);
    };
  }, []);

  function getCategoryIcon(cat: string): string | null {
    if (cat === "الكل") return "/app-icon.png";
    const fromObj = categoryObjects.find((c) => c.nameAr === cat)?.image;
    if (fromObj) return fromObj;
    if (CATEGORY_FALLBACK[cat]) return CATEGORY_FALLBACK[cat];
    const prodWithImg = products.find((p) => p.category === cat && p.image);
    if (prodWithImg?.image) return prodWithImg.image;
    return null;
  }

  const categoriesFromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const allUniqueCats = Array.from(new Set([...dynamicCategories, ...categoriesFromProducts]));
  const categories = ["الكل", ...(allUniqueCats.length > 0 ? allUniqueCats : ORDERED_CATEGORIES.slice(1))];
  const filtered = activeCategory === "الكل"
    ? [...products].sort((a, b) => (CATEGORY_PRIORITY[a.category] || 99) - (CATEGORY_PRIORITY[b.category] || 99))
    : products.filter((p) => p.category === activeCategory);
  const cartTotal  = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const cartCount  = cart.reduce((s, i) => s + i.qty, 0);

  // Delivery zone fee lookup
  const matchedZone = findZone(orderForm.zone);
  const currentZone = {
    name: lang === "en" ? matchedZone.nameEn : matchedZone.nameAr,
    fee: matchedZone.fee,
    timeMinutes: matchedZone.timeMinutes,
    code: matchedZone.code,
  };
  const actualDeliveryFee = (orderType === "takeaway" || orderType === "dinein") ? 0 : currentZone.fee;
  const grandTotal = cartTotal + actualDeliveryFee;

  // Sync cart count to localStorage so Navbar can read it
  useEffect(() => {
    try {
      localStorage.setItem("choco_cart_count", String(cartCount));
      window.dispatchEvent(new CustomEvent("choco_cart_update"));
    } catch { /* ignore */ }
  }, [cartCount]);

  // Helper to calculate promotional discount on any product
  const getProductPricing = (p: Product, customBasePrice?: number) => {
    const base = customBasePrice !== undefined ? customBasePrice : p.basePrice;
    const d = offers.discount;
    if (offers.enabled === false || !d || !d.enabled || !d.value || d.value <= 0) {
      return { originalPrice: base, finalPrice: base, hasDiscount: false, badgeText: "" };
    }

    let applies = false;
    if (d.scope === "all") {
      applies = true;
    } else if (d.scope === "category" && d.categoryName) {
      applies = p.category === d.categoryName;
    } else if (d.scope === "products" && d.productIds) {
      applies = d.productIds.includes(p.id);
    }

    if (!applies) {
      return { originalPrice: p.basePrice, finalPrice: p.basePrice, hasDiscount: false, badgeText: "" };
    }

    const discountAmount = d.type === "percentage"
      ? Math.round((p.basePrice * d.value) / 100)
      : d.value;

    const finalPrice = Math.max(1, p.basePrice - discountAmount);
    const badgeText = d.type === "percentage" ? `-${d.value}% 🔥` : `-${d.value} ج 🔥`;

    return {
      originalPrice: p.basePrice,
      finalPrice,
      hasDiscount: true,
      badgeText,
    };
  };

  function addToCart(product: Product, extras: string[], variantSize?: { nameAr: string; nameEn?: string; price: number } | null) {
    const effectiveBase = variantSize ? variantSize.price : product.basePrice;
    const pricing = getProductPricing(product, effectiveBase);
    const extraPrice = extras.reduce((s, e) => {
      const match = EXTRAS_AR.find((x) => x.label === e) || EXTRAS_EN.find((x) => x.label === e);
      return s + (match?.price || 0);
    }, 0);
    const unitPrice = pricing.finalPrice + extraPrice;
    const sizeName = variantSize ? variantSize.nameAr : null;
    const displayName = variantSize ? `${product.nameAr} (${variantSize.nameAr})` : product.nameAr;

    setCart((prev) => {
      const key = product.id + (sizeName || "") + extras.sort().join(",");
      const ex = prev.find((i) => i.product.id + (i.selectedSize || "") + i.extras.sort().join(",") === key);
      if (ex) return prev.map((i) => i.product.id + (i.selectedSize || "") + i.extras.sort().join(",") === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: { ...product, nameAr: displayName }, qty: 1, extras, unitPrice, selectedSize: sizeName }];
    });
    setSelectedProduct(null);
    setSelectedExtras([]);
    setSelectedVariantSize(null);
    playSound("click");
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) => {
      const next = prev.map((it, i) => i === idx ? { ...it, qty: it.qty + delta } : it);
      return next.filter((i) => i.qty > 0);
    });
    playSound("click");
  }

  async function placeOrder() {
    if (!orderForm.customerName || !orderForm.phone) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderForm,
          orderType,
          customerEmail: customerProfile?.email || null,
          items: cart.map((i) => ({
            productId: i.product.id,
            nameAr: i.product.nameAr,
            nameEn: i.product.nameEn,
            qty: i.qty,
            unitPrice: i.unitPrice,
            selectedSize: i.selectedSize || null,
            extras: i.extras,
          })),
          subtotal: cartTotal,
          deliveryFee: actualDeliveryFee,
        }),
      });
      const data = await res.json();
      if (res.ok && data.orderNumber) {
        setOrderResult(data);
        // Save customer profile locally for 1-click future orders
        try {
          const profile = {
            id: data.customerId || customerProfile?.id || `cust_${Date.now()}`,
            name: orderForm.customerName,
            phone: orderForm.phone,
            address: orderForm.address,
            zone: orderForm.zone,
            email: customerProfile?.email || null,
          };
          localStorage.setItem("choco_customer", JSON.stringify(profile));
          setCustomerProfile(profile);
          window.dispatchEvent(new CustomEvent("choco_customer_updated"));
        } catch {}
        setCart([]);
        setCheckoutOpen(false);
        setCartOpen(false);
        playSound("success");
      }
    } finally { setPlacing(false); }
  }

  async function trackOrder() {
    if (!trackQuery.trim()) return;
    setTrackLoading(true); setTrackError(""); setTrackResult(null);
    try {
      const res  = await fetch(`/api/public/track?q=${encodeURIComponent(trackQuery.trim())}`);
      const data = await res.json();
      if (res.ok) setTrackResult(data);
      else setTrackError(data.error || (lang === "en" ? "No order found" : "لم يتم العثور على طلب"));
    } finally { setTrackLoading(false); }
  }

  /* ─── INPUT STYLE ─── */
  const inputStyle: React.CSSProperties = {
    width: "100%", height: "44px", background: "#FAF6EE",
    border: "1px solid #D9C5B2", borderRadius: "12px",
    padding: "0 14px", color: "#2B170E", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  };

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "linear-gradient(180deg, #1C0500 0%, #2A0802 8%, #3E0B04 22%, #5A0E06 45%, #7F1D1D 62%, #3E0B04 82%, #150300 100%)", color: "#FFFFFF", fontFamily: "var(--font-cairo), system-ui, -apple-system, Arial, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════
          HERO — Royal Crimson & Velvety Chocolate Canvas (Matching Waffle House Brand)
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #1C0500 0%, #2E0702 32%, #7F1D1D 70%, #991B1B 100%)",
        padding: "54px 0 52px 0",
        color: "#FFFFFF",
      }}>
        {/* Soft Ambient Dessert Glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 85% 20%, rgba(245, 158, 11, 0.18) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(139, 0, 0, 0.35) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* ── Hero Content (Compact & Symmetrical) ── */}
        <div style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 20px",
          width: "100%",
          boxSizing: "border-box",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "100px",
            padding: "7px 20px",
            fontSize: "13px",
            color: "#FDE68A",
            fontWeight: 800,
            marginBottom: "18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
          }}>
            <Sparkles size={15} color="#F59E0B" />
            <span>{lang === "en" ? "✦ WAFFLE HOUSE • SWEET WE HAVE SWEETEST ✦" : "✦ وافل هاوس • سويت وي هاف سويتست • فرع حدائق القبة ✦"}</span>
          </div>

          {/* Heading — Creative, Unique Waffle House Identity */}
          <h1 style={{
            margin: "0 0 16px 0",
            lineHeight: 1.24,
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
          }}>
            <span style={{
              color: "#FFFFFF",
              display: "block",
              fontWeight: 900,
              fontSize: "clamp(32px, 5vw, 54px)",
              letterSpacing: "-0.5px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}>
              {lang === "en" ? "Artisan Belgian Waffles & Sweet Sensations" : "عالم الوافل البلجيكي وعشاق السعادة 🧇✨"}
            </span>
            <span style={{
              color: "#F59E0B",
              display: "block",
              fontWeight: 900,
              fontSize: "clamp(26px, 4.2vw, 44px)",
              letterSpacing: "-0.5px",
              marginTop: "6px",
              textShadow: "0 2px 14px rgba(245, 158, 11, 0.35)",
            }}>
              {lang === "en" ? "SWEET WE HAVE SWEETEST • Every Bite a Story" : "سويت وي هاف سويتست • كل قطمة حكاية 🍓"}
            </span>
          </h1>

          {/* Subtitle — Fresh, Mouth-Watering Copy */}
          <p style={{
            fontSize: "clamp(14px, 1.5vw, 16.5px)",
            color: "#FEE2E2",
            marginBottom: "20px",
            fontWeight: 600,
            lineHeight: 1.8,
            maxWidth: "680px",
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}>
            {lang === "en"
              ? "Freshly baked Belgian waffles (Open & Sandwich), fluffy mini pancakes, authentic waffle hawawshi stuffed with pistachio kunafa, stuffed donuts, and ice-cold boba drinks. Handcrafted to order from the heart of Hadaeq Al Qubbah, Cairo."
              : "أشهى وافل بلجيكي مقرمش (ساندوتش ومفتوح)، ميني بان كيك هش، حواوشي وافل محشي كنافة وبستاشيو، دوناتس محشية طازة، ومشروبات البوبا المثلجة.. بنحضرها لحظة طلبك من قلب حدائق القبة!"
            }
          </p>

          {/* Location & Phone Strip */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "13px",
            color: "#FEF3C7",
            fontWeight: 700,
            marginBottom: "28px",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={15} color="#F59E0B" />
              <span>حدائق القبة - ش مصر والسودان - بجوار حلواني الشيبي</span>
            </span>
            <span style={{ color: "#F59E0B" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Phone size={15} color="#F59E0B" />
              <span>01155175799 - 01117649159</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", marginBottom: "32px" }}>
            {/* Order Button */}
            <a
              href="#menu"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#FFFFFF",
                fontWeight: 900,
                padding: "12px 28px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "15px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
                fontFamily: "var(--font-cairo), system-ui, sans-serif",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span>{lang === "en" ? "Order now" : "اطلب الآن 🧇"}</span>
              <span style={{ fontSize: "16px", fontWeight: 900 }}>{lang === "en" ? "→" : "←"}</span>
            </a>

            {/* Direct Counter POS Button */}
            <Link
              href="/cashier"
              style={{
                background: "linear-gradient(135deg, #8B0000, #991B1B)",
                border: "1.5px solid #F59E0B",
                color: "#FFFFFF",
                fontWeight: 900,
                padding: "12px 24px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "15px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 16px rgba(139, 0, 0, 0.4)",
                fontFamily: "var(--font-cairo), system-ui, sans-serif",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <Store size={18} color="#F59E0B" />
              <span>{lang === "en" ? "Counter POS (Takeaway)" : "كاشير وبيع مباشر تيك أواي (POS) 🖨️"}</span>
            </Link>

            {/* Track Button */}
            <a
              href="#track"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                fontWeight: 800,
                padding: "12px 24px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "15px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                fontFamily: "var(--font-cairo), system-ui, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#F59E0B";
                e.currentTarget.style.color = "#F59E0B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
            >
              <Truck size={17} color="#F59E0B" />
              <span>{lang === "en" ? "Track your order" : "تتبع طلبك 🛵"}</span>
            </a>
          </div>

          {/* ── Feature Cards (Waffle House Highlights) ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
          }}>
            {[
              { icon: Sparkles, text: "وافل بلجيكي (ساندوتش ومفتوح)" },
              { icon: Truck, text: "استلام تيك أواي بالفرع مجاناً 🥡" },
              { icon: Bike, text: "توصيل سريع لحدائق القبة ومناطق القاهرة 🛵" },
              { icon: BadgeCheck, text: "بوبا مثلجة وميلك شيك طبيعي 🥤" },
            ].map((b, i) => {
              const IconComp = b.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: "rgba(255, 255, 255, 0.09)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "12px",
                    padding: "11px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  }}
                >
                  <IconComp size={16} color="#F59E0B" strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    fontFamily: "var(--font-cairo), system-ui, sans-serif",
                    whiteSpace: "nowrap",
                  }}>
                    {b.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SPECIAL OFFERS SECTION — Light Warm Ivory Canvas
      ══════════════════════════════════════════════════════════ */}
      {offers.enabled !== false && (
      <section id="offers" style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "44px 20px 20px 20px",
        boxSizing: "border-box",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "26px" }}>
          <div style={{
            fontSize: "12.5px",
            fontWeight: 800,
            color: "#C6873E",
            letterSpacing: "1.2px",
            marginBottom: "5px",
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
          }}>
            {lang === "en" ? "LIMITED OFFERS" : (offers.badge || "عروض محدودة")}
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 3.4vw, 38px)",
            fontWeight: 900,
            color: "#2B170E",
            margin: "0 0 6px 0",
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
            letterSpacing: "-0.5px",
            lineHeight: 1.25,
          }}>
            {lang === "en" ? "Special Offers" : (offers.title || "العروض الخاصة")}
          </h2>
          <p style={{
            fontSize: "13.5px",
            color: "#6B4F3B",
            margin: 0,
            fontWeight: 500,
            lineHeight: 1.6,
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
          }}>
            {lang === "en"
              ? "Renewed weekly deals — ask the cashier about today's special"
              : (offers.subtitle || "عروض متجددة كل أسبوع — اسأل الكاشير عن عرض اليوم")}
          </p>
        </div>

        {/* 3 Offer Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}>
          {(lang === "en" ? [
            { id: "combo", title: "Squad Combo", desc: "Waffle + Milkshake + Cheesecake for 299 EGP instead of 320 EGP", icon: "party" },
            { id: "delivery", title: "Free Delivery", desc: "Order above 350 EGP and delivery is on us within Hadaeq Al Qubbah", icon: "delivery" },
            { id: "student", title: "Student Discount", desc: "10% off the entire menu with your student ID", icon: "student" },
          ] : offers.cards).map((c, i) => (
            <div
              key={c.id || i}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DAC8",
                borderRadius: "16px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                transition: "all 0.2s ease",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(78, 44, 21, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C6873E";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(78, 44, 21, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8DAC8";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(78, 44, 21, 0.04)";
              }}
            >
              {/* Content */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#2B170E",
                  margin: "0 0 5px 0",
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                }}>
                  {c.title}
                </h3>
                <p style={{
                  fontSize: "12px",
                  color: "#6B4F3B",
                  margin: 0,
                  lineHeight: 1.5,
                  fontWeight: 500,
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                }}>
                  {c.desc}
                </p>
              </div>

              {/* Watermark Icon */}
              <div style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#FAF6EE",
                border: "1px solid #E8DAC8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {renderOfferIcon(c.icon)}
              </div>
            </div>
          ))}
        </div>

        {/* Featured Big Banner */}
        <a
          href={offers.banner?.linkHref || "#menu"}
          style={{
            display: "block",
            textDecoration: "none",
            position: "relative",
            minHeight: "160px",
            borderRadius: "18px",
            overflow: "hidden",
            border: "1px solid #E8DAC8",
            background: "#241309",
            transition: "all 0.25s ease",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(78, 44, 21, 0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#C6873E";
            e.currentTarget.style.transform = "scale(1.008)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(78, 44, 21, 0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E8DAC8";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(78, 44, 21, 0.08)";
          }}
        >
          {/* Banner Photo Background */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/whacka-offers-banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }} />

          {/* Dark Gradient Overlay tailored to text direction */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: lang === "ar"
              ? "linear-gradient(to left, rgba(36, 19, 9, 0.85) 0%, rgba(36, 19, 9, 0.55) 40%, rgba(36, 19, 9, 0.15) 100%)"
              : "linear-gradient(to right, rgba(36, 19, 9, 0.85) 0%, rgba(36, 19, 9, 0.55) 40%, rgba(36, 19, 9, 0.15) 100%)",
          }} />

          {/* Overlay Text positioned on Start side */}
          <div style={{
            position: "relative",
            zIndex: 2,
            height: "100%",
            minHeight: "160px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "24px 36px",
            maxWidth: "600px",
          }}>
            <div style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#E0A358",
              marginBottom: "4px",
              fontFamily: "var(--font-cairo), system-ui, sans-serif",
              letterSpacing: "0.5px",
            }}>
              {lang === "en" ? "MOST POPULAR THIS WEEK" : (offers.banner?.badge || "الأكثر طلباً هذا الأسبوع")}
            </div>
            <div style={{
              fontSize: "clamp(22px, 2.8vw, 32px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginBottom: "8px",
              lineHeight: 1.2,
              fontFamily: "var(--font-cairo), system-ui, sans-serif",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.8)",
            }}>
              {lang === "en" ? "Nutella Mini Pancakes" : (offers.banner?.title || "ميني بان كيك نوتيلا")}
            </div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#E0A358",
              fontWeight: 800,
              fontSize: "13.5px",
              fontFamily: "var(--font-cairo), system-ui, sans-serif",
            }}>
              <span>{lang === "en" ? "See in menu" : (offers.banner?.linkText || "شـوفـه فـي الـمـنـيـو")}</span>
              <span style={{ fontSize: "16px", fontWeight: 900 }}>{lang === "en" ? "→" : "←"}</span>
            </div>
          </div>
        </a>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          MENU SECTION — Exact Whacka 1:1 Pixel-Perfect Replica
      ══════════════════════════════════════════════════════════ */}
      <section id="menu" style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "44px 20px 64px 20px",
        boxSizing: "border-box",
      }}>
        {/* Header — Clean, Luxurious Typography matching Waffle House */}
        <div style={{ marginBottom: "26px" }}>
          <h2 style={{
            fontSize: "clamp(28px, 3.4vw, 38px)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 6px 0",
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
            letterSpacing: "-0.5px",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}>
            {lang === "en" ? "Full Menu" : "المنيو الكامل"}
          </h2>
          <p style={{
            fontSize: "13.5px",
            color: "#FDE68A",
            margin: 0,
            fontWeight: 500,
            fontFamily: "var(--font-cairo), system-ui, sans-serif",
          }}>
            {lang === "en"
              ? (products.length > 0 ? `${categories.length - 1} categories & ${products.length} items — each crafted to order` : "6 categories & 28 items — each crafted to order")
              : (products.length > 0 ? `${categories.length - 1} أقسام و${products.length} صنفاً — كل صنف يُحضَّر لحظة الطلب` : "6 أقسام و28 صنفاً — كل صنف يُحضَّر لحظة الطلب")
            }
          </p>
        </div>

        {/* ── Active Promotional Discount Banner (Live Discount Engine) ── */}
        {offers.enabled !== false && offers.discount?.enabled && offers.discount.title && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(198, 135, 62, 0.12) 50%, rgba(220, 38, 38, 0.08) 100%)",
              border: "1.5px solid rgba(198, 135, 62, 0.35)",
              borderRadius: "16px",
              padding: "12px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 4px 18px rgba(43, 23, 14, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🔥</span>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#2B170E" }}>
                  {offers.discount.title}
                </div>
                <div style={{ fontSize: "12px", color: "#7E5E49" }}>
                  {offers.discount.scope === "all"
                    ? "يطبق الخصم تلقائياً على جميع أصناف المنيو الآن!"
                    : offers.discount.scope === "category"
                    ? `يطبق الخصم على جميع أصناف قسم (${offers.discount.categoryName})!`
                    : "يطبق الخصم على الأصناف المحددة بالشارة الحمراء 🔥!"}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#C6873E",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 900,
                padding: "4px 14px",
                borderRadius: "100px",
                boxShadow: "0 2px 8px rgba(198, 135, 62, 0.3)",
              }}
            >
              {offers.discount.type === "percentage" ? `خصم ${offers.discount.value}%` : `وفر ${offers.discount.value} ج.م`}
            </div>
          </div>
        )}

        {/* Category Navigation Bar — Visual Carousel with Smooth Scroll Buttons */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll Categories Left"
            style={{
              position: "absolute",
              left: "-6px",
              top: "40%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#8B0000",
              color: "#FFFFFF",
              border: "2px solid #FFFFFF",
              boxShadow: "0 4px 12px rgba(139,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 900,
            }}
          >
            ◀
          </button>

          {/* Scrollable Container */}
          <div
            ref={categoryScrollRef}
            style={{
              display: "flex",
              gap: "14px",
              overflowX: "auto",
              padding: "4px 38px 18px 38px",
              marginBottom: "0",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const catLabel = lang === "en" ? (CATEGORY_NAMES_EN[cat] || cat) : cat;
            const imgSrc = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); playSound("click"); }}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Circular image badge */}
                <div style={{
                  width: "66px",
                  height: "66px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                  border: isActive ? "3px solid #F59E0B" : "2px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: isActive ? "0 4px 16px rgba(43,23,14,0.24)" : "0 2px 8px rgba(43,23,14,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={catLabel}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.parentElement?.querySelector(".cat-emoji-fb") as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}
                  <span
                    className="cat-emoji-fb"
                    style={{
                      fontSize: "26px",
                      display: imgSrc ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {CATEGORY_EMOJI[cat] || "🧇"}
                  </span>
                </div>

                {/* Category Label */}
                <span style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 900 : 800,
                  color: isActive ? "#FFFFFF" : "#2B170E",
                  backgroundColor: isActive ? "#8B0000" : "#FFFFFF",
                  padding: "4px 14px",
                  borderRadius: "100px",
                  border: isActive ? "1.5px solid #F59E0B" : "1px solid #E8DAC8",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 3px 10px rgba(43,23,14,0.25)" : "none",
                }}>
                  {catLabel}
                </span>
              </button>
            );
          })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll Categories Right"
            style={{
              position: "absolute",
              right: "-6px",
              top: "40%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#8B0000",
              color: "#FFFFFF",
              border: "2px solid #FFFFFF",
              boxShadow: "0 4px 12px rgba(139,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 900,
            }}
          >
            ▶
          </button>
        </div>

        {/* Products Listing — Horizontal Row Cards Layout matching Image 3 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6B4F3B" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🧇</div>
            <p style={{ fontSize: "16px", fontFamily: "var(--font-cairo), sans-serif" }}>
              {lang === "en" ? "Loading menu..." : "جاري تحميل المنيو..."}
            </p>
          </div>
        ) : (
          <div>
            {(activeCategory === "الكل" 
              ? categories.filter(c => c !== "الكل" && products.some(p => p.category === c))
              : [activeCategory]
            ).map((catName) => {
              const catProducts = products.filter(p => p.category === catName);
              if (catProducts.length === 0) return null;

              return (
                <div key={catName} style={{ marginBottom: "40px" }}>
                  {/* Category Ornamental Header */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                    margin: "24px 0 20px",
                    textAlign: "center",
                  }}>
                    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #DEC9B5)" }} />
                    <div>
                      <div style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        justifyContent: "center",
                        fontFamily: "var(--font-cairo), system-ui, sans-serif",
                        textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      }}>
                        <span style={{ fontSize: "24px" }}>{CATEGORY_EMOJI[catName] || "🧇"}</span>
                        <span>{lang === "en" ? (CATEGORY_NAMES_EN[catName] || catName) : catName}</span>
                      </div>
                      <div style={{
                        fontSize: "12.5px",
                        color: "#FDE68A",
                        fontWeight: 600,
                        marginTop: "2px",
                        fontFamily: "var(--font-cairo), system-ui, sans-serif",
                      }}>
                        {CATEGORY_SUBTITLES[catName] || (lang === "en" ? "Crafted fresh with authentic luxury ingredients" : "مُحضّر طازجاً بأجود المكونات خصيصاً لك")}
                      </div>
                    </div>
                    <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #DEC9B5)" }} />
                  </div>

                  {/* Horizontal Cards Grid (1 col on mobile, 2 col on tablet/desktop) */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "16px",
                  }}>
                    {catProducts.map((p) => {
                      const productName = lang === "en" ? (PRODUCT_NAMES_EN[p.nameAr] || p.nameEn || p.nameAr) : p.nameAr;
                      const description = lang === "en"
                        ? (PRODUCT_DESCRIPTIONS_EN[p.nameAr] || PRODUCT_DESCRIPTIONS_EN[p.nameEn] || "Original luxury ingredients prepared fresh to order.")
                        : (PRODUCT_DESCRIPTIONS_AR[p.nameAr] || p.description || "مكونات أصلية فاخرة تُحضّر خصيصاً ولحظة الطلب.");
                      const imgSrc = p.image || CATEGORY_FALLBACK[p.category];
                      const inCartQty = cart.filter(i => i.product.id === p.id).reduce((s, i) => s + i.qty, 0);
                      const pricing = getProductPricing(p);

                      return (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setSelectedExtras([]); playSound("click"); }}
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1.5px solid #E8DAC8",
                            borderRadius: "20px",
                            padding: "14px 16px",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "16px",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(43,23,14,0.04)",
                            transition: "all 0.2s ease",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLDivElement;
                            el.style.borderColor = "#C6873E";
                            el.style.transform = "translateY(-3px)";
                            el.style.boxShadow = "0 8px 24px rgba(43,23,14,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLDivElement;
                            el.style.borderColor = "#E8DAC8";
                            el.style.transform = "translateY(0)";
                            el.style.boxShadow = "0 2px 10px rgba(43,23,14,0.04)";
                          }}
                        >
                          {/* Details (Left in RTL, taking flex: 1) */}
                          <div style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "105px",
                          }}>
                            <div>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                                marginBottom: "4px",
                              }}>
                                <span style={{
                                  fontSize: "16.5px",
                                  fontWeight: 900,
                                  color: "#2B170E",
                                  lineHeight: 1.3,
                                  fontFamily: "var(--font-cairo), system-ui, sans-serif",
                                }}>
                                  {productName}
                                </span>
                                {(p.basePrice >= 120 || p.sortOrder === 1) && (
                                  <span title="الأكثر طلباً" style={{ fontSize: "14px" }}>👑</span>
                                )}
                                {pricing.hasDiscount && (
                                  <span
                                    style={{
                                      background: "rgba(220, 38, 38, 0.12)",
                                      border: "1px solid rgba(220, 38, 38, 0.3)",
                                      color: "#DC2626",
                                      fontSize: "10.5px",
                                      fontWeight: 900,
                                      padding: "1px 6px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    {pricing.badgeText}
                                  </span>
                                )}
                              </div>

                              <p style={{
                                margin: 0,
                                fontSize: "12.5px",
                                color: "#7E5E49",
                                lineHeight: 1.45,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                fontFamily: "var(--font-cairo), system-ui, sans-serif",
                              }}>
                                {description}
                              </p>
                            </div>

                            {/* Bottom row: Price + Add Button */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "10px",
                              paddingTop: "6px",
                              borderTop: "1px dashed #F0E4D5",
                            }}>
                              {/* Direct Multi-Tier Variant Selection & Pricing */}
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                flexWrap: "wrap",
                                gap: "6px",
                                fontFamily: "var(--font-cairo), system-ui, sans-serif",
                              }}>
                                {(() => {
                                  const parsedSizes = p.sizes ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes) : [];
                                  if (parsedSizes && parsedSizes.length > 0) {
                                    return (
                                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${parsedSizes.length}, 1fr)`, gap: "6px", width: "100%" }}>
                                        {parsedSizes.map((sz: any) => {
                                          const inCartSz = cart.find((it) => it.product.id === p.id && it.selectedSize === sz.nameAr);
                                          const szQty = inCartSz ? inCartSz.qty : 0;
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
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(p, [], sz);
                                              }}
                                              style={{
                                                backgroundColor: szQty > 0 ? "#8B0000" : "#2B170E",
                                                color: "#FFFFFF",
                                                border: szQty > 0 ? "2px solid #F59E0B" : "1px solid #4A2818",
                                                borderRadius: "9px",
                                                padding: "7px 4px",
                                                fontSize: "11.5px",
                                                fontWeight: 900,
                                                cursor: "pointer",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "2px",
                                                boxShadow: szQty > 0 ? "0 4px 12px rgba(139,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.1)",
                                                transition: "all 0.15s ease",
                                              }}
                                            >
                                              <span>{szLabel}</span>
                                              <span style={{ color: "#FDE047", fontWeight: 900, fontSize: "12.5px" }}>{sz.price} ج.م</span>
                                              {szQty > 0 && (
                                                <span style={{ background: "#FFFFFF", color: "#8B0000", borderRadius: "100px", padding: "0 6px", fontSize: "9.5px", fontWeight: 900 }}>
                                                  تمت الإضافة ({szQty}) ✓
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                        {pricing.hasDiscount ? (
                                          <>
                                            <del style={{ fontSize: "12px", color: "#8C6546", textDecoration: "line-through" }}>
                                              {p.basePrice}
                                            </del>
                                            <span style={{ fontSize: "17.5px", fontWeight: 900, color: "#16A34A" }}>
                                              {pricing.finalPrice}
                                            </span>
                                            <span style={{ fontSize: "12px", color: "#16A34A", fontWeight: 700 }}>
                                              {lang === "en" ? "EGP" : "ج.م"}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span style={{ fontSize: "17px", fontWeight: 900, color: "#2B170E" }}>{p.basePrice}</span>
                                            <span style={{ fontSize: "12px", color: "#8C6546", fontWeight: 700 }}>
                                              {lang === "en" ? "EGP" : "ج.م"}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(p, []);
                                        }}
                                        style={{
                                          backgroundColor: inCartQty > 0 ? "#8B0000" : "#2B170E",
                                          color: "#FFFFFF",
                                          border: "none",
                                          borderRadius: "100px",
                                          padding: "6px 16px",
                                          fontSize: "12.5px",
                                          fontWeight: 900,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          boxShadow: inCartQty > 0 ? "0 2px 8px rgba(139,0,0,0.3)" : "0 2px 8px rgba(43,23,14,0.18)",
                                          transition: "all 0.15s ease",
                                          fontFamily: "var(--font-cairo), system-ui, sans-serif",
                                        }}
                                      >
                                        <span>{inCartQty > 0 ? `✓ (${inCartQty})` : (lang === "en" ? "+ Add" : "+ أضف")}</span>
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Food Photo Container (Large, clear, appetizing) */}
                          <div style={{
                            width: "115px",
                            height: "115px",
                            flexShrink: 0,
                            borderRadius: "16px",
                            overflow: "hidden",
                            backgroundColor: "#FAF6EE",
                            border: "1px solid #E8DAC8",
                            boxShadow: "0 3px 10px rgba(43,23,14,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}>
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={productName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                  transition: "transform 0.3s ease",
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const fallback = CATEGORY_FALLBACK[p.category];
                                  if (fallback && !img.dataset.triedFallback) {
                                    img.dataset.triedFallback = "true";
                                    img.src = fallback;
                                  } else {
                                    img.style.display = "none";
                                    const fb = img.parentElement?.querySelector(".prod-emoji-fb") as HTMLElement | null;
                                    if (fb) fb.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <span
                              className="prod-emoji-fb"
                              style={{
                                fontSize: "38px",
                                display: imgSrc ? "none" : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {CATEGORY_EMOJI[p.category] || "🧇"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRACK ORDER SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="track" style={{
        background: "transparent",
        borderTop: "1px solid rgba(245, 158, 11, 0.2)",
        padding: "64px 20px",
      }}>
        <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#F59E0B", letterSpacing: "2px", marginBottom: "8px" }}>● TRACK</div>
          <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", marginBottom: "8px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {lang === "en" ? "Track your order 📦" : "تتبع طلبك 📦"}
          </h2>
          <p style={{ fontSize: "14px", color: "#FDE68A", marginBottom: "28px" }}>
            {lang === "en" ? "Enter order number or your phone number" : "أدخل رقم الطلب أو رقم موبايلك"}
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && trackOrder()}
              placeholder={lang === "en" ? "CH-20261027-1234 or 01155175799" : "CH-20261027-1234 أو 01155175799"}
              style={{
                flex: 1, height: "52px", background: "#FFFFFF",
                border: "1px solid #D9C5B2", borderRadius: "14px",
                padding: "0 18px", color: "#2B170E", fontSize: "14px",
                outline: "none", fontFamily: "monospace",
              }}
            />
            <button onClick={trackOrder} disabled={trackLoading} style={{
              background: "linear-gradient(135deg, #D4954E, #C6873E)",
              color: "#FFFFFF", fontWeight: 900, padding: "0 24px", height: "52px",
              borderRadius: "14px", border: "none", cursor: "pointer",
              fontSize: "14px", display: "flex", alignItems: "center", gap: "6px",
              minWidth: "100px",
              boxShadow: "0 4px 14px rgba(198, 135, 62, 0.35)",
            }}>
              {trackLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><Search size={16} /> {lang === "en" ? "Search" : "بحث"}</>}
            </button>
          </div>

          {trackError && <p style={{ marginTop: "14px", color: "#ef4444", fontSize: "14px" }}>{trackError}</p>}

          {trackResult && (
            <div style={{
              marginTop: "24px", background: "#FFFFFF",
              border: "1px solid #E8DAC8", borderRadius: "20px",
              padding: "24px", textAlign: lang === "ar" ? "right" : "left",
              boxShadow: "0 8px 32px rgba(78, 44, 21, 0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", color: "#C6873E", fontWeight: 900, fontSize: "16px" }}>
                  {trackResult.orderNumber}
                </span>
                <span style={{
                  fontWeight: 700, fontSize: "13px",
                  color: (lang === "en" ? ORDER_STATUSES_EN : ORDER_STATUSES_AR)[trackResult.status]?.color || "#2B170E",
                  background: `${(lang === "en" ? ORDER_STATUSES_EN : ORDER_STATUSES_AR)[trackResult.status]?.color || "#2B170E"}20`,
                  padding: "4px 12px", borderRadius: "100px",
                }}>
                  {(lang === "en" ? ORDER_STATUSES_EN : ORDER_STATUSES_AR)[trackResult.status]?.label || trackResult.status}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#6B4F3B" }}>
                {trackResult.customerName} — {lang === "en" ? "Total: " : "إجمالي: "}
                <strong style={{ color: "#C6873E" }}>
                  {lang === "en" ? `EGP ${trackResult.total}` : `${trackResult.total} ج`}
                </strong>
              </p>
              {(trackResult.timeline || []).length > 0 && (
                <div style={{ marginTop: "16px", borderTop: "1px solid #E8DAC8", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(trackResult.timeline || []).map((t: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#6B4F3B" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C6873E", flexShrink: 0 }} />
                      <span>{(lang === "en" ? ORDER_STATUSES_EN : ORDER_STATUSES_AR)[t.stage]?.label || t.stage}</span>
                      <span style={{ marginInlineStart: "auto", color: "#967B66", fontSize: "11px" }}>
                        {new Date(t.at).toLocaleTimeString(lang === "en" ? "en-US" : "ar-EG")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INFO SECTION — location, hours, contact
      ══════════════════════════════════════════════════════════ */}
      <section id="about" style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#C6873E", letterSpacing: "2px", marginBottom: "8px" }}>● ABOUT</div>
          <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {lang === "en" ? "About Waffle House" : "عن Waffle House"}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {(lang === "en" ? [
            {
              icon: <MapPin size={28} color="#C6873E" />,
              title: "Our Location",
              body: `${storeSettings.address}\nFast delivery across Cairo & Hadaeq Al Qubbah zones`,
              link: null,
            },
            {
              icon: <Clock size={28} color="#C6873E" />,
              title: "Opening Hours",
              body: "10:00 AM to 2:00 AM\nDaily Freshly Prepared",
              link: null,
            },
            {
              icon: <Phone size={28} color="#C6873E" />,
              title: "Contact Us",
              body: `${storeSettings.phone}\nCash | InstaPay | Wallet | Card`,
              link: `tel:${storeSettings.phone}`,
            },
          ] : [
            {
              icon: <MapPin size={28} color="#C6873E" />,
              title: "موقعنا",
              body: `${storeSettings.address}\nتوصيل سريع لـ 84 منطقة بحدائق القبة والقاهرة`,
              link: null,
            },
            {
              icon: <Clock size={28} color="#C6873E" />,
              title: "مواعيد العمل",
              body: "من 10 صباحاً حتى 2 بعد منتصف الليل\nيومياً تحضير طازج ولحظي",
              link: null,
            },
            {
              icon: <Phone size={28} color="#C6873E" />,
              title: "تواصل معنا",
              body: `${storeSettings.phone}\nكاش | إنستاباي | محفظة | كارت`,
              link: `tel:${storeSettings.phone}`,
            },
          ]).map((c, i) => (
            <div key={i} style={{
              background: "#FFFFFF", border: "1px solid #E8DAC8",
              borderRadius: "20px", padding: "28px 24px", textAlign: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 12px rgba(78, 44, 21, 0.04)",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#C6873E"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E8DAC8"; }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>{c.icon}</div>
              <h3 style={{ fontWeight: 800, color: "#2B170E", marginBottom: "10px", fontSize: "16px" }}>{c.title}</h3>
              {c.link ? (
                <a
                  href={c.link}
                  style={{ fontSize: "14px", color: "#C6873E", whiteSpace: "pre-line", lineHeight: 1.8, textDecoration: "none", fontWeight: 700 }}
                >
                  {c.body}
                </a>
              ) : (
                <p style={{ fontSize: "14px", color: "#6B4F3B", whiteSpace: "pre-line", lineHeight: 1.8 }}>{c.body}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid #3D2214",
        padding: "36px 20px 48px",
        textAlign: "center",
        background: "#241309",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              overflow: "hidden", border: "1.5px solid #C6873E",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#FAF6EE",
            }}>
              <img src="/waffle-house-logo.jpg" alt="Waffle House" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "18px", fontWeight: 800, color: "#FAF6EE",
            }}>
              Waffle House <span style={{ color: "#C6873E", fontSize: "11px", letterSpacing: "2px" }}>{lang === "en" ? "Dessert" : "Dessert"}</span>
            </span>
          </div>

          {/* Android App Download Banner */}
          <Link
            href="/download"
            onClick={() => playSound("click")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(198, 135, 62, 0.15)",
              border: "1px solid rgba(198, 135, 62, 0.35)",
              padding: "7px 18px",
              borderRadius: "100px",
              color: "#E0A358",
              textDecoration: "none",
              fontSize: "12.5px",
              fontWeight: 800,
              transition: "all 0.2s ease",
            }}
          >
            <span>📱 {lang === "en" ? "Download Android App (APK)" : "تحميل تطبيق الأندرويد الرسمي (APK) والـ QR"}</span>
            <span style={{ color: "#4ade80", fontSize: "11px" }}>● v1.0.0</span>
          </Link>

          <p style={{ fontSize: "13px", color: "#B49279", margin: 0 }}>
            {lang === "en"
              ? "© 2026 Waffle House Desserts. Luxury waffles, pancakes & cheesecakes in Hadaeq Al Qubbah."
              : "© 2026 وافل هاوس ديسرتس. ألذ وأفخر وافل وبانكيك وتشيز كيك طازج في حدائق القبة."}
          </p>

          <div style={{ marginTop: "6px" }}>
            <a
              href="https://wa.me/201155175799"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#38bdf8",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "100px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.22)",
                transition: "all 0.2s ease",
              }}
            >
              <span>تم تطوير وبرمجة النظام بواسطة شركة أوركا للحلول البرمجية والخدمات السحابية</span>
              <span style={{ direction: "ltr", fontFamily: "monospace" }}>01155175799</span>
            </a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════
          FLOATING CART BUTTON
      ══════════════════════════════════════════════════════════ */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => { setCartOpen(true); playSound("click"); }} style={{
          position: "fixed", bottom: "24px",
          ...(lang === "ar" ? { right: "20px" } : { left: "20px" }),
          zIndex: 40,
          background: "linear-gradient(135deg, #D4954E, #C6873E)",
          color: "#FFFFFF", fontWeight: 900, padding: "14px 22px",
          borderRadius: "20px", border: "none", cursor: "pointer",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 6px 28px rgba(198, 135, 62, 0.45)",
          animation: "pulse-glow 2s infinite",
        }}>
          <ShoppingCart size={18} />
          <span>{lang === "en" ? `${cartCount} ${cartCount === 1 ? "item" : "items"}` : `${cartCount} صنف`}</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span>{lang === "en" ? `EGP ${cartTotal}` : `${cartTotal} ج`}</span>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════
          CART DRAWER
      ══════════════════════════════════════════════════════════ */}
      {cartOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, display: "flex",
          justifyContent: lang === "ar" ? "flex-end" : "flex-start",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(43, 23, 14, 0.45)", backdropFilter: "blur(4px)" }} onClick={() => setCartOpen(false)} />
          <div style={{
            position: "relative", width: "100%", maxWidth: "420px",
            background: "#FAF6EE",
            borderLeft: lang === "ar" ? "1px solid #E8DAC8" : "none",
            borderRight: lang === "en" ? "1px solid #E8DAC8" : "none",
            height: "100%", display: "flex", flexDirection: "column",
            boxShadow: lang === "ar" ? "-8px 0 40px rgba(78, 44, 21, 0.25)" : "8px 0 40px rgba(78, 44, 21, 0.25)",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderBottom: "1px solid #E8DAC8",
              background: "#FFFFFF",
            }}>
              <h2 style={{ fontWeight: 900, color: "#2B170E", fontSize: "18px", margin: 0 }}>
                🛒 {lang === "en" ? "Cart" : "السلة"} ({cartCount})
              </h2>
              <button onClick={() => setCartOpen(false)} style={{
                background: "#FAF6EE", border: "1px solid #E8DAC8",
                cursor: "pointer", color: "#7E5E49", padding: "8px",
                borderRadius: "10px",
              }}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", color: "#6B4F3B", gap: "14px",
              }}>
                <span style={{ fontSize: "56px" }}>🛒</span>
                <p style={{ fontSize: "16px", fontWeight: 700 }}>{lang === "en" ? "Cart is empty" : "السلة فارغة"}</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {cart.map((item, idx) => {
                    const itemName = lang === "en" ? (PRODUCT_NAMES_EN[item.product.nameAr] || item.product.nameEn || item.product.nameAr) : item.product.nameAr;
                    return (
                      <div key={idx} style={{
                        background: "#FFFFFF", border: "1px solid #E8DAC8",
                        borderRadius: "16px", padding: "12px", display: "flex", gap: "12px",
                        boxShadow: "0 2px 8px rgba(78, 44, 21, 0.04)",
                      }}>
                        <div style={{
                          width: "60px", height: "60px", borderRadius: "12px",
                          background: "#FAF6EE", overflow: "hidden", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid #E8DAC8",
                        }}>
                          {item.product.image
                            ? <img src={item.product.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: "28px" }}>{CATEGORY_EMOJI[item.product.category] || "🧇"}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 800, color: "#2B170E", fontSize: "14px", margin: 0 }}>{itemName}</p>
                          {item.extras.length > 0 && (
                            <p style={{ fontSize: "11px", color: "#6B4F3B", marginTop: "3px" }}>{item.extras.join(" + ")}</p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                            <span style={{ fontWeight: 900, color: "#C6873E", fontSize: "15px" }}>
                              {lang === "en" ? `EGP ${item.unitPrice * item.qty}` : `${item.unitPrice * item.qty} ج`}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button onClick={() => updateQty(idx, -1)} style={{
                                width: "30px", height: "30px", borderRadius: "8px",
                                background: "#FAF6EE", border: "1px solid #D9C5B2", color: "#2B170E",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Minus size={14} />
                              </button>
                              <span style={{ fontWeight: 900, color: "#2B170E", width: "22px", textAlign: "center", fontSize: "15px" }}>
                                {item.qty}
                              </span>
                              <button onClick={() => updateQty(idx, 1)} style={{
                                width: "30px", height: "30px", borderRadius: "8px",
                                background: "#FAF6EE", border: "1px solid #D9C5B2", color: "#2B170E",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: "18px 20px", borderTop: "1px solid #E8DAC8", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6B4F3B" }}>
                      <span>{lang === "en" ? "Products" : "المنتجات"}</span>
                      <span>{lang === "en" ? `EGP ${cartTotal}` : `${cartTotal} ج`}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6B4F3B" }}>
                      <span>{lang === "en" ? "Delivery" : "توصيل"}</span>
                      <span>{lang === "en" ? `EGP ${currentZone.fee}` : `${currentZone.fee} ج`}</span>
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      color: "#2B170E", fontWeight: 900, fontSize: "17px",
                      borderTop: "1px solid #E8DAC8", paddingTop: "10px", marginTop: "4px",
                    }}>
                      <span>{lang === "en" ? "Total" : "الإجمالي"}</span>
                      <span style={{ color: "#C6873E" }}>{lang === "en" ? `EGP ${grandTotal}` : `${grandTotal} ج`}</span>
                    </div>
                  </div>
                  <button onClick={() => { setCheckoutOpen(true); setCartOpen(false); playSound("click"); }} style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #D4954E, #C6873E)",
                    color: "#FFFFFF", fontWeight: 900, padding: "15px",
                    borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "16px",
                    boxShadow: "0 4px 20px rgba(198, 135, 62, 0.4)",
                  }}>
                    {lang === "en" ? "Proceed to Checkout 🛵" : "إتمام الطلب 🛵"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PRODUCT DETAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(43, 23, 14, 0.55)", backdropFilter: "blur(4px)" }} onClick={() => setSelectedProduct(null)} />
          <div style={{
            position: "relative", width: "100%", maxWidth: "460px",
            background: "#FFFFFF", border: "1px solid #E8DAC8",
            borderRadius: "28px 28px 0 0", padding: "24px",
            boxShadow: "0 -8px 48px rgba(78, 44, 21, 0.2)",
            maxHeight: "92vh", overflowY: "auto",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}>
            <button onClick={() => setSelectedProduct(null)} style={{
              position: "absolute", top: "16px", [lang === "en" ? "right" : "left"]: "16px",
              background: "#FAF6EE", border: "1px solid #E8DAC8",
              borderRadius: "10px", padding: "7px", cursor: "pointer", color: "#7E5E49",
            }}>
              <X size={20} />
            </button>

            <div style={{
              width: "100%", height: "220px", borderRadius: "18px",
              background: "#FAF6EE", overflow: "hidden", marginBottom: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #E8DAC8",
            }}>
              {(selectedProduct.image || CATEGORY_FALLBACK[selectedProduct.category]) ? (
                <img
                  src={selectedProduct.image || CATEGORY_FALLBACK[selectedProduct.category]}
                  alt={lang === "en" ? (PRODUCT_NAMES_EN[selectedProduct.nameAr] || selectedProduct.nameEn) : selectedProduct.nameAr}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (CATEGORY_FALLBACK[selectedProduct.category] && img.src !== CATEGORY_FALLBACK[selectedProduct.category]) {
                      img.src = CATEGORY_FALLBACK[selectedProduct.category];
                    } else {
                      img.style.display = "none";
                    }
                  }}
                />
              ) : (
                <span style={{ fontSize: "72px" }}>{CATEGORY_EMOJI[selectedProduct.category] || "🧇"}</span>
              )}
            </div>

            <h3 style={{ fontWeight: 900, color: "#2B170E", fontSize: "22px", margin: 0 }}>
              {lang === "en" ? (PRODUCT_NAMES_EN[selectedProduct.nameAr] || selectedProduct.nameEn) : selectedProduct.nameAr}
            </h3>
            <p style={{ fontSize: "13px", color: "#6B4F3B", marginTop: "6px", lineHeight: "1.6" }}>
              {lang === "en"
                ? (PRODUCT_DESCRIPTIONS_EN[selectedProduct.nameAr] || selectedProduct.nameEn)
                : (PRODUCT_DESCRIPTIONS_AR[selectedProduct.nameAr] || selectedProduct.description || "")}
            </p>
            {/* Dynamic Two-Tier Price display based on selected size variant */}
            {(() => {
              const activeBase = selectedVariantSize ? selectedVariantSize.price : selectedProduct.basePrice;
              const pricing = getProductPricing(selectedProduct, activeBase);
              const extraSum = selectedExtras.reduce((s, e) => s + (currentExtras.find((x) => x.label === e)?.price || 0), 0);
              const currentFinal = pricing.finalPrice + extraSum;

              return pricing.hasDiscount ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
                  <del style={{ color: "#7E5E49", fontSize: "16px", textDecoration: "line-through" }}>
                    {activeBase}
                  </del>
                  <p style={{ color: "#16A34A", fontWeight: 900, fontSize: "26px", margin: 0 }}>
                    {lang === "en" ? `EGP ${currentFinal}` : `${currentFinal} ج.م`}
                  </p>
                  <span style={{ fontSize: "12px", background: "#FEE2E2", color: "#DC2626", fontWeight: 900, padding: "2px 8px", borderRadius: "6px" }}>
                    {pricing.badgeText}
                  </span>
                </div>
              ) : (
                <p style={{ color: "#8B0000", fontWeight: 900, fontSize: "24px", marginTop: "12px" }}>
                  {lang === "en" ? `EGP ${currentFinal}` : `${currentFinal} ج.م`}
                </p>
              );
            })()}

            {/* Direct Choice Buttons (No extras, no hassle: Pick between the two sizes!) */}
            {productSizes && productSizes.length > 0 ? (
              <div style={{ marginTop: "20px" }}>
                <p style={{ fontSize: "14px", fontWeight: 900, color: "#2B170E", marginBottom: "12px", textAlign: "center" }}>
                  {lang === "en" ? "Select Option to Add to Cart:" : "اختر النوع المطلوب لإضافته للسلة فوراً:"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${productSizes.length}, 1fr)`, gap: "12px" }}>
                  {productSizes.map((sz: any) => {
                    const szLabel = sz.nameAr.includes("ساندوتش") ? "🥪 ساندوتش" :
                                    sz.nameAr.includes("مفتوح") ? "🧇 مفتوح" :
                                    sz.nameAr.includes("15") ? "🥞 15 قطعة" :
                                    sz.nameAr.includes("25") ? "🥞 25 قطعة" :
                                    sz.nameAr.includes("وسط") || sz.nameAr.includes("M") ? "🥤 وسط (M)" :
                                    sz.nameAr.includes("كبير") || sz.nameAr.includes("L") ? "🥤 كبير (L)" : sz.nameAr;
                    return (
                      <button
                        key={sz.nameAr}
                        type="button"
                        onClick={() => {
                          addToCart(selectedProduct, [], sz);
                          setSelectedProduct(null);
                        }}
                        style={{
                          padding: "16px 12px",
                          borderRadius: "16px",
                          border: "2px solid #8B0000",
                          background: "linear-gradient(135deg, #8B0000 0%, #B91C1C 100%)",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 6px 20px rgba(139,0,0,0.35)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: "16px", fontWeight: 900 }}>{szLabel}</span>
                        <span style={{ fontSize: "19px", fontWeight: 900, color: "#FDE047" }}>{sz.price} ج.م</span>
                        <span style={{ fontSize: "11px", opacity: 0.9, background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: "100px" }}>
                          {lang === "en" ? "Add to Cart 🛒" : "اضغط للإضافة 🛒"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  addToCart(selectedProduct, []);
                  setSelectedProduct(null);
                }}
                style={{
                  width: "100%", marginTop: "22px",
                  background: "linear-gradient(135deg, #8B0000, #B91C1C)",
                  color: "#FFFFFF", fontWeight: 900, padding: "16px",
                  borderRadius: "16px", border: "none", cursor: "pointer",
                  fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: "0 6px 20px rgba(139,0,0,0.35)",
                }}
              >
                <ShoppingCart size={20} /> {lang === "en" ? `Add to Cart (${selectedProduct.basePrice} EGP)` : `أضف للسلة (${selectedProduct.basePrice} ج.م)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CHECKOUT MODAL
      ══════════════════════════════════════════════════════════ */}
      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(43, 23, 14, 0.55)", backdropFilter: "blur(4px)" }} onClick={() => setCheckoutOpen(false)} />
          <div style={{
            position: "relative", width: "100%", maxWidth: "460px",
            background: "#FFFFFF", border: "1px solid #E8DAC8",
            borderRadius: "24px", padding: "28px",
            boxShadow: "0 12px 48px rgba(78, 44, 21, 0.2)",
            maxHeight: "92vh", overflowY: "auto",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}>
            <button onClick={() => setCheckoutOpen(false)} style={{
              position: "absolute", top: "18px", [lang === "en" ? "right" : "left"]: "18px",
              background: "#FAF6EE", border: "1px solid #E8DAC8",
              borderRadius: "10px", padding: "7px", cursor: "pointer", color: "#7E5E49",
            }}>
              <X size={20} />
            </button>
            <h3 style={{ fontWeight: 900, color: "#2B170E", fontSize: "22px", margin: "0 0 16px 0" }}>
              {lang === "en" ? "Confirm Order 🧇" : "تأكيد الطلب 🧇"}
            </h3>

            {/* Order Type Tabs: Delivery vs Takeaway vs Dine-in */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "18px",
              padding: "4px",
              background: "#FAF6EE",
              borderRadius: "14px",
              border: "1px solid #E8DAC8",
            }}>
              {[
                { val: "takeaway", label: "🥡 تيك أواي (استلام فرع)", sub: "مجاناً بدون مصاريف توصيل (0 ج)" },
                { val: "delivery", label: "🛵 دليفري وتوصيل", sub: "توصيل سريع لمناطق القاهرة" },
                { val: "dinein",   label: "🍽️ صالة",   sub: "تناول داخل المحل (0 ج)" },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => {
                    setOrderType(t.val as any);
                    playSound("click");
                  }}
                  style={{
                    padding: "9px 6px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background: orderType === t.val ? "linear-gradient(135deg, #8B0000, #991B1B)" : "transparent",
                    color: orderType === t.val ? "#FFFFFF" : "#6B4F3B",
                    fontWeight: 900,
                    fontSize: "13px",
                    boxShadow: orderType === t.val ? "0 3px 10px rgba(139,0,0,0.25)" : "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{t.label}</span>
                  <span style={{ fontSize: "10px", opacity: 0.85, fontWeight: 700 }}>{t.sub}</span>
                </button>
              ))}
            </div>

            {/* If Takeaway or Dine-in: Branch Pickup Banner */}
            {(orderType === "takeaway" || orderType === "dinein") && (
              <div style={{
                background: "#ECFDF5",
                border: "1.5px solid #A7F3D0",
                borderRadius: "14px",
                padding: "12px 16px",
                marginBottom: "14px",
                fontSize: "13px",
                color: "#065F46",
                lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📍 {orderType === "takeaway" ? "استلام من فرع حدائق القبة" : "تناول داخل الصالة"}</span>
                  <span style={{ background: "#059669", color: "#FFFFFF", padding: "1px 8px", borderRadius: "100px", fontSize: "10.5px" }}>مجاناً</span>
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  العنوان: شارع مصر والسودان - بجوار حلواني الشيبي - حدائق القبة
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input type="text"
                placeholder={lang === "en" ? "Your name here *" : "اسمك هنا *"}
                value={orderForm.customerName}
                onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                style={inputStyle}
              />
              <input type="tel" dir="ltr"
                placeholder="01xxxxxxxxx *"
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                style={inputStyle}
              />
              {/* Address and Zone are only required for Delivery */}
              {orderType === "delivery" && (
                <>
                  <input type="text"
                    placeholder={lang === "en" ? "Building / Floor / Apartment *" : "العنوان بالتفصيل (الشارع / العمارة / الدور / الشقة) *"}
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    style={inputStyle}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#6B4F3B" }}>
                        {lang === "en" ? "Delivery Zone (Cairo)" : "منطقة التوصيل (حدائق القبة ومناطق القاهرة 🛵)"}
                      </label>
                      <span style={{ fontSize: "11px", color: "#8B0000", fontWeight: 800 }}>
                        ⏱️ {currentZone.timeMinutes} {lang === "en" ? "mins" : "دقيقة"} • 🛵 {currentZone.fee} {lang === "en" ? "EGP" : "ج.م"}
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder={lang === "en" ? "🔍 Filter zones (e.g. Hadaeq Al Qubbah, Heliopolis)..." : "🔍 ابحث في المناطق (مثال: حدائق القبة، سراي القبة، مصر الجديدة)..."}
                      value={zoneFilter}
                      onChange={(e) => setZoneFilter(e.target.value)}
                      style={{ ...inputStyle, height: "38px", fontSize: "12px", background: "#FAF6EE" }}
                    />

                    <select
                      value={orderForm.zone}
                      onChange={(e) => setOrderForm({ ...orderForm, zone: e.target.value })}
                      style={{ ...inputStyle, height: "46px" }}
                    >
                      {currentZones
                        .filter((z) => !zoneFilter.trim() || z.name.toLowerCase().includes(zoneFilter.trim().toLowerCase()))
                        .map((z) => (
                          <option key={z.name} value={z.name}>
                            {z.name} — {lang === "en" ? `${z.fee} EGP (${z.timeMinutes} mins)` : `${z.fee} ج.م (${z.timeMinutes} دقيقة)`}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#6B4F3B", marginBottom: "10px" }}>
                  {lang === "en" ? "Payment Method" : "طريقة الدفع"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {[
                    { val: "cash",     label: lang === "en" ? "💵 Cash" : "💵 كاش" },
                    { val: "instapay", label: lang === "en" ? "InstaPay" : "إنستاباي" },
                    { val: "card",     label: lang === "en" ? "💳 Card" : "💳 كارت" },
                  ].map((pm) => (
                    <button key={pm.val} onClick={() => setOrderForm({ ...orderForm, paymentMethod: pm.val })} style={{
                      padding: "11px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                      background: orderForm.paymentMethod === pm.val ? "linear-gradient(135deg, #D4954E, #C6873E)" : "#FAF6EE",
                      borderColor: orderForm.paymentMethod === pm.val ? "#C6873E" : "#E8DAC8",
                      color: orderForm.paymentMethod === pm.val ? "#FFFFFF" : "#4A2814",
                    }}>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder={lang === "en" ? "Special notes..." : "ملاحظات خاصة..."} rows={2}
                style={{
                  width: "100%", background: "#FAF6EE", border: "1px solid #D9C5B2",
                  borderRadius: "12px", padding: "12px 14px", color: "#2B170E", fontSize: "14px",
                  outline: "none", resize: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Order Summary */}
            <div style={{
              background: "#FAF6EE", borderRadius: "16px",
              padding: "18px", margin: "20px 0",
              border: "1px solid #E8DAC8",
              display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6B4F3B" }}>
                <span>{lang === "en" ? "Products" : "المنتجات"}</span>
                <span>{lang === "en" ? `EGP ${cartTotal}` : `${cartTotal} ج`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6B4F3B" }}>
                <span>{orderType === "takeaway" ? "استلام من الفرع" : orderType === "dinein" ? "تناول بالصالة" : (lang === "en" ? `Delivery (${currentZone.name})` : `توصيل (${currentZone.name})`)}</span>
                <span style={{ fontWeight: 700, color: actualDeliveryFee === 0 ? "#16A34A" : "#6B4F3B" }}>
                  {actualDeliveryFee === 0 ? "0 ج (مجاناً)" : (lang === "en" ? `EGP ${actualDeliveryFee}` : `${actualDeliveryFee} ج`)}
                </span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                color: "#2B170E", fontWeight: 900, fontSize: "17px",
                borderTop: "1px solid #E8DAC8", paddingTop: "10px", marginTop: "4px",
              }}>
                <span>{lang === "en" ? "Total" : "الإجمالي"}</span>
                <span style={{ color: "#C6873E" }}>{lang === "en" ? `EGP ${grandTotal}` : `${grandTotal} ج`}</span>
              </div>
            </div>

            <button onClick={placeOrder}
              disabled={placing || !orderForm.customerName || !orderForm.phone}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #D4954E, #C6873E)",
                color: "#FFFFFF", fontWeight: 900, padding: "16px",
                borderRadius: "14px", border: "none", cursor: "pointer",
                fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                opacity: (placing || !orderForm.customerName || !orderForm.phone) ? 0.5 : 1,
                boxShadow: "0 4px 20px rgba(198, 135, 62, 0.4)",
              }}>
              {placing
                ? (lang === "en" ? "Sending order..." : "جاري إرسال الطلب...")
                : <><CheckCircle2 size={18} /> {lang === "en" ? "Confirm Order 🧇" : "أكد الطلب 🧇"}</>}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ORDER SUCCESS MODAL
      ══════════════════════════════════════════════════════════ */}
      {orderResult && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(43, 23, 14, 0.65)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", background: "#FFFFFF",
            border: "1px solid #E8DAC8",
            borderRadius: "28px", padding: "40px 28px",
            textAlign: "center", maxWidth: "360px", width: "100%",
            boxShadow: "0 12px 64px rgba(78, 44, 21, 0.2)",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>🎉</div>
            <h3 style={{ fontSize: "26px", fontWeight: 900, color: "#2B170E", marginBottom: "10px" }}>
              {lang === "en" ? "Order Received!" : "تم استلام طلبك!"}
            </h3>
            <p style={{ color: "#6B4F3B", fontSize: "15px", marginBottom: "24px" }}>
              {lang === "en"
                ? "We will start preparing right away and deliver fresh to you ⚡"
                : "سنبدأ التحضير فوراً ونوصل لك في أقرب وقت ⚡"}
            </p>
            <div style={{
              background: "#FAF6EE", borderRadius: "16px",
              padding: "20px", marginBottom: "24px",
              border: "1px solid #E8DAC8",
            }}>
              <p style={{ fontSize: "13px", color: "#6B4F3B", marginBottom: "6px" }}>
                {lang === "en" ? "Your Order Number" : "رقم طلبك"}
              </p>
              <p style={{ fontFamily: "monospace", color: "#C6873E", fontWeight: 900, fontSize: "22px" }}>
                {orderResult.orderNumber}
              </p>
            </div>
            {/* WhatsApp 100% Free Confirmation Button */}
            <a
              href={`https://wa.me/2${storeSettings.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `مرحباً ${storeSettings.restaurantName} 🧇🍰\nأنا العميل: ${orderForm.customerName}\nقمت بطلب أوردر جديد رقم: #${orderResult.orderNumber}\nالمطلوب تحصيله: ${grandTotal} ج.م\nالعنوان: ${orderForm.address || ""} (${orderForm.zone})\nوقت التوصيل التقديري: ${currentZone.timeMinutes} دقيقة\nبرجاء التأكيد والتجهيز طازج!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound("click")}
              style={{
                width: "100%",
                background: "#22c55e",
                color: "#ffffff",
                fontWeight: 900,
                padding: "13px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontSize: "14.5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                textDecoration: "none",
                marginBottom: "10px",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.35)",
                boxSizing: "border-box",
              }}
            >
              <span>تأكيد واستلام الفاتورة عبر واتساب 💬</span>
            </a>

            {/* Track Live in Customer Account Modal */}
            <button
              onClick={() => {
                setOrderResult(null);
                setCustomerModalOpen(true);
                playSound("click");
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #D4954E, #C6873E)",
                color: "#FFFFFF",
                fontWeight: 900,
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontSize: "15px",
                boxShadow: "0 4px 14px rgba(198, 135, 62, 0.35)",
              }}
            >
              {lang === "en" ? "Awesome! Track order live 📍" : "ممتاز! تتبع طلبك لايف 📍"}
            </button>
          </div>
        </div>
      )}

      {/* ── Customer Account & Orders Modal ── */}
      <CustomerAccountModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        lang={lang}
        onCustomerUpdated={(c) => {
          setCustomerProfile(c);
          if (c) {
            setOrderForm((prev) => ({
              ...prev,
              customerName: c.name || prev.customerName,
              phone: c.phone || prev.phone,
              address: c.address || prev.address,
              zone: c.zone || prev.zone,
            }));
          }
        }}
      />

      {/* ── Customer Live Chat Widget ── */}
      <CustomerChatWidget lang={lang} />
    </div>
  );
}
