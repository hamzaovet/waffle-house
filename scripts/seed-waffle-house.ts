import { prisma } from "../lib/prisma";
import { createHash } from "crypto";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

async function seed() {
  console.log("🚀 Starting Waffle House Cairo Database Seeding...");

  // 1. Users: Maestro Owner & User Demo
  console.log("👤 Seeding Accounts: maestro (owner) & user (client demo)...");

  // Maestro Owner
  await prisma.user.upsert({
    where: { phone: "01018671000" },
    update: {
      name: "المايسترو (المالك)",
      username: "maestro",
      passwordHash: sha256("123456789"),
      pin: "157230",
      role: "owner",
      department: "الإدارة العليا",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    },
    create: {
      name: "المايسترو (المالك)",
      username: "maestro",
      passwordHash: sha256("123456789"),
      phone: "01018671000",
      pin: "157230",
      role: "owner",
      department: "الإدارة العليا",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    },
  });

  // Client Demo User
  await prisma.user.upsert({
    where: { phone: "01000000000" },
    update: {
      name: "تجربة العميل (Demo Client)",
      username: "user",
      passwordHash: sha256("123456"),
      pin: "123456",
      role: "cashier",
      department: "الكاشير والتجربة",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    },
    create: {
      name: "تجربة العميل (Demo Client)",
      username: "user",
      passwordHash: sha256("123456"),
      phone: "01000000000",
      pin: "123456",
      role: "cashier",
      department: "الكاشير والتجربة",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    },
  });

  // 2. System Settings
  console.log("⚙️ Initializing System Settings for Waffle House Cairo...");
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      restaurantName: "Waffle House",
      phone: "01018671000",
      address: "القاهرة - مصر",
      isLockedDown: false,
      soundsEnabled: true,
      offersEnabled: true,
    },
    create: {
      id: "default",
      restaurantName: "Waffle House",
      phone: "01018671000",
      address: "القاهرة - مصر",
      isLockedDown: false,
      soundsEnabled: true,
      offersEnabled: true,
      deliveryZones: JSON.stringify([
        { name: "التجمع الخامس", fee: 45 },
        { name: "مدينة نصر", fee: 35 },
        { name: "مصر الجديدة", fee: 35 },
        { name: "المعادي", fee: 40 },
        { name: "المهندسين والدقي", fee: 35 },
      ]),
    },
  });

  // 3. Cairo Delivery Zones (Dynamic DeliveryZone table)
  console.log("📍 Seeding Cairo Delivery Zones...");
  const cairoZones = [
    { code: "CAI-01", nameAr: "التجمع الخامس - القاهرة الجديدة", nameEn: "New Cairo - 5th Settlement", fee: 45.0, timeMinutes: 40 },
    { code: "CAI-02", nameAr: "التجمع الأول والرحاب", nameEn: "1st Settlement & El Rehab", fee: 50.0, timeMinutes: 45 },
    { code: "CAI-03", nameAr: "مدينتي والشروق وبدر", nameEn: "Madinaty & El Shorouk", fee: 65.0, timeMinutes: 55 },
    { code: "CAI-04", nameAr: "مدينة نصر - رابعة والحي السابع", nameEn: "Nasr City", fee: 35.0, timeMinutes: 35 },
    { code: "CAI-05", nameAr: "مصر الجديدة - الكوربة والميرغني وروكسي", nameEn: "Heliopolis", fee: 35.0, timeMinutes: 35 },
    { code: "CAI-06", nameAr: "مساكن شيراتون والنزهة الجديدة", nameEn: "Sheraton & New Nozha", fee: 40.0, timeMinutes: 40 },
    { code: "CAI-07", nameAr: "المعادي ودجلة وثكنات المعادي", nameEn: "Maadi & Degla", fee: 40.0, timeMinutes: 40 },
    { code: "CAI-08", nameAr: "المقطم والهضبة الوسطى", nameEn: "Mokattam", fee: 40.0, timeMinutes: 40 },
    { code: "CAI-09", nameAr: "الزمالك", nameEn: "Zamalek", fee: 40.0, timeMinutes: 40 },
    { code: "CAI-10", nameAr: "المهندسين والدقي والعجوزة", nameEn: "Mohandessin, Dokki & Agouza", fee: 35.0, timeMinutes: 35 },
    { code: "CAI-11", nameAr: "وسط البلد والتحرير وجاردن سيتي", nameEn: "Downtown Cairo & Garden City", fee: 35.0, timeMinutes: 35 },
    { code: "CAI-12", nameAr: "شبرا ومصر القديمة والمنيل", nameEn: "Shoubra, Manyal & Old Cairo", fee: 40.0, timeMinutes: 45 },
    { code: "CAI-13", nameAr: "الهرم وفيصل والجيزة", nameEn: "Haram & Faisal", fee: 45.0, timeMinutes: 45 },
    { code: "CAI-14", nameAr: "حدائق الأهرام", nameEn: "Hadayek Al Ahram", fee: 55.0, timeMinutes: 50 },
    { code: "CAI-15", nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed", fee: 65.0, timeMinutes: 55 },
    { code: "CAI-16", nameAr: "القاهرة", nameEn: "6th of October", fee: 70.0, timeMinutes: 60 },
    { code: "CAI-17", nameAr: "العاصمة الإدارية الجديدة", nameEn: "New Administrative Capital", fee: 75.0, timeMinutes: 60 },
    { code: "CAI-18", nameAr: "المستقبل سيتي وسراي", nameEn: "Mostakbal City & Sarai", fee: 65.0, timeMinutes: 50 },
    { code: "CAI-19", nameAr: "عين شمس وجسر السويس والمطرية", nameEn: "Ain Shams & Gesr El Suez", fee: 40.0, timeMinutes: 45 },
    { code: "CAI-20", nameAr: "حلوان والمعصرة", nameEn: "Helwan & Maasara", fee: 55.0, timeMinutes: 50 },
  ];

  await prisma.deliveryZone.deleteMany({});
  for (const z of cairoZones) {
    await prisma.deliveryZone.create({
      data: {
        code: z.code,
        nameAr: z.nameAr,
        nameEn: z.nameEn,
        fee: z.fee,
        timeMinutes: z.timeMinutes,
        isActive: true,
      },
    });
  }

  // 4. Delivery Captains
  console.log("🛵 Seeding Delivery Captains...");
  const defaultCaptains = [
    { name: "كابتن إسلام محمود", phone: "01099887766", vehicle: "سكوتر" },
    { name: "كابتن مصطفى علي", phone: "01122334455", vehicle: "موتوسيكل" },
    { name: "كابتن كريم أحمد", phone: "01233445566", vehicle: "سكوتر كهربائي" },
  ];
  for (const cap of defaultCaptains) {
    await prisma.captain.upsert({
      where: { phone: cap.phone },
      update: { name: cap.name, vehicle: cap.vehicle },
      create: cap,
    });
  }

  // 5. Categories
  console.log("🏷️ Seeding Waffle House Categories...");
  const categories = [
    { nameAr: "وافل", nameEn: "Waffles", image: "/cards/waffle-card.png", sortOrder: 1 },
    { nameAr: "كريب", nameEn: "Crepes", image: "/cards/crepe-card.png", sortOrder: 2 },
    { nameAr: "بان كيك", nameEn: "Pancakes", image: "/cards/pancake-card.png", sortOrder: 3 },
    { nameAr: "سبيشال وافل هاوس", nameEn: "Specials", image: "/cards/special-card.png", sortOrder: 4 },
    { nameAr: "ايس كريم", nameEn: "Ice Cream", image: "/cards/icecream-card.png", sortOrder: 5 },
    { nameAr: "ميلك شيك وسموزي", nameEn: "Milkshakes", image: "/cards/milkshake-card.png", sortOrder: 6 },
    { nameAr: "مشروبات وقهوة", nameEn: "Beverages", image: "/cards/coffee-card.png", sortOrder: 7 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { nameAr: cat.nameAr },
      update: { nameEn: cat.nameEn, image: cat.image, sortOrder: cat.sortOrder },
      create: {
        id: "cat_" + Math.random().toString(36).substring(2, 9),
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: cat.sortOrder,
      },
    });
  }

  // 6. Products
  console.log("🧇 Seeding Gourmet Waffle House Products...");
  const products = [
    // Waffles
    {
      nameAr: "وافل نوتيلا بلجيكي أصلي",
      nameEn: "Original Belgian Nutella Waffle",
      category: "وافل",
      basePrice: 95,
      image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600",
      description: "وافل بلجيكي ذهبي مقرمش من الخارج وهش من الداخل، مغطى بطبقة سخية من شوكولاتة نوتيلا الأصلية الغنية.",
      sortOrder: 1,
    },
    {
      nameAr: "وافل لوتس بيسكوف كرانشي",
      nameEn: "Lotus Biscoff Crunchy Waffle",
      category: "وافل",
      basePrice: 105,
      image: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600",
      description: "وافل ساخن مغطى بزبدة لوتس سبريد الأصلية مع رشة بسكويت لوتس محمص ومقرمش وصوص الكراميل الفاخر.",
      sortOrder: 2,
    },
    {
      nameAr: "وافل كيندر بوينو وايت",
      nameEn: "Kinder Bueno White Waffle",
      category: "وافل",
      basePrice: 110,
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      description: "وافل شهي مغطى بقطع أصابع كيندر بوينو وصوص حليبي ناعم وشوكولاتة بيضاء غنية.",
      sortOrder: 3,
    },
    {
      nameAr: "وافل ميكس شوكولاتة وفواكه طازجة",
      nameEn: "Mix Chocolate & Fresh Fruits Waffle",
      category: "وافل",
      basePrice: 115,
      image: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600",
      description: "توليفة ممتازة بين شوكولاتة نوتيلا والشوكولاتة البيضاء مع قطع الموز والفراولة الطازجة.",
      sortOrder: 4,
    },
    {
      nameAr: "وافل بيستاشيو ملكي",
      nameEn: "Royal Pistachio Waffle",
      category: "وافل",
      basePrice: 130,
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
      description: "وافل بلجيكي فاخر مغطى بكريمة الفستق الحلبي الطبيعي 100% مع رشة فستق محمص مقرمش.",
      sortOrder: 5,
    },
    {
      nameAr: "وافل ستيك كرانشي (3 قطع)",
      nameEn: "Crunchy Waffle Sticks (3 Pcs)",
      category: "وافل",
      basePrice: 80,
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600",
      description: "3 أصابع وافل ستيك مقرمشة على عصا، مغطاة بالنوتيلا واللوتس والأوريو لتجربة سريعة ولذيذة.",
      sortOrder: 6,
    },

    // Crepes
    {
      nameAr: "كريب فيتوتشيني نوتيلا وآيس كريم",
      nameEn: "Fettuccine Crepe with Ice Cream",
      category: "كريب",
      basePrice: 110,
      image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600",
      description: "شرائح كريب رفيعة مقطعة على طريقة الفيتوتشيني الإيطالية غارقة في صوص النوتيلا مع بولة آيس كريم فانيليا.",
      sortOrder: 7,
    },
    {
      nameAr: "كريب نوتيلا مكسرات",
      nameEn: "Nutella & Roasted Nuts Crepe",
      category: "كريب",
      basePrice: 95,
      image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600",
      description: "كريب فرنسي طري ومقرمش الأطراف محشو ومغطى بشوكولاتة نوتيلا ومكسرات البندق واللوز المحمص.",
      sortOrder: 8,
    },
    {
      nameAr: "كريب لوتس كيك رول",
      nameEn: "Lotus Cake Roll Crepe",
      category: "كريب",
      basePrice: 105,
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      description: "رول كريب محشو بكريمة اللوتس وكيك هش ومغطى بصوص اللوتس وبسكويت لوتس ناعم.",
      sortOrder: 9,
    },
    {
      nameAr: "كريب براونيز شوكولاتة ميكس",
      nameEn: "Brownies Mix Chocolate Crepe",
      category: "كريب",
      basePrice: 110,
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
      description: "كريب محشو بقطع فدج البراونيز الغنية بالشوكولاتة مع طبقات من النوتيلا والشوكولاتة البيضاء البلجيكية.",
      sortOrder: 10,
    },

    // Pancakes
    {
      nameAr: "ميني بان كيك 12 قطعة نوتيلا",
      nameEn: "Mini Pancakes 12 Pcs Nutella",
      category: "بان كيك",
      basePrice: 80,
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
      description: "12 قطعة ميني بان كيك هشة وطرية مغطاة بصوص شوكولاتة نوتيلا البلجيكية الغنية.",
      sortOrder: 11,
    },
    {
      nameAr: "ميني بان كيك 24 قطعة ميكس بارتي بوكس",
      nameEn: "Mini Pancakes 24 Pcs Party Box",
      category: "بان كيك",
      basePrice: 140,
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      description: "بوكس التجمعات الفاخر 24 قطعة ميني بان كيك مقسمة بين نوتيلا، لوتس، كيندر، وبستاشيو.",
      sortOrder: 12,
    },
    {
      nameAr: "بان كيك تاور شوكولاتة بيضاء وفراولة",
      nameEn: "White Choco Strawberry Pancake Tower",
      category: "بان كيك",
      basePrice: 95,
      image: "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=600",
      description: "برج من طبقات البان كيك الأمريكية الشهية مع الشوكولاتة البيضاء وشرائح الفراولة الطازجة.",
      sortOrder: 13,
    },

    // Waffle House Specials
    {
      nameAr: "بوكس السعادة العائلي وافل هاوس",
      nameEn: "Waffle House Family Happiness Box",
      category: "سبيشال وافل هاوس",
      basePrice: 260,
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
      description: "البوكس الأقوى للتجمعات: 1 وافل نوتيلا كامل + 1 كريب لوتس + 12 ميني بان كيك + صوصات إضافية فاخرة.",
      sortOrder: 14,
    },
    {
      nameAr: "طاجن نوتيلا كيك غرقان بالآيس كريم",
      nameEn: "Molten Nutella Cake Casserole",
      category: "سبيشال وافل هاوس",
      basePrice: 90,
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
      description: "طاجن فخار ساخن من الفرن محشو بكيك الشوكولاتة الذائبة والغارقة في النوتيلا مع بولة آيس كريم.",
      sortOrder: 15,
    },
    {
      nameAr: "قنبلة وافل هاوس سبيشال",
      nameEn: "Waffle House Mega Bomb",
      category: "سبيشال وافل هاوس",
      basePrice: 135,
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      description: "قنبلة الديسرت المميزة: طبقات من الوافل المقرمش مع البراونيز وبولات الآيس كريم والمكسرات وصوصات الشوكولاتة.",
      sortOrder: 16,
    },

    // Ice Cream
    {
      nameAr: "وافل صنداي آيس كريم لوتس ونوتيلا",
      nameEn: "Waffle Sundae Lotus & Nutella",
      category: "ايس كريم",
      basePrice: 75,
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
      description: "كوب صنداي غني بقطع الوافل المقرمشة مع بولات آيس كريم فانيليا وصوصات نوتيلا ولوتس.",
      sortOrder: 17,
    },
    {
      nameAr: "بولة آيس كريم إيطالي فاخر",
      nameEn: "Artisanal Italian Ice Cream Scoop",
      category: "ايس كريم",
      basePrice: 30,
      image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600",
      description: "بولة آيس كريم طبيعي غني بنكهات متعددة (فانيليا بوربون، شوكولاتة داكنة، فستق، مانجو، لوتس).",
      sortOrder: 18,
    },

    // Milkshakes & Smoothies
    {
      nameAr: "ميلك شيك لوتس فاخر",
      nameEn: "Lotus Biscoff Milkshake",
      category: "ميلك شيك وسموزي",
      basePrice: 75,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
      description: "ميلك شيك كريمي مثلج ممزوج بآيس كريم الفانيليا وزبدة اللوتس الأصلية مع كريمة مخفوقة وبسكويت لوتس.",
      sortOrder: 19,
    },
    {
      nameAr: "ميلك شيك نوتيلا كرانشي",
      nameEn: "Nutella Crunchy Milkshake",
      category: "ميلك شيك وسموزي",
      basePrice: 75,
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
      description: "ميلك شيك غني بالنوتيلا والأوريو المقرمش مع صوص الشوكولاتة الداكنة الكثيف.",
      sortOrder: 20,
    },
    {
      nameAr: "سموزي فراولة وتوت مشكل فريش",
      nameEn: "Fresh Strawberry & Mixed Berries Smoothie",
      category: "ميلك شيك وسموزي",
      basePrice: 65,
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
      description: "سموزي منعش وطبيعي 100% من الفراولة الطازجة والتوت المشكل المثلج.",
      sortOrder: 21,
    },
    {
      nameAr: "بوبا ميلك تي براون شوجر",
      nameEn: "Brown Sugar Boba Milk Tea",
      category: "ميلك شيك وسموزي",
      basePrice: 80,
      image: "https://images.unsplash.com/photo-1558857563-b37fe78a9dd3?w=600",
      description: "شاي حليب مثلج مع لآلئ التابيوكا التايوانية الطرية وصوص السكر البني المكرمل المميز.",
      sortOrder: 22,
    },

    // Beverages & Coffee
    {
      nameAr: "اسبريسو دوبل إيطالي",
      nameEn: "Italian Double Espresso",
      category: "مشروبات وقهوة",
      basePrice: 45,
      image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600",
      description: "شوت اسبريسو مركز ومستخلص من حبوب بن أرابيكا 100% بكريمة ذهبية غنية ورائحة آسرة.",
      sortOrder: 23,
    },
    {
      nameAr: "كافيه لاتيه كراميل",
      nameEn: "Caramel Cafe Latte",
      category: "مشروبات وقهوة",
      basePrice: 65,
      image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600",
      description: "اسبريسو مع حليب مبخر ساخن برغوة مخملية ونكهة الكراميل الذهبي اللذيذ.",
      sortOrder: 24,
    },
    {
      nameAr: "هوت شوكليت مارشميلو غني",
      nameEn: "Rich Marshmallow Hot Chocolate",
      category: "مشروبات وقهوة",
      basePrice: 65,
      image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600",
      description: "شوكولاتة ساخنة غنية وكثيفة محضرة بالحليب الطازج ومزينة بقطع المارشميلو الذائبة.",
      sortOrder: 25,
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
        image: prod.image,
        description: prod.description,
        sortOrder: prod.sortOrder,
        isAvailable: true,
      },
    });
  }

  console.log(`✅ Successfully seeded ${products.length} products, ${categories.length} categories, ${cairoZones.length} Cairo zones, and accounts!`);
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
