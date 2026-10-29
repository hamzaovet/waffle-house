export interface ZoneItem {
  id?: string;
  code?: string;
  nameEn: string;
  nameAr: string;
  fee: number;
  timeMinutes: number;
  isActive?: boolean;
}

export const CAIRO_DELIVERY_ZONES: ZoneItem[] = [
  { code: "CAI-01", nameAr: "حدائق القبة (المنطقة المحيطة بالفرع)", nameEn: "Hadaeq Al Qubbah (Branch Area)", fee: 15.0, timeMinutes: 20 },
  { code: "CAI-02", nameAr: "سراي القبة وحمامات القبة والزيتون", nameEn: "Saray Al Qubbah & El Zeitoun", fee: 20.0, timeMinutes: 25 },
  { code: "CAI-03", nameAr: "العباسية والوايلي والدمرداش", nameEn: "Abbaseya, Wayli & Demerdash", fee: 20.0, timeMinutes: 25 },
  { code: "CAI-04", nameAr: "مصر الجديدة وروكسي والكوربة", nameEn: "Heliopolis, Roxy & Korba", fee: 25.0, timeMinutes: 30 },
  { code: "CAI-05", nameAr: "شبرا والساحل وروض الفرج", nameEn: "Shoubra & El Sahel", fee: 25.0, timeMinutes: 30 },
  { code: "CAI-06", nameAr: "حلمية الزيتون وعين شمس الغربية", nameEn: "Helmeyat El Zeitoun & Ain Shams", fee: 25.0, timeMinutes: 30 },
  { code: "CAI-07", nameAr: "المطرية والأميرية والسواح", nameEn: "Matareya & Amiriya", fee: 20.0, timeMinutes: 25 },
  { code: "CAI-08", nameAr: "مدينة نصر - رابعة وعباس ومكرم", nameEn: "Nasr City (Rabaa & Abbas)", fee: 35.0, timeMinutes: 35 },
  { code: "CAI-09", nameAr: "مساكن شيراتون والنزهة الجديدة", nameEn: "Sheraton & New Nozha", fee: 35.0, timeMinutes: 35 },
  { code: "CAI-10", nameAr: "وسط البلد والتحرير وباب اللوق", nameEn: "Downtown Cairo & Tahrir", fee: 30.0, timeMinutes: 35 },
  { code: "CAI-11", nameAr: "الزمالك وجاردن سيتي", nameEn: "Zamalek & Garden City", fee: 35.0, timeMinutes: 40 },
  { code: "CAI-12", nameAr: "المهندسين والدقي والعجوزة", nameEn: "Mohandessin, Dokki & Agouza", fee: 35.0, timeMinutes: 40 },
  { code: "CAI-13", nameAr: "المعادي ودجلة", nameEn: "Maadi & Degla", fee: 45.0, timeMinutes: 45 },
  { code: "CAI-14", nameAr: "المقطم والهضبة الوسطى", nameEn: "Mokattam", fee: 40.0, timeMinutes: 40 },
  { code: "CAI-15", nameAr: "التجمع الخامس والقاهرة الجديدة", nameEn: "New Cairo - 5th Settlement", fee: 45.0, timeMinutes: 45 },
  { code: "CAI-16", nameAr: "الرحاب والتجمع الأول", nameEn: "El Rehab & 1st Settlement", fee: 50.0, timeMinutes: 50 },
  { code: "CAI-17", nameAr: "مدينتي والشروق", nameEn: "Madinaty & El Shorouk", fee: 65.0, timeMinutes: 55 },
];

export const ALL_DELIVERY_ZONES: ZoneItem[] = CAIRO_DELIVERY_ZONES;

export const DEFAULT_ZONE: ZoneItem = ALL_DELIVERY_ZONES[0]; // حدائق القبة 15 ج.م

export function findZone(nameOrCode?: string): ZoneItem {
  if (!nameOrCode) return DEFAULT_ZONE;
  const clean = nameOrCode.trim().toLowerCase();
  const match = ALL_DELIVERY_ZONES.find(
    (z) =>
      (z.code && z.code.toLowerCase() === clean) ||
      z.nameAr.toLowerCase().includes(clean) ||
      z.nameEn.toLowerCase().includes(clean) ||
      clean.includes(z.nameAr.toLowerCase()) ||
      clean.includes(z.nameEn.toLowerCase())
  );
  return (
    match || {
      nameAr: nameOrCode,
      nameEn: nameOrCode,
      fee: 20.0,
      timeMinutes: 30,
    }
  );
}
