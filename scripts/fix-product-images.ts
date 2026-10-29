import { prisma } from "../lib/prisma";

const PRODUCT_IMAGES: Record<string, string> = {
  // === وافل (Waffles) - Brown/golden crispy waffle photos ===
  "وافل شوكليت نوتيلا": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80&fit=crop",
  "وافل شوكليت وايت": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=600&q=80&fit=crop",
  "وافل كندر": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80&fit=crop",
  "وافل لوتس": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&q=80&fit=crop",
  "وافل ميكس صوصات": "https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=600&q=80&fit=crop",
  "وافل روشية": "https://images.unsplash.com/photo-1606313564200-e75d5e31af67?w=600&q=80&fit=crop",
  "وافل رافيلو": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop",
  "وافل بيستاشيو": "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=600&q=80&fit=crop",
  "وافل فور سيزون": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80&fit=crop",
  "وافل كريمي تشيز نوتيلا (NEW)": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80&fit=crop",
  "وافل كريمي تشيز فراولة (NEW)": "https://images.unsplash.com/photo-1533910534207-90f31029a78e?w=600&q=80&fit=crop",
  "وافل كريمي مالتيزرس (NEW)": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",

  // === بان كيك (Pancakes) - Fluffy stack pancake photos ===
  "بان كيك شوكليت نوتيلا": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",
  "بان كيك شوكليت وايت": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=80&fit=crop",
  "بان كيك كندر": "https://images.unsplash.com/photo-1548673277-c56b1ff2f80c?w=600&q=80&fit=crop",
  "بان كيك لوتس": "https://images.unsplash.com/photo-1592415486689-125cbbfcdfbc?w=600&q=80&fit=crop",
  "بان كيك بيستاشيو": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
  "بان كيك ميكس صوصات": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80&fit=crop",

  // === فتة (Fatta) - Waffle fatta bowl photos ===
  "فتة شوكليت نوتيلا": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80&fit=crop",
  "فتة شوكليت وايت": "https://images.unsplash.com/photo-1542124292-34efaa735516?w=600&q=80&fit=crop",
  "فتة كندر": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",
  "فتة لوتس بيسكوف": "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600&q=80&fit=crop",
  "فتة بيستاشيو ملكي": "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=600&q=80&fit=crop",
  "فتة ميكس صوصات": "https://images.unsplash.com/photo-1506084868230-bb9d2c3b5b77?w=600&q=80&fit=crop",

  // === طواجن (Molten Cakes) - Chocolate lava cake photos ===
  "طاجن شوكليت نوتيلا": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop",
  "طاجن كندر": "https://images.unsplash.com/photo-1606313564200-e75d5e31af67?w=600&q=80&fit=crop",
  "طاجن لوتس": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop",
  "طاجن بيستاشيو": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80&fit=crop",

  // === كاسات (Cups) ===
  "وافل هاوس كاب": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80&fit=crop",
  "كاس بان كيك (نوتيلا - وايت)": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",
  "كاس بيستاشيو كاب": "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=600&q=80&fit=crop",
  "كاس كب الملوك (NEW)": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&fit=crop",

  // === حواوشي وافل (Waffle Hawawshi) ===
  "ربع حواوشي وافل (محشي كنافة وبستاشيو)": "https://images.unsplash.com/photo-1519869325930-281384150729?w=600&q=80&fit=crop",
  "ربع حواوشي وافل نوتيلا (كنافة بستاشيو نوتيلا)": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80&fit=crop",
  "ربع حواوشي وافل مكسرات": "https://images.unsplash.com/photo-1548673277-c56b1ff2f80c?w=600&q=80&fit=crop",

  // === فريسكة ===
  "فريسكة وافل هاوس المقرمشة (شوكليت / أوريو / وايت / كندر / بيستاشيو)": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80&fit=crop",

  // === الموتشي ===
  "موتشي ياباني مثلج (فانيليا / شوكليت / مانجا / فراولة)": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80&fit=crop",
  "موتشي ميكس بيري وزبادي توت وبطيخ": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&fit=crop",

  // === دوناتس (Donuts) ===
  "دود فروت دوناتس (NEW)": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80&fit=crop",
  "دودو فروت كريمي تشيز نوتيلا (NEW)": "https://images.unsplash.com/photo-1527515637462-cff94aca23f4?w=600&q=80&fit=crop",
  "دوناتس كريمي تشيز فراولة (NEW)": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",
  "ميني دونتس (شوكليت / أوريو / لوتس / كندر)": "https://images.unsplash.com/photo-1530915534664-4ac6423a3c5e?w=600&q=80&fit=crop",

  // === ميلك شيك (Milkshake) ===
  "ميلك شيك وافل هاوس (فانيليا / شوكليت / مانجا / فراولة / كراميل / لوتس)": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80&fit=crop",
  "سبيشال ميلك شيك (أوريو كريم / لوتس / هوهوز / توينكز / براوني / بيستاشيو)": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&fit=crop",

  // === بوبا (Boba) ===
  "بوبا سموزي (مانجا / فراولة / ميكس بيري / خوخ / بطيخ)": "https://images.unsplash.com/photo-1558857563-b37fe-4b6dc3cf7b7e?w=600&q=80&fit=crop",
  "بوبا صودا (توت / باشون فروت / كريز / جيلي كولا)": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80&fit=crop",
  "بوبا ميلك شيك (فرابتشينو / فانيليا / شوكليت / لوتس / بلوبيري)": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80&fit=crop",

  // === سموزي وصودا (Smoothies & Soda) ===
  "سموزي طبيعي مثلج (ليمون نعناع / بطيخ / مانجا / فراولة / ميكس بيري / كيوي)": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80&fit=crop",
  "صودا منعشة (توت / كريز / أناناس / صن شاين / تفاح أخضر / باشون / بينا كولادا)": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop",

  // === كوكيز (Cookies) ===
  "كوكيز أورجينال": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80&fit=crop",
  "كوكيز نوتيلا": "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&q=80&fit=crop",
  "كوكيز نوتيلا آيس كريم ساندوتش": "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=80&fit=crop",
};

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const [nameAr, imageUrl] of Object.entries(PRODUCT_IMAGES)) {
    const result = await prisma.product.updateMany({
      where: { nameAr },
      data: { image: imageUrl },
    });
    if (result.count > 0) {
      console.log(`✅ Updated: ${nameAr}`);
      updated++;
    } else {
      console.log(`❌ Not found: ${nameAr}`);
      notFound++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
  await prisma.$disconnect();
}

main().catch(console.error);
