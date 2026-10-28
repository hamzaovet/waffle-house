import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const adapter = new PrismaPg({ connectionString: rawUrl }, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting Waffle House Database Seeding...");

  // 1. Master Owner Account (maestro / 123456789)
  console.log("👤 Creating/Updating Master Owner Account: maestro");
  await prisma.user.upsert({
    where: { phone: "01018671000" },
    update: {
      name: "المالك (Maestro)",
      username: "maestro",
      passwordHash: "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225",
      role: "owner",
      department: "الإدارة العليا",
    },
    create: {
      name: "المالك (Maestro)",
      username: "maestro",
      passwordHash: "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225",
      phone: "01018671000",
      pin: "123456",
      role: "owner",
      department: "الإدارة العليا",
    },
  });

  // 2. Staff Accounts (cashier & chef)
  await prisma.user.upsert({
    where: { phone: "01099998881" },
    update: {},
    create: {
      name: "كاشير الصالة",
      username: "cashier1",
      passwordHash: "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225",
      phone: "01099998881",
      pin: "123456",
      role: "cashier",
      department: "الكاشير",
    },
  });

  // 3. System Settings
  console.log("⚙️ Initializing System Settings for Waffle House");
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      restaurantName: "Waffle House",
      phone: "01018671000",
      address: "القاهرة - مصر",
    },
    create: {
      id: "default",
      restaurantName: "Waffle House",
      phone: "01018671000",
      address: "القاهرة - مصر",
      soundsEnabled: true,
      deliveryZones: JSON.stringify([
        { name: "الحي الأول", fee: 20 },
        { name: "الحي الثاني", fee: 25 },
        { name: "الحي المتميز", fee: 40 }
      ]),
    },
  });

  // 4. Delivery Captains
  console.log("🛵 Seeding Delivery Captains");
  const defaultCaptains = [
    { name: "كابتن إسلام عادل", phone: "01011223344", vehicle: "سكوتر" },
    { name: "كابتن محمد رمضان", phone: "01122334455", vehicle: "موتوسيكل" },
    { name: "كابتن أحمد سامي", phone: "01233445566", vehicle: "سكوتر" },
  ];
  for (const cap of defaultCaptains) {
    await prisma.captain.upsert({
      where: { phone: cap.phone },
      update: { name: cap.name, vehicle: cap.vehicle },
      create: cap,
    });
  }

  // 5. Delivery Zones (from Excel - 84 zones)
  console.log("📍 Seeding 84 Delivery Zones from Excel...");
  const zonesData = [
  {
    "code": "7577",
    "nameEn": "Smart Village",
    "nameAr": "القرية الذكية",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "7923",
    "nameEn": "6th of October - Dream Land",
    "nameAr": "السادس من اكتوبر - دريم لاند",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "7924",
    "nameEn": "6th of October - El Hay El Motamyez",
    "nameAr": "السادس من اكتوبر - الحي المتميز",
    "fee": 40.0,
    "timeMinutes": 45
  },
  {
    "code": "7932",
    "nameEn": "6th of October - 10th District",
    "nameAr": "السادس من اكتوبر - الحي 10",
    "fee": 35.0,
    "timeMinutes": 45
  },
  {
    "code": "7934",
    "nameEn": "6th of October - 11th District",
    "nameAr": "السادس من اكتوبر - الحي 11",
    "fee": 35.0,
    "timeMinutes": 45
  },
  {
    "code": "7935",
    "nameEn": "6th of October - 6th District",
    "nameAr": "السادس من اكتوبر - الحي 6",
    "fee": 40.0,
    "timeMinutes": 45
  },
  {
    "code": "7936",
    "nameEn": "6th of October - 12th District",
    "nameAr": "السادس من اكتوبر - الحي 12",
    "fee": 40.0,
    "timeMinutes": 60
  },
  {
    "code": "7947",
    "nameEn": "Hadayek El Ahram - Area A",
    "nameAr": "حدائق الاهرام - منطقة أ",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7948",
    "nameEn": "Hadayek El Ahram - Area B",
    "nameAr": "حدائق الاهرام - منطقة ب",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7949",
    "nameEn": "Hadayek El Ahram - Area د",
    "nameAr": "حدائق الاهرام - منطقة د",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7950",
    "nameEn": "Hadayek El Ahram - Area ع",
    "nameAr": "حدائق الاهرام - منطقة ع",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7951",
    "nameEn": "Hadayek El Ahram - Area ج",
    "nameAr": "حدائق الاهرام - منطقة ج",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7952",
    "nameEn": "Hadayek El Ahram - Area ح",
    "nameAr": "حدائق الاهرام - منطقة ح",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7953",
    "nameEn": "Hadayek El Ahram - Area هـ",
    "nameAr": "حدائق الاهرام - منطقة هـ",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7954",
    "nameEn": "Hadayek El Ahram - Area ك",
    "nameAr": "حدائق الاهرام - منطقة ك",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7955",
    "nameEn": "Hadayek El Ahram - Area ل",
    "nameAr": "حدائق الاهرام - منطقة ل",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7956",
    "nameEn": "Hadayek El Ahram - Area م",
    "nameAr": "حدائق الاهرام - منطقة م",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7957",
    "nameEn": "Hadayek El Ahram - Area ن",
    "nameAr": "حدائق الاهرام - منطقة ن",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7958",
    "nameEn": "Hadayek El Ahram - Area و",
    "nameAr": "حدائق الاهرام - منطقة و",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7959",
    "nameEn": "Hadayek El Ahram - Area س",
    "nameAr": "حدائق الاهرام - منطقة س",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7960",
    "nameEn": "Hadayek El Ahram - Area ص",
    "nameAr": "حدائق الاهرام - منطقة ص",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7961",
    "nameEn": "Hadayek El Ahram - Area ت",
    "nameAr": "حدائق الاهرام - منطقة ت",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7962",
    "nameEn": "Hadayek El Ahram - Area ز",
    "nameAr": "حدائق الاهرام - منطقة ز",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7987",
    "nameEn": "6th of October - West Somed",
    "nameAr": "السادس من اكتوبر - غرب سوميد",
    "fee": 35.0,
    "timeMinutes": 60
  },
  {
    "code": "7988",
    "nameEn": "6th of October - Production City",
    "nameAr": "السادس من اكتوبر - مدينة الانتاج",
    "fee": 65.0,
    "timeMinutes": 60
  },
  {
    "code": "7989",
    "nameEn": "6th of October - New Giza",
    "nameAr": "السادس من اكتوبر - نيو جيزة",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "7990",
    "nameEn": "6th of October - El Fardous",
    "nameAr": "السادس من اكتوبر - الفردوس",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "7991",
    "nameEn": "6th of October - El Ashgar City",
    "nameAr": "السادس من اكتوبر - مدينة الاشجار",
    "fee": 75.0,
    "timeMinutes": 60
  },
  {
    "code": "7992",
    "nameEn": "6th of October - Zewail City",
    "nameAr": "السادس من اكتوبر - مدينة زويل",
    "fee": 75.0,
    "timeMinutes": 60
  },
  {
    "code": "7993",
    "nameEn": "6th of October - Beta Gardens",
    "nameAr": "السادس من اكتوبر - بيتا جاردنز",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "7994",
    "nameEn": "6th of October - El Montzah",
    "nameAr": "السادس من اكتوبر - المنتزة‎‎‎‎‎‎‎",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "7995",
    "nameEn": "6th of October - Mashroa' El Eskan El Qawmy",
    "nameAr": "السادس من اكتوبر - مشروع الاسكان القومي",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "7996",
    "nameEn": "6th of October - Haram City",
    "nameAr": "السادس من اكتوبر - هرم سيتي‎‎‎‎‎‎‎‎",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "7997",
    "nameEn": "6th of October - Lake Front",
    "nameAr": "السادس من اكتوبر - ليك فرونت",
    "fee": 80.0,
    "timeMinutes": 60
  },
  {
    "code": "7999",
    "nameEn": "6th of October - Degla Palms",
    "nameAr": "السادس من اكتوبر - دجلة بالمز",
    "fee": 80.0,
    "timeMinutes": 60
  },
  {
    "code": "8000",
    "nameEn": "6th of October - Eskan Gama'et El Qahera",
    "nameAr": "السادس من اكتوبر - اسكان جامعة القاهرة",
    "fee": 45.0,
    "timeMinutes": 60
  },
  {
    "code": "8001",
    "nameEn": "6th of October - Ruyaa Club",
    "nameAr": "السادس من اكتوبر - نادي رؤية",
    "fee": 65.0,
    "timeMinutes": 60
  },
  {
    "code": "8004",
    "nameEn": "6th of October - Eskan El Shabab",
    "nameAr": "السادس من اكتوبر - اسكان الشباب",
    "fee": 45.0,
    "timeMinutes": 60
  },
  {
    "code": "8005",
    "nameEn": "6th of October - El Bashayer",
    "nameAr": "السادس من اكتوبر - البشاير‎‎‎‎‎‎‎‎‎‎",
    "fee": 45.0,
    "timeMinutes": 60
  },
  {
    "code": "8006",
    "nameEn": "6th of October - Wahet El Mohandsen",
    "nameAr": "السادس من اكتوبر - واحة المهندسين",
    "fee": 45.0,
    "timeMinutes": 60
  },
  {
    "code": "8007",
    "nameEn": "6th of October - Teba Gardens",
    "nameAr": "السادس من اكتوبر - طيبة جاردنز",
    "fee": 35.0,
    "timeMinutes": 60
  },
  {
    "code": "8008",
    "nameEn": "6th of October - El Shamaleyat 2000",
    "nameAr": "السادس من اكتوبر - الشماليات 2000",
    "fee": 55.0,
    "timeMinutes": 60
  },
  {
    "code": "8009",
    "nameEn": "6th of October - Dahshur Road",
    "nameAr": "السادس من اكتوبر - طريق دهشور",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8053",
    "nameEn": "El Sheikh Zayed - Al Ahly Club",
    "nameAr": "الشيخ زايد - النادي الاهلي",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "8054",
    "nameEn": "El Sheikh Zayed - Beverly Hills",
    "nameAr": "الشيخ زايد - بيفرلي هيلز",
    "fee": 80.0,
    "timeMinutes": 60
  },
  {
    "code": "8055",
    "nameEn": "El Sheikh Zayed - El Hay 1",
    "nameAr": "الشيخ زايد - الحي 1",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8056",
    "nameEn": "El Sheikh Zayed - El Hay 10",
    "nameAr": "الشيخ زايد - الحي 10",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8057",
    "nameEn": "El Sheikh Zayed - El Hay 11",
    "nameAr": "الشيخ زايد - الحي 11",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8058",
    "nameEn": "El Sheikh Zayed - El Hay 12",
    "nameAr": "الشيخ زايد - الحي 12",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8059",
    "nameEn": "El Sheikh Zayed - El Hay 13",
    "nameAr": "الشيخ زايد - الحي 13",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8060",
    "nameEn": "El Sheikh Zayed - El Hay 14",
    "nameAr": "الشيخ زايد - الحي 14",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8061",
    "nameEn": "El Sheikh Zayed - El Hay 15",
    "nameAr": "الشيخ زايد - الحي 15",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8062",
    "nameEn": "El Sheikh Zayed - El Hay 16",
    "nameAr": "الشيخ زايد - الحي 16",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8063",
    "nameEn": "El Sheikh Zayed - El Hay 16 Al Bostan",
    "nameAr": "الشيخ زايد - الحي 16 البستان",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8064",
    "nameEn": "El Sheikh Zayed - El Hay 17",
    "nameAr": "الشيخ زايد - الحي 17",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "8065",
    "nameEn": "El Sheikh Zayed - El Hay 2",
    "nameAr": "الشيخ زايد - الحي 2",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8066",
    "nameEn": "El Sheikh Zayed - El Hay 4",
    "nameAr": "الشيخ زايد - الحي 4",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8067",
    "nameEn": "El Sheikh Zayed - El Hay 5",
    "nameAr": "الشيخ زايد - الحي 5",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8068",
    "nameEn": "El Sheikh Zayed - El Hay 6",
    "nameAr": "الشيخ زايد - الحي 6",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8069",
    "nameEn": "El Sheikh Zayed - El Hay 8",
    "nameAr": "الشيخ زايد - الحي 8",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8070",
    "nameEn": "El Sheikh Zayed - El Hay 9",
    "nameAr": "الشيخ زايد - الحي 9",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8071",
    "nameEn": "El Sheikh Zayed - El Nahda",
    "nameAr": "الشيخ زايد - النهضه",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8073",
    "nameEn": "El Sheikh Zayed - El Hay 7",
    "nameAr": "الشيخ زايد - الحي 7",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8074",
    "nameEn": "El Sheikh Zayed - Nile University",
    "nameAr": "الشيخ زايد - جامعه النيل",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8075",
    "nameEn": "El Sheikh Zayed - Royal City",
    "nameAr": "الشيخ زايد - رويال سيتي",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8076",
    "nameEn": "El Sheikh Zayed - Zayed 2000",
    "nameAr": "الشيخ زايد - زايد 2000",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8077",
    "nameEn": "El Sheikh Zayed",
    "nameAr": "الشيخ زايد",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8079",
    "nameEn": "6th of October - Porto October",
    "nameAr": "السادس من اكتوبر - بورتو اكتوبر",
    "fee": 65.0,
    "timeMinutes": 60
  },
  {
    "code": "8080",
    "nameEn": "6th of October - Chill Out",
    "nameAr": "السادس من اكتوبر - شيل أوت",
    "fee": 50.0,
    "timeMinutes": 60
  },
  {
    "code": "8081",
    "nameEn": "6th of October - Karma City",
    "nameAr": "السادس من اكتوبر - كارما سيتي",
    "fee": 65.0,
    "timeMinutes": 60
  },
  {
    "code": "8082",
    "nameEn": "6th of October - Mountain View",
    "nameAr": "السادس من اكتوبر - ماونتن فيو",
    "fee": 60.0,
    "timeMinutes": 60
  },
  {
    "code": "8083",
    "nameEn": "6th of October - Eskan El Shabab 2",
    "nameAr": "السادس من اكتوبر - اسكان الشباب 2",
    "fee": 90.0,
    "timeMinutes": 60
  },
  {
    "code": "8182",
    "nameEn": "6th of October - Palm Hills",
    "nameAr": "القاهرة - بالم هيلز",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8183",
    "nameEn": "6th of October - Educational City",
    "nameAr": "القاهرة - المدينة التعليمية",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "8184",
    "nameEn": "New Giza - Downtown",
    "nameAr": "نيو جيزة - داون تاون",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "8185",
    "nameEn": "New Giza - El Hay El Awel",
    "nameAr": "نيو جيزة - الحي الأول",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "8186",
    "nameEn": "New Giza - Schools Area",
    "nameAr": "نيو جيزة - منطقة المدارس",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "8187",
    "nameEn": "New Giza - Golf Area",
    "nameAr": "نيو جيزة - منطقة الجولف",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "8188",
    "nameEn": "6th of October - Masged El Shorta",
    "nameAr": "القاهرة - مسجد الشرطة",
    "fee": 75.0,
    "timeMinutes": 60
  },
  {
    "code": "8190",
    "nameEn": "6th of October - Mountain View Park",
    "nameAr": "القاهرة - ماونتن فيو بارك",
    "fee": 100.0,
    "timeMinutes": 60
  },
  {
    "code": "10063",
    "nameEn": "6th of October - El Hay El Motamyez-1",
    "nameAr": "6 اكتوبر - الحى المتميز -1",
    "fee": 45.0,
    "timeMinutes": 60
  },
  {
    "code": "10092",
    "nameEn": "El Sheikh Zayed - El Hay 12 -2",
    "nameAr": "الشيخ زايد - الحي2- 12",
    "fee": 70.0,
    "timeMinutes": 60
  },
  {
    "code": "",
    "nameEn": "6th of October - Section S",
    "nameAr": "السادس من اكتوبر - قطاع ص",
    "fee": 65.0,
    "timeMinutes": 45
  },
  {
    "code": "",
    "nameEn": "6th of October - Cemetery",
    "nameAr": "6 أكتوبر - المقبرة",
    "fee": 65.0,
    "timeMinutes": 45
  }
];
  
  // Clear existing zones to ensure fresh sync
  await prisma.deliveryZone.deleteMany({});
  for (const z of zonesData) {
    await prisma.deliveryZone.create({
      data: {
        code: z.code,
        nameEn: z.nameEn,
        nameAr: z.nameAr,
        fee: z.fee,
        timeMinutes: z.timeMinutes,
        isActive: true,
      }
    });
  }
  console.log("✓ 84 Delivery zones created successfully!");

  // 6. Products Seeding (44 products)
  console.log("🍫 Seeding 44 Waffle House Products...");
  const productsData = [
  {
    "nameAr": "وافل نوتيلا بلجيكي",
    "nameEn": "Nutella Waffle",
    "category": "وافل",
    "basePrice": 129.6,
    "description": "Fresh waffle prepared daily with a soft and light dough, topped with a generous layer of rich and delicious chocolate Nutella, served hot and crispy on the outside.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/وافل_نوتيلا639226680323970276.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 1
  },
  {
    "nameAr": "وافل ميكس نوتيلا وشوكولاتة بيضاء",
    "nameEn": "Waffle Mix",
    "category": "وافل",
    "basePrice": 132.0,
    "description": "Delicious Waffle Mix made from fresh waffle batter, blended with a mix of half Nutella and half white chocolate.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/وافل_ميكس639226680666410955.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 2
  },
  {
    "nameAr": "ميني بانكيك نوتيلا",
    "nameEn": "Nutella Mini Pancake",
    "category": "وافل",
    "basePrice": 128.0,
    "description": "Mini pancakes, Nutella chocolate spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميني_بانكيك_نوتيلا639226681886777828.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 3
  },
  {
    "nameAr": "مولتن كيك نوتيلا بركانية",
    "nameEn": "Nutella Molten Cake",
    "category": "وافل",
    "basePrice": 120.0,
    "description": "A delicate and luxurious chocolate cake, filled with molten Nutella, served warm for an unforgettable sweet experience, combining the cake's tenderness with Nutella's rich flavor.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/6973c5bf-e8d6-4552-9361-a86198369525.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 4
  },
  {
    "nameAr": "تشيز كيك نوتيلا غنية",
    "nameEn": "Nutella Cheesecake",
    "category": "وافل",
    "basePrice": 120.0,
    "description": "Biscuit, cream cheese, choclate Nutella.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/تشيز_كيك__كيندر639226711638929284.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 5
  },
  {
    "nameAr": "تشيز كيك بلوبيري",
    "nameEn": "Blueberry Cheesecake",
    "category": "وافل",
    "basePrice": 104.0,
    "description": "Biscuit, cream cheese, sauce blueberry.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/تشيز_كيك_بلوبيري639226682895965879.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 6
  },
  {
    "nameAr": "وافل شوكولاتة بيضاء وفراولة",
    "nameEn": "White chocolate strawberry waffle",
    "category": "عروض خاصة",
    "basePrice": 136.0,
    "description": "Fresh, crispy waffles topped with a thick layer of smooth white chocolate and garnished with delicious fresh strawberry pieces, served piping hot for an unforgettable sweet treat.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/c8f2aafa-eb72-4698-a5f2-94a009a26d86.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 7
  },
  {
    "nameAr": "وافل كراميل فاخر",
    "nameEn": "Caramel Waffle",
    "category": "عروض خاصة",
    "basePrice": 136.0,
    "description": "A crispy golden waffle, very carefully prepared and topped with rich delicious caramel sauce served hot.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/34e719f2-67eb-4324-850a-c7f145853bf7.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 8
  },
  {
    "nameAr": "وافل نوتيلا وأوريو",
    "nameEn": "Nutella Oreo Waffle",
    "category": "عروض خاصة",
    "basePrice": 136.0,
    "description": "Belgian waffle topped with Nutella and Oreo biscuits",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/f6d1a242-3afe-44ea-b58f-f9723e58acbe.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 9
  },
  {
    "nameAr": "وافل كيندر بوينو",
    "nameEn": "Kinder Waffle",
    "category": "عروض خاصة",
    "basePrice": 144.0,
    "description": "Waffle batter, Kinder chocolate spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/وافل_كيندر639226680425306696.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 11
  },
  {
    "nameAr": "وافل زبدة لوتس",
    "nameEn": "Lotus Waffle",
    "category": "عروض خاصة",
    "basePrice": 116.0,
    "description": "Fresh waffle prepared with a soft and light dough, topped with a generous layer of delicious and distinctive Lotus Biscoff cream.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/وافل_لوتس639226680528274614.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 12
  },
  {
    "nameAr": "وافل شوكولاتة بيضاء",
    "nameEn": "White Chocolate Waffle",
    "category": "عروض خاصة",
    "basePrice": 128.0,
    "description": "Large waffle with crispy and golden layers, topped with smooth and delicious white chocolate cream, perfect to enjoy anytime.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/وافل_شوكلاته_بيضاء639226681210444247.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 14
  },
  {
    "nameAr": "ميني بانكيك ميكس صوصات",
    "nameEn": "Mini Pancake Mix",
    "category": "عروض خاصة",
    "basePrice": 128.0,
    "description": "Mini pancakes, mixed chocolate spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميني_بانكيك_ميكس_2639226681760542323.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 15
  },
  {
    "nameAr": "ميني بانكيك لوتس",
    "nameEn": "Lotus Mini Pancake",
    "category": "عروض خاصة",
    "basePrice": 124.0,
    "description": "Mini pancakes, Lotus Biscoff spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميني_بانكيك_لوتس639226681983192380.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 17
  },
  {
    "nameAr": "ميني بانكيك كيندر",
    "nameEn": "Kinder Mini Pancake",
    "category": "عروض خاصة",
    "basePrice": 144.0,
    "description": "Mini pancakes, Kinder chocolate spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميني_بانكيك_كيندر639226682131272642.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 18
  },
  {
    "nameAr": "Mini شوكولاتة بيضاء Panكيكs",
    "nameEn": "Mini White Chocolate Pancakes",
    "category": "عروض خاصة",
    "basePrice": 128.0,
    "description": "Mini pancakes, white chocolate spread.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميني_بانكيك_شوكلاته_بيضاء639226682341317855.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 19
  },
  {
    "nameAr": "Plain Cheeseكيك",
    "nameEn": "Plain Cheesecake",
    "category": "عروض خاصة",
    "basePrice": 80.0,
    "description": "Biscuit, rich cream cheese.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/تشيز_كيك_ساده639226682874283076.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 20
  },
  {
    "nameAr": "تشيز كيك فراولة",
    "nameEn": "Strawberry Cheesecake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Biscuit, cream cheese, sauce strawberry.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/تشيز_كيك_فراوله639226682920568480.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 22
  },
  {
    "nameAr": "Mango ميلك شيك",
    "nameEn": "Mango Milkshake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Milk, vanilla ice cream, mango.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_مانجو639226682502102311.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 24
  },
  {
    "nameAr": "بلوبيري ميلك شيك",
    "nameEn": "Blueberry Milkshake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Milk, vanilla ice cream, blueberries.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_بلوبيري639226682536874399.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 25
  },
  {
    "nameAr": "فراولة ميلك شيك",
    "nameEn": "Strawberry Milkshake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Milk, vanilla ice cream, strawberries.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_فراوله639226682569333205.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 26
  },
  {
    "nameAr": "ميكس Berry ميلك شيك",
    "nameEn": "Mix Berry Milkshake",
    "category": "عروض خاصة",
    "basePrice": 110.4,
    "description": "Milk, vanilla ice cream, mix berries.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_مكس_بيري639226682610295137.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 27
  },
  {
    "nameAr": "لوتس ميلك شيك",
    "nameEn": "Lotus Milkshake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Milk, vanilla ice cream, lotus.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_لوتس639226682664126990.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 28
  },
  {
    "nameAr": "نوتيلا ميلك شيك",
    "nameEn": "Nutella Milkshake",
    "category": "عروض خاصة",
    "basePrice": 116.0,
    "description": "Milk, vanilla ice cream, Nutella.",
    "image": "https://talabat.dhmedia.io/image/talabat/MenuItems/ميلك_شيك_نوتيلا639226682695631016.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 29
  },
  {
    "nameAr": "بلوبيري سموزي",
    "nameEn": "Blueberry Smoothie",
    "category": "عروض خاصة",
    "basePrice": 80.0,
    "description": "Refreshing and delicious blueberry smoothie made from blended fresh blueberries.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/f689aec7-65fe-4fac-8a4c-d207cd23871c.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 31
  },
  {
    "nameAr": "سموزي ميكس Berry",
    "nameEn": "Smoothie Mix Berry",
    "category": "عروض خاصة",
    "basePrice": 88.0,
    "description": "Refreshing smoothie drink made with a delicious blend of fresh berries, strawberries, and wild grapes, served chilled and iced.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/ddefa062-a34a-4c71-ab76-fe2460ab295c.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 32
  },
  {
    "nameAr": "فراولة سموزي",
    "nameEn": "Strawberry Smoothie",
    "category": "عروض خاصة",
    "basePrice": 88.0,
    "description": "Enjoy a refreshing strawberry smoothie made from the finest fresh red strawberries blended with rich yogurt, offering you a rich, vitamin-packed frozen experience.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/8413d964-2f57-4833-8f51-9b2e745968a4.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 33
  },
  {
    "nameAr": "Mango سموزي",
    "nameEn": "Mango Smoothie",
    "category": "عروض خاصة",
    "basePrice": 88.0,
    "description": "Fresh mango smoothie prepared from the finest naturally ripe mango fruits  serve as a refreshing and chilled .",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/e9845a96-3148-416f-a627-1762cbed9bb7.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 34
  },
  {
    "nameAr": "ريد فيلفيت",
    "nameEn": "Red Velvet",
    "category": "عروض خاصة",
    "basePrice": 76.0,
    "description": "A luxurious Red Velvet cake featuring smooth layers of rich red cocoa and delicious cream cheese frosting, with an elegant finish that makes it the perfect choice for connoisseurs of fine desserts.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/6f43ab9d-3625-4bc5-bb8b-145747bdc86f.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 35
  },
  {
    "nameAr": "Honey كيك",
    "nameEn": "Honey Cake",
    "category": "عروض خاصة",
    "basePrice": 96.0,
    "description": "This premium honey cake is crafted using a traditional method, featuring smooth layers of natural honey and fresh butter that create a delicious, sweet flavor and a moist, tender texture that melts in the mouth.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/b8b11e83-0470-4322-b988-0cf0bc397d79.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 36
  },
  {
    "nameAr": "كيندر براونيز شوكولاتة",
    "nameEn": "Kinder Brownies Chocolate",
    "category": "عروض خاصة",
    "basePrice": 132.0,
    "description": "Kinder Browns with Luxury Chocolate With soft and delicious chocolate pieces It combines a rich taste with a delicate, creamy texture. Perfect as a luxurious dessert",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/73353dd2-3923-480e-bd48-9da6c27c47c7.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 37
  },
  {
    "nameAr": "براونيز شوكولاتة نوتيلا",
    "nameEn": "Nutella Brownies",
    "category": "عروض خاصة",
    "basePrice": 120.0,
    "description": "Delicious Nutella brownies Carefully prepared from the finest chocolate and hazelnut ingredients With a rich and smooth taste Melts in the mouth, served fresh and delicious",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/314d0227-d9e5-4e59-8ce1-cb6267367f4d.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 38
  },
  {
    "nameAr": "براونيز لوتس مقرمش",
    "nameEn": "Browns Lotus",
    "category": "عروض خاصة",
    "basePrice": 124.0,
    "description": "Lotus delicious Brownies, carefully prepared from the finest ingredients with a unique and rich Lotus flavor, presented beautifully and attractively for lovers of gourmet desserts.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/d00a6207-7712-4807-9d33-3bf194f4750b.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 39
  },
  {
    "nameAr": "براونيز شوكولاتة بيضاء",
    "nameEn": "Browns White Chocolate",
    "category": "عروض خاصة",
    "basePrice": 120.0,
    "description": "Browns are luxurious, smooth-textured white chocolates made from the finest types of white chocolate, with a rich, creamy, and deliciously sweet taste.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/0b794692-53da-4e1a-a468-c1f180e5b2da.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 40
  },
  {
    "nameAr": "ايس لاتيه",
    "nameEn": "Iced Latte",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "مشروب قهوة مثلج منعش يجمع بين قهوة الإسبريسو الغنية والحليب البارد الكريمي مع مكعبات الثلج لتقديم تجربة قهوة باردة لذيذة وسهلة الشرب",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/0a4e2239-74d8-417e-8ddb-6f4499a0b09c.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 41
  },
  {
    "nameAr": "كراميل",
    "nameEn": "Iced Caramel Coffee",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "قهوة مثلجة غنية بنكهة الكراميل الحلوة واللذيذة مع حليب",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/f34f8eca-a286-41d3-a0ce-2a7351f71b8e.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 42
  },
  {
    "nameAr": "فانيليا",
    "nameEn": "Iced Vanilla Coffee",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "قهوة مثلجة بنكهة الفانيليا الفاخرة مع حليب ناعم وكريمة غنية تقدم باردة منعشة",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/99701703-2cdc-4484-bb77-65a3d4b27b78.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 43
  },
  {
    "nameAr": "نوتيلا",
    "nameEn": "Nutella",
    "category": "عروض خاصة",
    "basePrice": 112.0,
    "description": "A rich iced coffee drink with the famous Nutella flavor, with soft milk and whipped cream for a delicious and smooth experience",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/74ef0544-8010-4fd6-bb35-24f878bc7132.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 44
  },
  {
    "nameAr": "كان كيك فانيليا ولوتس",
    "nameEn": "Vanilla Lotus Cake",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "A soft vanilla cake filled with the famous Lotus Cream and crunchy Lotus biscuits served with a rich taste and balanced sweetness",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/7e4d453e-99f1-4ff2-b635-e0e23c82b93f.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 45
  },
  {
    "nameAr": "كان كيك ريد فيلفيت كريم تشيز",
    "nameEn": "Red Velvet Cake Layers with Cream Cheese",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Soft layers of luxurious red velvet cake with carefully whipped fresh cream cheese. Harmonious layers that combine the light chocolate taste with the gentle acidity of cream cheese",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/0a968bb1-28bc-4561-88d1-166b24747c3e.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 46
  },
  {
    "nameAr": "كان كيك فانيليا وصوص فراولة",
    "nameEn": "Vanilla cake with layers of strawberry sauce",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Soft multi-layer vanilla cake with delicious fresh strawberry sauce and cream",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/1640064c-c9fa-4911-8a3a-2bfd41b605ba.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 47
  },
  {
    "nameAr": "كان كيك طبقات أوريو ونوتيلا",
    "nameEn": "Chocolate Cake With Layers of Orio and Nutella",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "Luxurious Chocolate Cake With Multiple Layers of Soft Orio Cream and Rich Nutella Filling for an Irresistible Chocolate Taste",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/de0bb666-a1ca-457d-b294-ce9177481c23.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 48
  },
  {
    "nameAr": "كان كيك كوكيز كريم وأوريو",
    "nameEn": "Chocolate cake with layers of cookie cream and Oreo",
    "category": "عروض خاصة",
    "basePrice": 104.0,
    "description": "A luxurious chocolate cake with multiple layers of soft cookie cream and crunchy Oreo, a rich and sweet taste that combines dark chocolate flavor with crunchy cookie pieces",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/daccd32d-43e4-45b1-9f2d-b416daeb68f5.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 49
  },
  {
    "nameAr": "Mineral Water",
    "nameEn": "Mineral Water",
    "category": "مشروبات",
    "basePrice": 20.0,
    "description": "Pure, natural mineral water rich in essential minerals and elements beneficial to the body's health. Refreshing and light in taste, ideal for daily drinking.",
    "image": "https://talabat.dhmedia.io/image/global-menu-service/HF_EG/vendor/1119323/product/b05d5bf3-b198-4a10-9476-2fa5601d26c6.jpg?width=172&amp;height=172",
    "isAvailable": true,
    "sortOrder": 78
  }
];

  await prisma.product.deleteMany({});
  for (const prod of productsData) {
    await prisma.product.create({
      data: prod
    });
  }
  console.log("✓ 44 Products created successfully!");

  // 7. Core Raw Materials for Inventory
  console.log("📦 Seeding Core Raw Materials (Ingredients)...");
  const defaultIngredients = [
    { name: "عجينة وافل طازجة", unit: "كيلو", quantity: 50, minStock: 10, costPerUnit: 45 },
    { name: "شوكولاتة نوتيلا أصلية", unit: "كيلو", quantity: 30, minStock: 5, costPerUnit: 220 },
    { name: "شوكولاتة بيضاء بلجيكي", unit: "كيلو", quantity: 25, minStock: 5, costPerUnit: 180 },
    { name: "زبدة لوتس سبريد", unit: "برطمان", quantity: 20, minStock: 4, costPerUnit: 160 },
    { name: "شوكولاتة كيندر بوينو", unit: "قطعة", quantity: 80, minStock: 15, costPerUnit: 35 },
    { name: "صوص بلوبيري سائل", unit: "كيلو", quantity: 15, minStock: 3, costPerUnit: 95 },
    { name: "صوص كراميل غني", unit: "كيلو", quantity: 15, minStock: 3, costPerUnit: 80 },
    { name: "بسكويت أوريو مكسر", unit: "علبة", quantity: 40, minStock: 8, costPerUnit: 50 },
    { name: "جبن كريمي للتشيز كيك", unit: "كيلو", quantity: 20, minStock: 5, costPerUnit: 140 },
    { name: "فراولة فريش", unit: "كيلو", quantity: 15, minStock: 4, costPerUnit: 40 },
    { name: "حليب طازج كامل الدسم", unit: "لتر", quantity: 60, minStock: 12, costPerUnit: 38 },
    { name: "بن إسبريسو بريميوم", unit: "كيلو", quantity: 10, minStock: 2, costPerUnit: 350 },
  ];
  await prisma.ingredient.deleteMany({});
  for (const ing of defaultIngredients) {
    await prisma.ingredient.create({ data: ing });
  }
  console.log("✓ Core Ingredients created successfully!");

  console.log("🎉 Database seeding completed with 100% SUCCESS!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
