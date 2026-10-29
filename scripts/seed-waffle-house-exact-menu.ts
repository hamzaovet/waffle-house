import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

import { prisma } from "../lib/prisma";
import { createHash } from "crypto";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

async function seedExactMenu() {
  console.log("🚀 Seeding Official Waffle House Cairo Menu & Two-Tier Variant Pricing...");

  // 1. Update SystemSettings with authentic Cairo - Hadaeq Al Qubbah address & phones
  const cairoDeliveryZones = [
    { name: "حدائق القبة", fee: 15, timeMinutes: 25 },
    { name: "سراي القبة والزيتون", fee: 20, timeMinutes: 30 },
    { name: "مصر الجديدة وروكسي", fee: 25, timeMinutes: 30 },
    { name: "مدينة نصر", fee: 35, timeMinutes: 40 },
    { name: "العباسية والوايلي والدمرداش", fee: 20, timeMinutes: 30 },
    { name: "شبرا والساحل", fee: 25, timeMinutes: 35 },
    { name: "عين شمس وحلمية الزيتون", fee: 25, timeMinutes: 35 },
    { name: "المطرية والأميرية", fee: 20, timeMinutes: 30 },
    { name: "الزمالك ووسط البلد", fee: 35, timeMinutes: 40 },
    { name: "المعادي والتجمع الخامس", fee: 50, timeMinutes: 50 },
  ];

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      restaurantName: "Waffle House",
      phone: "01155175799",
      address: "حدائق القبة - شارع مصر والسودان - بجوار حلواني الشيبي - القاهرة",
      isLockedDown: false,
      soundsEnabled: true,
      offersEnabled: true,
      deliveryZones: JSON.stringify(cairoDeliveryZones),
    },
    create: {
      id: "default",
      restaurantName: "Waffle House",
      phone: "01155175799",
      address: "حدائق القبة - شارع مصر والسودان - بجوار حلواني الشيبي - القاهرة",
      isLockedDown: false,
      soundsEnabled: true,
      offersEnabled: true,
      deliveryZones: JSON.stringify(cairoDeliveryZones),
    },
  });

  // Also update DeliveryZone table with Cairo zones
  await prisma.deliveryZone.deleteMany({});
  for (const [idx, z] of cairoDeliveryZones.entries()) {
    await prisma.deliveryZone.create({
      data: {
        code: `CAI-${idx + 1}`,
        nameAr: z.name,
        nameEn: z.name,
        fee: z.fee,
        timeMinutes: z.timeMinutes,
        isActive: true,
      },
    });
  }

  // 2. Verified Accounts: Maestro (Owner) & Demo User
  console.log("👤 Ensuring maestro and demo user accounts...");
  await prisma.user.upsert({
    where: { phone: "01018671000" },
    update: {
      name: "المايسترو (المالك)",
      username: "maestro",
      passwordHash: sha256("123456789"),
      pin: "157230",
      role: "owner",
      department: "الإدارة العليا",
    },
    create: {
      name: "المايسترو (المالك)",
      username: "maestro",
      passwordHash: sha256("123456789"),
      phone: "01018671000",
      pin: "157230",
      role: "owner",
      department: "الإدارة العليا",
    },
  });

  await prisma.user.upsert({
    where: { phone: "01000000000" },
    update: {
      name: "تجربة العميل (Demo Client)",
      username: "user",
      passwordHash: sha256("123456"),
      pin: "123456",
      role: "cashier",
      department: "الكاشير والتجربة",
    },
    create: {
      name: "تجربة العميل (Demo Client)",
      username: "user",
      passwordHash: sha256("123456"),
      phone: "01000000000",
      pin: "123456",
      role: "cashier",
      department: "الكاشير والتجربة",
    },
  });

  // 3. Clear and Recreate Categories
  console.log("🏷️ Setting up official Categories...");
  const categoriesData = [
    { nameAr: "وافل", nameEn: "Waffles", image: "/cards/waffle-card.png", sortOrder: 1 },
    { nameAr: "بان كيك", nameEn: "Pancakes", image: "/cards/pancake-card.png", sortOrder: 2 },
    { nameAr: "فتة", nameEn: "Fatta", image: "/categories/cake.jpg", sortOrder: 3 },
    { nameAr: "طواجن", nameEn: "Casseroles", image: "/categories/molten.jpg", sortOrder: 4 },
    { nameAr: "دوناتس", nameEn: "Donuts", image: "/cards/special-card.png", sortOrder: 5 },
    { nameAr: "الموتشي", nameEn: "Mochi", image: "/cards/icecream-card.png", sortOrder: 6 },
    { nameAr: "كاسات", nameEn: "Cups", image: "/categories/cheesecake.jpg", sortOrder: 7 },
    { nameAr: "فريسكة", nameEn: "Freska", image: "/cards/waffle-card.png", sortOrder: 8 },
    { nameAr: "حواوشي وافل", nameEn: "Waffle Hawawshi", image: "/cards/special-card.png", sortOrder: 9 },
    { nameAr: "كوكيز", nameEn: "Cookies", image: "/categories/offers.jpg", sortOrder: 10 },
    { nameAr: "بوبا", nameEn: "Boba Drinks", image: "/cards/boba-card.png", sortOrder: 11 },
    { nameAr: "ميلك شيك", nameEn: "Milkshakes", image: "/cards/milkshake-card.png", sortOrder: 12 },
    { nameAr: "سموزي وصودا", nameEn: "Smoothies & Soda", image: "/cards/smoothie-card.png", sortOrder: 13 },
  ];

  await prisma.category.deleteMany({});
  for (const cat of categoriesData) {
    await prisma.category.create({
      data: {
        id: "cat_" + Math.random().toString(36).substring(2, 9),
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: cat.sortOrder,
      },
    });
  }

  // 4. Insert All Authentic Products with Two-Tier Sizes/Pricing
  console.log("🧇 Inserting authentic products with sizes and two-tier pricing...");

  const waffleSizes = (sandwichPrice: number, openPrice: number) =>
    JSON.stringify([
      { nameAr: "ساندوتش", nameEn: "Sandwich", price: sandwichPrice },
      { nameAr: "مفتوح", nameEn: "Open", price: openPrice },
    ]);

  const pancakeSizes = (p15: number, p25: number) =>
    JSON.stringify([
      { nameAr: "15 قطعة", nameEn: "15 Pcs", price: p15 },
      { nameAr: "25 قطعة", nameEn: "25 Pcs", price: p25 },
    ]);

  const mlSizes = (mPrice: number, lPrice: number) =>
    JSON.stringify([
      { nameAr: "M (وسط)", nameEn: "Medium (M)", price: mPrice },
      { nameAr: "L (كبير)", nameEn: "Large (L)", price: lPrice },
    ]);

  const products = [
    // ── وافل (Waffles) - نوعين: ساندوتش ومفتوح ──
    {
      nameAr: "وافل شوكليت نوتيلا",
      nameEn: "Nutella Chocolate Waffle",
      category: "وافل",
      basePrice: 45,
      sizes: waffleSizes(45, 50),
      description: "وافل بلجيكي مقرمش وهش مع صوص نوتيلا غني وشهي (ساندوتش 45 ج.م / مفتوح 50 ج.م).",
      image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600",
      sortOrder: 1,
    },
    {
      nameAr: "وافل شوكليت وايت",
      nameEn: "White Chocolate Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "وافل ذهبي ساخن مغطى بالشوكولاتة البيضاء البلجيكية اللذيذة (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      sortOrder: 2,
    },
    {
      nameAr: "وافل كندر",
      nameEn: "Kinder Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "وافل ساخن بقطع وصوص كندر بوينو الحليبي الفاخر (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600",
      sortOrder: 3,
    },
    {
      nameAr: "وافل لوتس",
      nameEn: "Lotus Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "وافل بزبدة بسكويت لوتس بيسكوف الأصلية مع رشة كرانشي (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      sortOrder: 4,
    },
    {
      nameAr: "وافل ميكس صوصات",
      nameEn: "Mix Sauces Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "توليفة ساحرة تجمع بين شوكولاتة نوتيلا والشوكولاتة البيضاء واللوتس (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600",
      sortOrder: 5,
    },
    {
      nameAr: "وافل روشية",
      nameEn: "Rocher Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "وافل فاخر بصوص وشوكولاتة فيريرو روشيه مع البندق المحمص (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
      sortOrder: 6,
    },
    {
      nameAr: "وافل رافيلو",
      nameEn: "Raffaello Waffle",
      category: "وافل",
      basePrice: 50,
      sizes: waffleSizes(50, 55),
      description: "وافل بكريمة رافيلو البيضاء وجوز الهند المبشور واللوز المقرمش (ساندوتش 50 ج.م / مفتوح 55 ج.م).",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
      sortOrder: 7,
    },
    {
      nameAr: "وافل بيستاشيو",
      nameEn: "Pistachio Waffle",
      category: "وافل",
      basePrice: 60,
      sizes: waffleSizes(60, 65),
      description: "وافل غارق بكريمة الفستق الحلبي الطبيعي الفاخر مع حبات الفستق (ساندوتش 60 ج.م / مفتوح 65 ج.م).",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      sortOrder: 8,
    },
    {
      nameAr: "وافل فور سيزون",
      nameEn: "Four Seasons Waffle",
      category: "وافل",
      basePrice: 55,
      sizes: waffleSizes(55, 60),
      description: "وافل مقسم لأربعة أركان غنية بنكهات: نوتيلا، وايت، لوتس، وكندر (ساندوتش 55 ج.م / مفتوح 60 ج.م).",
      image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600",
      sortOrder: 9,
    },
    {
      nameAr: "وافل كريمي تشيز نوتيلا (NEW)",
      nameEn: "Creamy Cheese Nutella Waffle",
      category: "وافل",
      basePrice: 55,
      sizes: waffleSizes(55, 60),
      description: "وافل مميز بخلطة التشيز الكريمية الغنية مع صوص نوتيلا (ساندوتش 55 ج.م / مفتوح 60 ج.م).",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      sortOrder: 10,
    },
    {
      nameAr: "وافل كريمي تشيز فراولة (NEW)",
      nameEn: "Creamy Cheese Strawberry Waffle",
      category: "وافل",
      basePrice: 55,
      sizes: waffleSizes(55, 60),
      description: "وافل بصوص التشيز كيك الكريمي وقطع وصوص الفراولة الطازجة (ساندوتش 55 ج.م / مفتوح 60 ج.م).",
      image: "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=600",
      sortOrder: 11,
    },
    {
      nameAr: "وافل كريمي مالتيزرس (NEW)",
      nameEn: "Creamy Maltesers Waffle",
      category: "وافل",
      basePrice: 55,
      sizes: waffleSizes(55, 60),
      description: "وافل شهي بكرات شوكولاتة مالتيزرس المقرمشة والكريمة الفاخرة (ساندوتش 55 ج.م / مفتوح 60 ج.م).",
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600",
      sortOrder: 12,
    },

    // ── حواوشي وافل (Waffle Hawawshi - NEW) ──
    {
      nameAr: "ربع حواوشي وافل (محشي كنافة وبستاشيو)",
      nameEn: "Waffle Hawawshi Pistachio Kunafa",
      category: "حواوشي وافل",
      basePrice: 20,
      sizes: null,
      description: "اختراع وافل هاوس الحصري: وافل محشي كنافة مقرمشة وبستاشيو فاخر.",
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600",
      sortOrder: 13,
    },
    {
      nameAr: "ربع حواوشي وافل نوتيلا (كنافة بستاشيو نوتيلا)",
      nameEn: "Waffle Hawawshi Nutella",
      category: "حواوشي وافل",
      basePrice: 25,
      sizes: null,
      description: "وافل مقرمش محشي كنافة وبستاشيو وغارق بشوكولاتة نوتيلا اللذيذة.",
      image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600",
      sortOrder: 14,
    },
    {
      nameAr: "ربع حواوشي وافل مكسرات",
      nameEn: "Waffle Hawawshi Nuts & Pistachio",
      category: "حواوشي وافل",
      basePrice: 35,
      sizes: null,
      description: "وافل محشي كنافة وبستاشيو ومكسرات البندق واللوز وعين الجمل المحمص.",
      image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600",
      sortOrder: 15,
    },

    // ── بان كيك (Pancakes) - حجمين: 15 قطعة و 25 قطعة ──
    {
      nameAr: "بان كيك شوكليت نوتيلا",
      nameEn: "Nutella Mini Pancakes",
      category: "بان كيك",
      basePrice: 40,
      sizes: pancakeSizes(40, 45),
      description: "قطع ميني بان كيك طرية وهشة بصوص نوتيلا الغني (15 قطعة: 40 ج.م / 25 قطعة: 45 ج.م).",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
      sortOrder: 16,
    },
    {
      nameAr: "بان كيك شوكليت وايت",
      nameEn: "White Choco Mini Pancakes",
      category: "بان كيك",
      basePrice: 45,
      sizes: pancakeSizes(45, 50),
      description: "ميني بان كيك بالشوكولاتة البيضاء البلجيكية الناعمة (15 قطعة: 45 ج.م / 25 قطعة: 50 ج.م).",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      sortOrder: 17,
    },
    {
      nameAr: "بان كيك كندر",
      nameEn: "Kinder Mini Pancakes",
      category: "بان كيك",
      basePrice: 45,
      sizes: pancakeSizes(45, 50),
      description: "بان كيك بصوص وشوكولاتة كندر الحليبية الرائعة (15 قطعة: 45 ج.م / 25 قطعة: 50 ج.م).",
      image: "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=600",
      sortOrder: 18,
    },
    {
      nameAr: "بان كيك لوتس",
      nameEn: "Lotus Mini Pancakes",
      category: "بان كيك",
      basePrice: 45,
      sizes: pancakeSizes(45, 50),
      description: "ميني بان كيك بزبدة لوتس سبريد وبسكويت مطحون (15 قطعة: 45 ج.م / 25 قطعة: 50 ج.م).",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      sortOrder: 19,
    },
    {
      nameAr: "بان كيك بيستاشيو",
      nameEn: "Pistachio Mini Pancakes",
      category: "بان كيك",
      basePrice: 50,
      sizes: pancakeSizes(50, 55),
      description: "ميني بان كيك بكريمة الفستق الحلبي الطبيعي (15 قطعة: 50 ج.م / 25 قطعة: 55 ج.م).",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      sortOrder: 20,
    },
    {
      nameAr: "بان كيك ميكس صوصات",
      nameEn: "Mix Mini Pancakes",
      category: "بان كيك",
      basePrice: 45,
      sizes: pancakeSizes(45, 50),
      description: "ميني بان كيك مشكل بصوصات نوتيلا، وايت، ولوتس (15 قطعة: 45 ج.م / 25 قطعة: 50 ج.م).",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
      sortOrder: 21,
    },

    // ── فتة وافل هاوس (Fatta) - حجمين: M و L ──
    {
      nameAr: "فتة شوكليت نوتيلا",
      nameEn: "Nutella Waffle Fatta",
      category: "فتة",
      basePrice: 65,
      sizes: mlSizes(65, 80),
      description: "قطع وافل مقرمشة غارقة في صوص نوتيلا البلجيكية (M: 65 ج.م / L: 80 ج.م).",
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
      sortOrder: 22,
    },
    {
      nameAr: "فتة شوكليت وايت",
      nameEn: "White Chocolate Fatta",
      category: "فتة",
      basePrice: 70,
      sizes: mlSizes(70, 85),
      description: "قطع وافل مغطاة بالشوكولاتة البيضاء السائلة (M: 70 ج.م / L: 85 ج.م).",
      image: "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=600",
      sortOrder: 23,
    },
    {
      nameAr: "فتة كندر",
      nameEn: "Kinder Fatta",
      category: "فتة",
      basePrice: 70,
      sizes: mlSizes(70, 85),
      description: "فتة وافل بصوص وقطع كندر بوينو المقرمشة (M: 70 ج.م / L: 85 ج.م).",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      sortOrder: 24,
    },
    {
      nameAr: "فتة لوتس بيسكوف",
      nameEn: "Lotus Biscoff Fatta",
      category: "فتة",
      basePrice: 70,
      sizes: mlSizes(70, 85),
      description: "فتة وافل مقرمشة بزبدة اللوتس وبسكويت لوتس مطحون (M: 70 ج.م / L: 85 ج.م).",
      image: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600",
      sortOrder: 25,
    },
    {
      nameAr: "فتة بيستاشيو ملكي",
      nameEn: "Royal Pistachio Fatta",
      category: "فتة",
      basePrice: 90,
      sizes: mlSizes(90, 105),
      description: "فتة وافل غارقة بكريمة الفستق الحلبي مع رشة مكسرات (M: 90 ج.م / L: 105 ج.م).",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      sortOrder: 26,
    },
    {
      nameAr: "فتة ميكس صوصات",
      nameEn: "Mix Sauces Fatta",
      category: "فتة",
      basePrice: 75,
      sizes: mlSizes(75, 90),
      description: "فتة وافل هاوس بتشكيلة ساحرة من صوصات النوتيلا واللوتس والوايت (M: 75 ج.م / L: 90 ج.م).",
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
      sortOrder: 27,
    },

    // ── طواجن (Casseroles) - حجمين: M و L ──
    {
      nameAr: "طاجن شوكليت نوتيلا",
      nameEn: "Nutella Casserole",
      category: "طواجن",
      basePrice: 55,
      sizes: mlSizes(55, 70),
      description: "طاجن كيك دافئ خارج من الفرن غارق في شوكولاتة نوتيلا (M: 55 ج.م / L: 70 ج.م).",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
      sortOrder: 28,
    },
    {
      nameAr: "طاجن كندر",
      nameEn: "Kinder Casserole",
      category: "طواجن",
      basePrice: 65,
      sizes: mlSizes(65, 75),
      description: "طاجن كيك ساخن بصوص وشوكولاتة كندر الغنية (M: 65 ج.م / L: 75 ج.م).",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
      sortOrder: 29,
    },
    {
      nameAr: "طاجن لوتس",
      nameEn: "Lotus Casserole",
      category: "طواجن",
      basePrice: 65,
      sizes: mlSizes(65, 75),
      description: "طاجن ساخن بخلطة زبدة اللوتس الأصلية وبسكويت لوتس (M: 65 ج.م / L: 75 ج.م).",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      sortOrder: 30,
    },
    {
      nameAr: "طاجن بيستاشيو",
      nameEn: "Pistachio Casserole",
      category: "طواجن",
      basePrice: 75,
      sizes: mlSizes(75, 85),
      description: "طاجن غني بكريمة الفستق الحلبي الطبيعي ورشة فستق (M: 75 ج.م / L: 85 ج.م).",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      sortOrder: 31,
    },

    // ── دوناتس وميني دونتس (Donuts) ──
    {
      nameAr: "دود فروت دوناتس (NEW)",
      nameEn: "Dodo Fruit Donuts",
      category: "دوناتس",
      basePrice: 50,
      sizes: null,
      description: "دوناتس محشية كريم باستري + قطع فراولة وموز + سكر بودرة.",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
      sortOrder: 32,
    },
    {
      nameAr: "دودو فروت كريمي تشيز نوتيلا (NEW)",
      nameEn: "Dodo Creamy Cheese Nutella",
      category: "دوناتس",
      basePrice: 50,
      sizes: null,
      description: "دوناتس محشية كريمي تشيز نوتيلا + فراولة وموز + سكر بودرة.",
      image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600",
      sortOrder: 33,
    },
    {
      nameAr: "دوناتس كريمي تشيز فراولة (NEW)",
      nameEn: "Creamy Cheese Strawberry Donut",
      category: "دوناتس",
      basePrice: 55,
      sizes: null,
      description: "دوناتس محشية كريمي تشيز فراولة + قطع فراولة وموز + سكر بودرة.",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
      sortOrder: 34,
    },
    {
      nameAr: "ميني دونتس (شوكليت / أوريو / لوتس / كندر)",
      nameEn: "Mini Donuts Assorted",
      category: "دوناتس",
      basePrice: 25,
      sizes: JSON.stringify([
        { nameAr: "4 قطع", nameEn: "4 Pcs", price: 25 },
        { nameAr: "8 قطع", nameEn: "8 Pcs", price: 45 },
      ]),
      description: "حبات ميني دونتس هشة وخفيفة بصوصات متنوعة (4 قطع: 25 ج.م / 8 قطع: 45 ج.م).",
      image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600",
      sortOrder: 35,
    },

    // ── الموتشي (Mochi) ──
    {
      nameAr: "موتشي ياباني مثلج (فانيليا / شوكليت / مانجا / فراولة)",
      nameEn: "Japanese Ice Cream Mochi",
      category: "الموتشي",
      basePrice: 25,
      sizes: JSON.stringify([
        { nameAr: "قطعة واحدة", nameEn: "1 Pc", price: 25 },
        { nameAr: "قطعتين", nameEn: "2 Pcs", price: 45 },
      ]),
      description: "حلوى الموتشي اليابانية الشهيرة المحشوة بالآيس كريم المثلج الطبيعي (قطعة 25 ج.م / قطعتين 45 ج.م).",
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
      sortOrder: 36,
    },
    {
      nameAr: "موتشي ميكس بيري وزبادي توت وبطيخ",
      nameEn: "Mochi Berries & Yogurt & Watermelon",
      category: "الموتشي",
      basePrice: 28,
      sizes: JSON.stringify([
        { nameAr: "قطعة واحدة", nameEn: "1 Pc", price: 28 },
        { nameAr: "قطعتين", nameEn: "2 Pcs", price: 50 },
      ]),
      description: "موتشي بنكهات منعشة وخفيفة من التوت المشكل والزبادي والبطيخ (قطعة 28 ج.م / قطعتين 50 ج.م).",
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
      sortOrder: 37,
    },

    // ── كاسات (Cups) ──
    {
      nameAr: "وافل هاوس كاب",
      nameEn: "Waffle House Cup",
      category: "كاسات",
      basePrice: 65,
      sizes: null,
      description: "كوب غني بطبقات الوافل المقرمش مع الآيس كريم والنوتيلا واللوتس والمكسرات.",
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
      sortOrder: 38,
    },
    {
      nameAr: "كاس بان كيك (نوتيلا - وايت)",
      nameEn: "Pancake Cup Nutella & White",
      category: "كاسات",
      basePrice: 45,
      sizes: null,
      description: "كاس مليء بقطع الميني بان كيك مع صوصات النوتيلا والشوكولاتة البيضاء.",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
      sortOrder: 39,
    },
    {
      nameAr: "كاس بيستاشيو كاب",
      nameEn: "Pistachio Cup",
      category: "كاسات",
      basePrice: 60,
      sizes: null,
      description: "كاس فاخر بكريمة الفستق والوافل وبسكويت الويفر المقرمش.",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      sortOrder: 40,
    },
    {
      nameAr: "كاس كب الملوك (NEW)",
      nameEn: "Royal Master Cup",
      category: "كاسات",
      basePrice: 105,
      sizes: null,
      description: "أضخم كأس حلويات في وافل هاوس: طبقات وافل + دونتس + كندر + بستاشيو + نوتيلا + آيس كريم.",
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
      sortOrder: 41,
    },

    // ── فريسكة (Freska) ──
    {
      nameAr: "فريسكة وافل هاوس المقرمشة (شوكليت / أوريو / وايت / كندر / بيستاشيو)",
      nameEn: "Crispy Freska Waffle",
      category: "فريسكة",
      basePrice: 35,
      sizes: JSON.stringify([
        { nameAr: "عادي نوتيلا / وايت", nameEn: "Regular Nutella/White", price: 35 },
        { nameAr: "سبيشال كندر / بيستاشيو", nameEn: "Special Kinder/Pistachio", price: 45 },
      ]),
      description: "رقائق الفريسكة المقرمشة المحشوة بأجود أنواع الشوكولاتة والصوصات (35 - 45 ج.م).",
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600",
      sortOrder: 42,
    },

    // ── الكوكيز (Cookies) ──
    {
      nameAr: "كوكيز أورجينال",
      nameEn: "Original Fresh Cookie",
      category: "كوكيز",
      basePrice: 25,
      sizes: null,
      description: "كوكيز أمريكي كلاسيكي طازج بحبيبات الشوكولاتة المقرمشة.",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
      sortOrder: 43,
    },
    {
      nameAr: "كوكيز نوتيلا",
      nameEn: "Nutella Stuffed Cookie",
      category: "كوكيز",
      basePrice: 35,
      sizes: null,
      description: "كوكيز طري محشو ومغطى بصوص شوكولاتة نوتيلا الأصلية.",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
      sortOrder: 44,
    },
    {
      nameAr: "كوكيز نوتيلا آيس كريم ساندوتش",
      nameEn: "Nutella Ice Cream Cookie Sandwich",
      category: "كوكيز",
      basePrice: 50,
      sizes: null,
      description: "ساندوتش كوكيز عملاق محشو ببولة آيس كريم فانيليا غنية وصوص نوتيلا.",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
      sortOrder: 45,
    },

    // ── بوبا (Boba Drinks) - حجمين: M و L ──
    {
      nameAr: "بوبا سموزي (مانجا / فراولة / ميكس بيري / خوخ / بطيخ)",
      nameEn: "Boba Fresh Smoothie",
      category: "بوبا",
      basePrice: 65,
      sizes: mlSizes(65, 75),
      description: "سموزي فواكه مثلج ومنعش مع لآلئ البوبا المنفجرة والممتعة (M: 65 ج.م / L: 75 ج.م).",
      image: "https://images.unsplash.com/photo-1558857563-b37fe78a9dd3?w=600",
      sortOrder: 46,
    },
    {
      nameAr: "بوبا صودا (توت / باشون فروت / كريز / جيلي كولا)",
      nameEn: "Boba Soda Refreshing",
      category: "بوبا",
      basePrice: 70,
      sizes: mlSizes(70, 80),
      description: "مشروب صودا فوار ومثلج بنكهات الفواكه المنعشة وحبات البوبا الطازجة (M: 70 ج.م / L: 80 ج.م).",
      image: "https://images.unsplash.com/photo-1558857563-b37fe78a9dd3?w=600",
      sortOrder: 47,
    },
    {
      nameAr: "بوبا ميلك شيك (فرابتشينو / فانيليا / شوكليت / لوتس / بلوبيري)",
      nameEn: "Boba Milkshake",
      category: "بوبا",
      basePrice: 70,
      sizes: mlSizes(70, 80),
      description: "ميلك شيك كريمي مثلج ممزوج بلآلئ التابيوكا التايوانية اللذيذة (M: 70 ج.م / L: 80 ج.م).",
      image: "https://images.unsplash.com/photo-1558857563-b37fe78a9dd3?w=600",
      sortOrder: 48,
    },

    // ── ميلك شيك (Milkshakes) - حجمين: M و L ──
    {
      nameAr: "ميلك شيك وافل هاوس (فانيليا / شوكليت / مانجا / فراولة / كراميل / لوتس)",
      nameEn: "Classic Milkshakes",
      category: "ميلك شيك",
      basePrice: 45,
      sizes: mlSizes(45, 55),
      description: "ميلك شيك كريمي محضر بآيس كريم طبيعي وحليب طازج (M: 45 ج.م / L: 55 ج.م).",
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
      sortOrder: 49,
    },
    {
      nameAr: "سبيشال ميلك شيك (أوريو كريم / لوتس / هوهوز / توينكز / براوني / بيستاشيو)",
      nameEn: "Special Cream Milkshakes",
      category: "ميلك شيك",
      basePrice: 55,
      sizes: mlSizes(55, 65),
      description: "ميلك شيك دسم وغني بقطع الشوكولاتة والكيك والكريمة المخفوقة (M: 55 ج.م / L: 65 ج.م).",
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
      sortOrder: 50,
    },

    // ── سموزي وصودا (Smoothies & Soda) - حجمين: M و L ──
    {
      nameAr: "سموزي طبيعي مثلج (ليمون نعناع / بطيخ / مانجا / فراولة / ميكس بيري / كيوي)",
      nameEn: "Fresh Natural Smoothies",
      category: "سموزي وصودا",
      basePrice: 40,
      sizes: mlSizes(40, 50),
      description: "سموزي فواكه طبيعية مثلجة ومنعشة تروي العطش (M: 40 ج.م / L: 50 ج.م).",
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
      sortOrder: 51,
    },
    {
      nameAr: "صودا منعشة (توت / كريز / أناناس / صن شاين / تفاح أخضر / باشون / بينا كولادا)",
      nameEn: "Flavored Soda Drinks",
      category: "سموزي وصودا",
      basePrice: 45,
      sizes: mlSizes(45, 55),
      description: "مشروبات صودا مثلجة بنكهات السيرب الفاخرة (M: 45 ج.م / L: 55 ج.م).",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
      sortOrder: 52,
    },
  ];

  await prisma.product.deleteMany({});
  for (const prod of products) {
    await prisma.product.create({
      data: {
        nameAr: prod.nameAr,
        nameEn: prod.nameEn,
        category: prod.category,
        basePrice: prod.basePrice,
        sizes: prod.sizes,
        image: prod.image,
        description: prod.description,
        sortOrder: prod.sortOrder,
        isAvailable: true,
      },
    });
  }

  console.log(`✅ Successfully seeded ${products.length} products with two-tier pricing variants and Cairo delivery zones!`);
  await prisma.$disconnect();
}

seedExactMenu().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
