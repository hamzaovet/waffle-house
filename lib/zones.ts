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
  { code: "CAI-01", nameAr: "التجمع الخامس - القاهرة الجديدة", nameEn: "New Cairo - 5th Settlement", fee: 45.0, timeMinutes: 40 },
  { code: "CAI-02", nameAr: "التجمع الأول والرحاب", nameEn: "1st Settlement & El Rehab", fee: 50.0, timeMinutes: 45 },
  { code: "CAI-03", nameAr: "مدينتي والشروق وبدر", nameEn: "Madinaty & El Shorouk", fee: 65.0, timeMinutes: 55 },
  { code: "CAI-04", nameAr: "مدينة نصر - رابعة وعباس والحي السابع", nameEn: "Nasr City", fee: 35.0, timeMinutes: 35 },
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

export const ALL_DELIVERY_ZONES: ZoneItem[] = CAIRO_DELIVERY_ZONES;

export const DEFAULT_ZONE: ZoneItem = ALL_DELIVERY_ZONES[0]; // التجمع الخامس 45 ج.م

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
      code: "CUSTOM",
      nameAr: nameOrCode,
      nameEn: nameOrCode,
      fee: 40,
      timeMinutes: 45,
    }
  );
}
