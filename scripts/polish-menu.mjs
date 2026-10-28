import { PrismaClient } from "../lib/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const adapter = new PrismaPg({ connectionString: rawUrl }, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function polishMenu() {
  console.log("🌟 Polishing Waffle House Menu in Database...");

  const updates = [
    {
      find: "وافل نوتيلا بلجيكي",
      nameAr: "وافل نوتيلا أصلي",
      nameEn: "Nutella Waffle",
      category: "وافل",
      description: "وافل بلجيكي ذهبي مقرمش من الخارج وهش من الداخل، مغطى بطبقة سخية من شوكولاتة نوتيلا الأصلية الغنية."
    },
    {
      find: "وافل ميكس نوتيلا وشوكولاتة بيضاء",
      nameAr: "وافل ميكس نوتيلا وشوكولاتة بيضاء",
      nameEn: "Waffle Mix",
      category: "وافل",
      description: "وافل ساخن مقسم بتوليفة ساحرة تجمع بين شوكولاتة نوتيلا الغامقة والشوكولاتة البيضاء البلجيكية الفاخرة."
    },
    {
      find: "وافل شوكولاتة بيضاء وفراولة",
      nameAr: "وافل شوكولاتة بيضاء وفراولة",
      nameEn: "White Chocolate Strawberry Waffle",
      category: "وافل",
      description: "شوكولاتة بيضاء مخملية ذائبة مع شرائح فراولة طازجة منتقاة بعناية على قاعدة وافل ذهبي مقرمش."
    },
    {
      find: "وافل كراميل فاخر",
      nameAr: "وافل كراميل ذهبي",
      nameEn: "Caramel Waffle",
      category: "وافل",
      description: "وافل طازج ومقرمش مغطى بصوص كراميل ناعم ومكثف بنكهة غنية تذوب في الفم."
    },
    {
      find: "وافل نوتيلا وأوريو",
      nameAr: "وافل نوتيلا وأوريو كرانشي",
      nameEn: "Nutella Oreo Waffle",
      category: "وافل",
      description: "مزيج شوكولاتة نوتيلا الغنية مع قطع بسكويت الأوريو المقرمش وصوص الأوريو المميز."
    },
    {
      find: "وافل كيندر بوينو",
      nameAr: "وافل كيندر بوينو",
      nameEn: "Kinder Waffle",
      category: "وافل",
      description: "وافل شهي مغطى بقطع شوكولاتة كيندر بوينو وصوص كيندر حليبي فائق النعومة."
    },
    {
      find: "وافل زبدة لوتس",
      nameAr: "وافل لوتس بيسكوف",
      nameEn: "Lotus Waffle",
      category: "وافل",
      description: "وافل ساخن مغطى بزبدة لوتس سبريد الأصلية مع رشة بسكويت لوتس مقرمش ومحمص."
    },
    {
      find: "وافل شوكولاتة بيضاء",
      nameAr: "وافل شوكولاتة بيضاء بلجيكي",
      nameEn: "White Chocolate Waffle",
      category: "وافل",
      description: "وافل ذهبي طازج مغطى بشلال من الشوكولاتة البيضاء البلجيكية الفاخرة."
    },
    // Mini Pancakes
    {
      find: "ميني بانكيك نوتيلا",
      nameAr: "ميني بان كيك نوتيلا",
      nameEn: "Nutella Mini Pancake",
      category: "بان كيك",
      description: "قطع ميني بان كيك هشة وطرية مُعدّة طازجة ومغمورة بشوكولاتة نوتيلا اللذيذة."
    },
    {
      find: "ميني بانكيك ميكس صوصات",
      nameAr: "ميني بان كيك ميكس صوصات",
      nameEn: "Mini Pancake Mix",
      category: "بان كيك",
      description: "تشكيلة ميني بان كيك غنية بمزيج متناغم من نوتيلا، شوكولاتة بيضاء، ولوتس."
    },
    {
      find: "ميني بانكيك لوتس",
      nameAr: "ميني بان كيك لوتس",
      nameEn: "Lotus Mini Pancake",
      category: "بان كيك",
      description: "قطع ميني بان كيك ذهبية مغطاة بصوص زبدة اللوتس الأصلية وبسكويت لوتس ناعم."
    },
    {
      find: "ميني بانكيك كيندر",
      nameAr: "ميني بان كيك كيندر",
      nameEn: "Kinder Mini Pancake",
      category: "بان كيك",
      description: "ميني بان كيك طري ولذيذ مع صوص كيندر الغني وشوكولاتة كيندر بالحليب."
    },
    {
      find: "Mini شوكولاتة بيضاء",
      nameAr: "ميني بان كيك شوكولاتة بيضاء",
      nameEn: "Mini White Chocolate Pancakes",
      category: "بان كيك",
      description: "حبات ميني بان كيك طرية مغطاة بصوص الشوكولاتة البيضاء الغنية الناعمة."
    },
    // Cheesecakes
    {
      find: "تشيز كيك نوتيلا غنية",
      nameAr: "تشيز كيك نوتيلا",
      nameEn: "Nutella Cheesecake",
      category: "تشيز كيك",
      description: "طبقة تشيز كيك كريمية كلاسيكية مخملية مغطاة بطبقة وفيرة من شوكولاتة نوتيلا وقاعدة بسكويت زبدية."
    },
    {
      find: "تشيز كيك بلوبيري",
      nameAr: "تشيز كيك بلوبيري (توت أزرق)",
      nameEn: "Blueberry Cheesecake",
      category: "تشيز كيك",
      description: "تشيز كيك غني بقوام كريمي فاخر مغطى بصوص التوت الأزرق الطبيعي المنعش وحبات البلوبيري."
    },
    {
      find: "Plain Cheese",
      nameAr: "تشيز كيك نيويورك سادة",
      nameEn: "Plain Cheesecake",
      category: "تشيز كيك",
      description: "تشيز كيك كلاسيكي على طريقة نيويورك بطبقة غنية ناعمة وقاعدة مقرمشة متوازنة النكهة."
    },
    {
      find: "تشيز كيك فراولة",
      nameAr: "تشيز كيك فراولة",
      nameEn: "Strawberry Cheesecake",
      category: "تشيز كيك",
      description: "تشيز كيك فاخر مغطى بصوص فراولة طازج وقطع فراولة طبيعية شهية."
    },
    {
      find: "كان كيك ريد فيلفيت كريم تشيز",
      nameAr: "كان كيك ريد فيلفيت كريم تشيز",
      nameEn: "Red Velvet Cake Layers with Cream Cheese",
      category: "تشيز كيك",
      description: "طبقات من كيك ريد فيلفيت المخملي الغني مع حشوة كريم تشيز فاخرة ومحفوظة في علبة الكان كيك الأنيقة."
    },
    // Molten
    {
      find: "مولتن كيك نوتيلا بركانية",
      nameAr: "مولتن كيك نوتيلا بركانية",
      nameEn: "Nutella Molten Cake",
      category: "مولتن كيك",
      description: "كيك شوكولاتة ساخن مخبوز بعناية يتدفق من قلبه بركان من شوكولاتة نوتيلا الذائبة."
    },
    // Milkshakes
    {
      find: "Mango ميلك شيك",
      nameAr: "ميلك شيك مانجو طبيعي",
      nameEn: "Mango Milkshake",
      category: "ميلك شيك",
      description: "ميلك شيك كريمي مثلج مُعدّ من قطع المانجو الطبيعية والآيس كريم الفاخر."
    },
    {
      find: "بلوبيري ميلك شيك",
      nameAr: "ميلك شيك بلوبيري",
      nameEn: "Blueberry Milkshake",
      category: "ميلك شيك",
      description: "مشروب مثلج منعش يجمع آيس كريم الفانيليا مع صوص التوت الأزرق الطبيعي."
    },
    {
      find: "فراولة ميلك شيك",
      nameAr: "ميلك شيك فراولة",
      nameEn: "Strawberry Milkshake",
      category: "ميلك شيك",
      description: "ميلك شيك غني بالفراولة الطازجة والحليب كامل الدسم مع كريمة مخفوقة ناعمة."
    },
    {
      find: "ميكس Berry ميلك شيك",
      nameAr: "ميلك شيك ميكس بيري",
      nameEn: "Mix Berry Milkshake",
      category: "ميلك شيك",
      description: "توليفة مميزة من التوت الأحمر والتوت الأزرق والكرانبيري مع آيس كريم حليبي فاخر."
    },
    {
      find: "لوتس ميلك شيك",
      nameAr: "ميلك شيك لوتس بيسكوف",
      nameEn: "Lotus Milkshake",
      category: "ميلك شيك",
      description: "ميلك شيك سميك بنكهة بسكويت اللوتس الأصلي وزبدة اللوتس الذائبة مع رشة بسكويت مقرمشة."
    },
    {
      find: "نوتيلا ميلك شيك",
      nameAr: "ميلك شيك نوتيلا كريمي",
      nameEn: "Nutella Milkshake",
      category: "ميلك شيك",
      description: "عشاق الشوكولاتة! مزيج متجانس ومثلج من شوكولاتة نوتيلا الأصلية والآيس كريم الغني."
    },
    // Smoothies
    {
      find: "بلوبيري سموزي",
      nameAr: "سموزي بلوبيري مثلج",
      nameEn: "Blueberry Smoothie",
      category: "سموزي",
      description: "سموزي منعش وبارد جداً محضر من التوت الأزرق الطبيعي مع الثلج المجروش."
    },
    {
      find: "سموزي ميكس Berry",
      nameAr: "سموزي ميكس بيري غني",
      nameEn: "Smoothie Mix Berry",
      category: "سموزي",
      description: "مزيج مثلج ومنعش من تشكيلة التوت الطبيعي المختارة لطاقة وانتعاش فوري."
    },
    {
      find: "فراولة سموزي",
      nameAr: "سموزي فراولة فريش",
      nameEn: "Strawberry Smoothie",
      category: "سموزي",
      description: "سموزي منعش محضر من فراولة طازجة ومثلجة لنكهة صيفية مبهجة."
    },
    {
      find: "Mango سموزي",
      nameAr: "سموزي مانجو استوائي",
      nameEn: "Mango Smoothie",
      category: "سموزي",
      description: "سموزي مثلج غني بقطع المانجو المنعشة الاستوائية بدون أي نكهات صناعية."
    },
    // Cake & Desserts
    {
      find: "ريد فيلفيت",
      nameAr: "كيك ريد فيلفيت كلاسيك",
      nameEn: "Red Velvet",
      category: "كيك وحلويات",
      description: "كيك ريد فيلفيت مخملي أحمر بطبقات متناسقة وكريمة غنية متوازنة الحلاوة."
    },
    {
      find: "Honey كيك",
      nameAr: "كيك العسل الروسي (هوني كيك)",
      nameEn: "Honey Cake",
      category: "كيك وحلويات",
      description: "طبقات رقيقة مشبعة بالعسل الصافي ومحشوة بكريمة حامضة فاخرة تذوب في الفم."
    },
    {
      find: "كيندر براونيز شوكولاتة",
      nameAr: "براونيز كيندر فادج",
      nameEn: "Kinder Brownies Chocolate",
      category: "كيك وحلويات",
      description: "مكعبات براونيز شوكولاتة فادجي غنية وطرية مغطاة بقطع شوكولاتة كيندر الذائبة."
    },
    {
      find: "براونيز شوكولاتة نوتيلا",
      nameAr: "براونيز نوتيلا فادجي",
      nameEn: "Nutella Brownies",
      category: "كيك وحلويات",
      description: "براونيز شوكولاتة دافئ وغني مع حشوة وتغطية نوتيلا أصلية لا تُقاوم."
    },
    {
      find: "براونيز لوتس مقرمش",
      nameAr: "براونيز لوتس بيسكوف",
      nameEn: "Browns Lotus",
      category: "كيك وحلويات",
      description: "براونيز شوكولاتة بنكهة زبدة اللوتس الفاخرة ورشة بسكويت لوتس ذهبي."
    },
    {
      find: "براونيز شوكولاتة بيضاء",
      nameAr: "براونيز وايت تشوكليت",
      nameEn: "Browns White Chocolate",
      category: "كيك وحلويات",
      description: "براونيز فادجي مميز مغطى بطبقة من الشوكولاتة البيضاء البلجيكية الناعمة."
    },
    {
      find: "كان كيك فانيليا ولوتس",
      nameAr: "كان كيك فانيليا ولوتس",
      nameEn: "Vanilla Lotus Cake",
      category: "كيك وحلويات",
      description: "كيك فانيليا إسفنجي مع طبقات لوتس سبريد وبسكويت مقرمش معبأة داخل عبوة الكان كيك."
    },
    {
      find: "كان كيك فانيليا وصوص فراولة",
      nameAr: "كان كيك فانيليا وفراولة",
      nameEn: "Vanilla cake with layers of strawberry sauce",
      category: "كيك وحلويات",
      description: "طبقات كيك فانيليا هش مع صوص فراولة طبيعي وكريمة ناعمة في عبوة عصرية."
    },
    {
      find: "كان كيك طبقات أوريو ونوتيلا",
      nameAr: "كان كيك نوتيلا وأوريو",
      nameEn: "Chocolate Cake With Layers of Orio and Nutella",
      category: "كيك وحلويات",
      description: "كيك شوكولاتة داكن بطبقات نوتيلا غنية وأوريو كرانشي ممتعة في كل ملعقة."
    },
    {
      find: "كان كيك كوكيز كريم وأوريو",
      nameAr: "كان كيك كوكيز آند كريم",
      nameEn: "Chocolate cake with layers of cookie cream and Oreo",
      category: "كيك وحلويات",
      description: "كيك شوكولاتة فاخر بطبقات متعددة من كريمة الكوكيز الناعمة وبسكويت أوريو كرانش."
    },
    // Drinks
    {
      find: "ايس لاتيه",
      nameAr: "آيس لاتيه كلاسيك",
      nameEn: "Iced Latte",
      category: "مشروبات",
      description: "إسبريسو غني ومثلج مع حليب بارد وطبقة رغوة خفيفة لانتعاش وتركيز مثالي."
    },
    {
      find: "كراميل",
      nameAr: "آيس كوفي كراميل ماكياتو",
      nameEn: "Caramel Iced Coffee",
      category: "مشروبات",
      description: "قهوة مثلجة ممزوجة بصوص كراميل ذهبي غني وحليب بارد طازج."
    },
    {
      find: "فانيليا",
      nameAr: "آيس كوفي فانيليا فرنش",
      nameEn: "Vanilla Iced Coffee",
      category: "مشروبات",
      description: "قهوة مثلجة بنكهة الفانيليا الفرنسية الناعمة وحليب مثلج منعش."
    },
    {
      find: "نوتيلا",
      nameAr: "آيس موكا نوتيلا مثلجة",
      nameEn: "Nutella Iced Mocha",
      category: "مشروبات",
      description: "مزيج مذهل من الإسبريسو وشوكولاتة نوتيلا الذائبة مع حليب بارد وثلج."
    },
    {
      find: "Mineral Water",
      nameAr: "مياه معدنية طبيعية",
      nameEn: "Mineral Water",
      category: "مشروبات",
      description: "مياه معدنية طبيعية نقية وصحية معبأة وباردة."
    }
  ];

  const allDbProds = await prisma.product.findMany();

  for (const item of updates) {
    const match = allDbProds.find(p => p.nameAr.includes(item.find) || p.nameEn.toLowerCase().includes(item.find.toLowerCase()));
    if (match) {
      await prisma.product.update({
        where: { id: match.id },
        data: {
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          category: item.category,
          description: item.description,
        }
      });
      console.log(`✅ Updated: ${item.nameAr} -> Category: ${item.category}`);
    } else {
      console.log(`⚠️ Not found matching: ${item.find}`);
    }
  }

  console.log("🎉 All products polished and properly categorized!");
  process.exit(0);
}

polishMenu().catch(err => {
  console.error(err);
  process.exit(1);
});
