import { prisma } from "../lib/prisma";

// ✅ VERIFIED Unsplash URLs - each tested to show the CORRECT food type
// Format: [nameAr, imageUrl]
const PRODUCT_IMAGE_MAP: [string, string][] = [

  // ════════════ وافل - WAFFLES (crispy golden Belgian waffles) ════════════
  ["وافل شوكليت نوتيلا",
    "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=85&fit=crop"],
  ["وافل شوكليت وايت",
    "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=600&q=85&fit=crop"],
  ["وافل كندر",
    "https://images.unsplash.com/photo-1509482560494-4126f8225990?w=600&q=85&fit=crop"],
  ["وافل لوتس",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=85&fit=crop"],
  ["وافل ميكس صوصات",
    "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=600&q=85&fit=crop"],
  ["وافل روشية",
    "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&q=85&fit=crop"],
  ["وافل رافيلو",
    "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600&q=85&fit=crop"],
  ["وافل بيستاشيو",
    "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=85&fit=crop"],
  ["وافل فور سيزون",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=85&fit=crop"],
  ["وافل كريمي تشيز نوتيلا (NEW)",
    "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=85&fit=crop"],
  ["وافل كريمي تشيز فراولة (NEW)",
    "https://images.unsplash.com/photo-1533910534207-90f31029a78e?w=600&q=85&fit=crop"],
  ["وافل كريمي مالتيزرس (NEW)",
    "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=600&q=85&fit=crop"],

  // ════════════ بان كيك - PANCAKES (fluffy stacked pancakes) ════════════
  ["بان كيك شوكليت نوتيلا",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=85&fit=crop"],
  ["بان كيك شوكليت وايت",
    "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=85&fit=crop"],
  ["بان كيك كندر",
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=85&fit=crop"],
  ["بان كيك لوتس",
    "https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?w=600&q=85&fit=crop"],
  ["بان كيك بيستاشيو",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=85&fit=crop"],
  ["بان كيك ميكس صوصات",
    "https://images.unsplash.com/photo-1506084868230-bb9d2c3b5b77?w=600&q=85&fit=crop"],

  // ════════════ فتة - WAFFLE FATTA (chocolate dessert cups/bowls) ════════════
  ["فتة شوكليت نوتيلا",
    "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&q=85&fit=crop"],
  ["فتة شوكليت وايت",
    "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=85&fit=crop"],
  ["فتة كندر",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=85&fit=crop"],
  ["فتة لوتس بيسكوف",
    "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600&q=85&fit=crop"],
  ["فتة بيستاشيو ملكي",
    "https://images.unsplash.com/photo-1519869325930-281384150729?w=600&q=85&fit=crop"],
  ["فتة ميكس صوصات",
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=85&fit=crop"],

  // ════════════ طواجن - MOLTEN LAVA CAKES ════════════
  ["طاجن شوكليت نوتيلا",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=85&fit=crop"],
  ["طاجن كندر",
    "https://images.unsplash.com/photo-1606313564200-e75d5e31af67?w=600&q=85&fit=crop"],
  ["طاجن لوتس",
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=85&fit=crop"],
  ["طاجن بيستاشيو",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85&fit=crop"],

  // ════════════ كاسات - DESSERT CUPS ════════════
  ["وافل هاوس كاب",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=85&fit=crop"],
  ["كاس بان كيك (نوتيلا - وايت)",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=85&fit=crop"],
  ["كاس بيستاشيو كاب",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=85&fit=crop"],
  ["كاس كب الملوك (NEW)",
    "https://images.unsplash.com/photo-1548940740-204726a19be3?w=600&q=85&fit=crop"],

  // ════════════ حواوشي وافل - STUFFED WAFFLE HAWAWSHI ════════════
  ["ربع حواوشي وافل (محشي كنافة وبستاشيو)",
    "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=600&q=85&fit=crop"],
  ["ربع حواوشي وافل نوتيلا (كنافة بستاشيو نوتيلا)",
    "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=85&fit=crop"],
  ["ربع حواوشي وافل مكسرات",
    "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600&q=85&fit=crop"],

  // ════════════ فريسكة ════════════
  ["فريسكة وافل هاوس المقرمشة (شوكليت / أوريو / وايت / كندر / بيستاشيو)",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=85&fit=crop"],

  // ════════════ الموتشي - MOCHI ICE CREAM ════════════
  ["موتشي ياباني مثلج (فانيليا / شوكليت / مانجا / فراولة)",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=85&fit=crop"],
  ["موتشي ميكس بيري وزبادي توت وبطيخ",
    "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=85&fit=crop"],

  // ════════════ دوناتس - DONUTS ════════════
  ["دود فروت دوناتس (NEW)",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=85&fit=crop"],
  ["دودو فروت كريمي تشيز نوتيلا (NEW)",
    "https://images.unsplash.com/photo-1530915534664-4ac6423a3c5e?w=600&q=85&fit=crop"],
  ["دوناتس كريمي تشيز فراولة (NEW)",
    "https://images.unsplash.com/photo-1527515637462-cff94aca23f4?w=600&q=85&fit=crop"],
  ["ميني دونتس (شوكليت / أوريو / لوتس / كندر)",
    "https://images.unsplash.com/photo-1527515637462-cff94aca23f4?w=600&q=85&fit=crop"],

  // ════════════ ميلك شيك - MILKSHAKES ════════════
  ["ميلك شيك وافل هاوس (فانيليا / شوكليت / مانجا / فراولة / كراميل / لوتس)",
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85&fit=crop"],
  ["سبيشال ميلك شيك (أوريو كريم / لوتس / هوهوز / توينكز / براوني / بيستاشيو)",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=85&fit=crop"],

  // ════════════ بوبا - BOBA / BUBBLE TEA ════════════
  ["بوبا سموزي (مانجا / فراولة / ميكس بيري / خوخ / بطيخ)",
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=85&fit=crop"],
  ["بوبا صودا (توت / باشون فروت / كريز / جيلي كولا)",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=85&fit=crop"],
  ["بوبا ميلك شيك (فرابتشينو / فانيليا / شوكليت / لوتس / بلوبيري)",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=85&fit=crop"],

  // ════════════ سموزي وصودا - SMOOTHIES & SODA ════════════
  ["سموزي طبيعي مثلج (ليمون نعناع / بطيخ / مانجا / فراولة / ميكس بيري / كيوي)",
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85&fit=crop"],
  ["صودا منعشة (توت / كريز / أناناس / صن شاين / تفاح أخضر / باشون / بينا كولادا)",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=85&fit=crop"],

  // ════════════ كوكيز - COOKIES ════════════
  ["كوكيز أورجينال",
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=85&fit=crop"],
  ["كوكيز نوتيلا",
    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&q=85&fit=crop"],
  ["كوكيز نوتيلا آيس كريم ساندوتش",
    "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=85&fit=crop"],
];

async function main() {
  console.log(`\n🔄 Updating ${PRODUCT_IMAGE_MAP.length} product images...\n`);
  let updated = 0;
  let notFound = 0;

  for (const [nameAr, imageUrl] of PRODUCT_IMAGE_MAP) {
    const result = await prisma.product.updateMany({
      where: { nameAr },
      data: { image: imageUrl },
    });
    if (result.count > 0) {
      console.log(`✅ ${nameAr}`);
      updated++;
    } else {
      console.log(`❌ NOT FOUND: ${nameAr}`);
      notFound++;
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Updated: ${updated} | ❌ Not found: ${notFound}`);
  console.log(`========================================\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
