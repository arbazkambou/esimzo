import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Region definitions ──────────────────────────────────────────

const SUPABASE_ASSETS = "https://wsacvimipplrlvoyawam.supabase.co/storage/v1/object/public/assets";

const REGIONS = [
  { code: "AF", name: "Africa", flag: `${SUPABASE_ASSETS}/africa.svg` },
  { code: "AS", name: "Asia", flag: `${SUPABASE_ASSETS}/asia.svg` },
  { code: "BK", name: "Balkans", flag: `${SUPABASE_ASSETS}/balkans.svg` },
  { code: "CB", name: "Caribbean", flag: `${SUPABASE_ASSETS}/caribbean.svg` },
  { code: "EU", name: "Europe", flag: `${SUPABASE_ASSETS}/europe.svg` },
  { code: "GC", name: "GCC Middle East", flag: `${SUPABASE_ASSETS}/gcc-middle-east.svg` },
  { code: "LA", name: "Latin America", flag: `${SUPABASE_ASSETS}/latin-america.svg` },
  { code: "ME", name: "Middle East", flag: `${SUPABASE_ASSETS}/middle-east.svg` },
  { code: "NA", name: "North America", flag: `${SUPABASE_ASSETS}/north-america.svg` },
  { code: "OC", name: "Oceania", flag: `${SUPABASE_ASSETS}/oceania.svg` },
  { code: "SA", name: "South America", flag: `${SUPABASE_ASSETS}/south-america.svg` },
];

// ─── Country → Region mapping (ISO alpha-2 → region code) ───────

const COUNTRY_TO_REGION: Record<string, string> = {
  // ── Africa ──
  AO: "AF", BF: "AF", BI: "AF", BJ: "AF", BW: "AF", CD: "AF", CF: "AF",
  CG: "AF", CI: "AF", CM: "AF", CV: "AF", DJ: "AF", DZ: "AF", EG: "AF",
  EH: "AF", ER: "AF", ET: "AF", GA: "AF", GH: "AF", GM: "AF", GN: "AF",
  GQ: "AF", GW: "AF", KE: "AF", KM: "AF", LR: "AF", LS: "AF", LY: "AF",
  MA: "AF", MG: "AF", ML: "AF", MR: "AF", MU: "AF", MW: "AF", MZ: "AF",
  NE: "AF", NG: "AF", RE: "AF", RW: "AF", SC: "AF", SD: "AF",
  SL: "AF", SN: "AF", SO: "AF", SS: "AF", ST: "AF", SZ: "AF", TD: "AF",
  TG: "AF", TN: "AF", TZ: "AF", UG: "AF", YT: "AF", ZA: "AF", ZM: "AF",
  ZW: "AF",

  // ── Asia ──
  AF: "AS", BD: "AS", BN: "AS", BT: "AS", CN: "AS", HK: "AS", ID: "AS",
  IN: "AS", IO: "AS", JP: "AS", KG: "AS", KH: "AS", KP: "AS", KR: "AS",
  KZ: "AS", LA: "AS", LK: "AS", MM: "AS", MN: "AS", MO: "AS", MV: "AS",
  MY: "AS", NP: "AS", PH: "AS", PK: "AS", SG: "AS", TH: "AS", TJ: "AS",
  TL: "AS", TM: "AS", TW: "AS", UZ: "AS", VN: "AS",

  // ── Balkans ──
  AL: "BK", BA: "BK", BG: "BK", HR: "BK", ME: "BK", MK: "BK", RO: "BK",
  RS: "BK", SI: "BK", XK: "BK", GR: "BK",

  // ── Caribbean ──
  AG: "CB", AI: "CB", AW: "CB", BB: "CB", BL: "CB", BQ: "CB", BS: "CB",
  CU: "CB", CW: "CB", DM: "CB", DO: "CB", GD: "CB", GP: "CB", HT: "CB",
  JM: "CB", KN: "CB", KY: "CB", LC: "CB", MF: "CB", MQ: "CB", MS: "CB",
  PR: "CB", SX: "CB", TC: "CB", TT: "CB", VC: "CB", VG: "CB", VI: "CB",

  // ── Europe ──
  AD: "EU", AT: "EU", AX: "EU", BE: "EU", BY: "EU", CH: "EU", CY: "EU",
  CZ: "EU", DE: "EU", DK: "EU", EE: "EU", ES: "EU", FI: "EU", FO: "EU",
  FR: "EU", GB: "EU", GG: "EU", GI: "EU", HU: "EU", IE: "EU", IM: "EU",
  IS: "EU", IT: "EU", JE: "EU", LI: "EU", LT: "EU", LU: "EU", LV: "EU",
  MC: "EU", MD: "EU", MT: "EU", NL: "EU", NO: "EU", PL: "EU", PT: "EU",
  RU: "EU", SE: "EU", SJ: "EU", SK: "EU", SM: "EU", UA: "EU", VA: "EU",

  // ── GCC Middle East ──
  AE: "GC", BH: "GC", KW: "GC", OM: "GC", QA: "GC", SA: "GC",

  // ── Latin America ──
  BZ: "LA", CR: "LA", GT: "LA", HN: "LA", MX: "LA", NI: "LA", PA: "LA",
  SV: "LA",

  // ── Middle East ──
  AM: "ME", AZ: "ME", GE: "ME", IL: "ME", IQ: "ME", IR: "ME", JO: "ME",
  LB: "ME", PS: "ME", SY: "ME", TR: "ME", YE: "ME",

  // ── North America ──
  BM: "NA", CA: "NA", GL: "NA", PM: "NA", US: "NA",

  // ── Oceania ──
  AU: "OC", CC: "OC", CK: "OC", CX: "OC", FJ: "OC", FM: "OC",
  GU: "OC", KI: "OC", MH: "OC", MP: "OC", NC: "OC", NF: "OC", NR: "OC",
  NU: "OC", NZ: "OC", PF: "OC", PG: "OC", PN: "OC", PW: "OC", SB: "OC",
  TK: "OC", TO: "OC", TV: "OC", UM: "OC", VU: "OC", WF: "OC", WS: "OC",

  // ── South America ──
  AR: "SA", BO: "SA", BR: "SA", CL: "SA", CO: "SA", EC: "SA", FK: "SA",
  GF: "SA", GY: "SA", PE: "SA", PY: "SA", SR: "SA", UY: "SA", VE: "SA",
};

// ─── Non-country codes to skip ───────────────────────────────────

const SKIP_CODES = new Set(["eu", "un"]);

// ─── Popular Countries mapping (Code -> Score) ───────────────────

const POPULAR_COUNTRIES: Record<string, number> = {
  US: 100, // United States
  GB: 99,  // United Kingdom
  TR: 98,  // Turkey
  JP: 97,  // Japan
  CH: 96,  // Switzerland
  IT: 95,  // Italy
  FR: 94,  // France
  ES: 93,  // Spain
  DE: 92,  // Germany
  TH: 91,  // Thailand
  AE: 90,  // United Arab Emirates
  SG: 89,  // Singapore
  CA: 88,  // Canada
  MX: 87,  // Mexico
  AU: 86,  // Australia
  KR: 85,  // South Korea
  VN: 84,  // Vietnam
  ID: 83,  // Indonesia
  CN: 82,  // China
  IN: 81,  // India
};

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter } as any);

  // ── 1. Seed regions ──
  console.log("🌍 Seeding regions...");
  const regionIdMap: Record<string, string> = {};

  for (const r of REGIONS) {
    const region = await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, flag: r.flag, slug: slugify(r.name) },
      create: { name: r.name, slug: slugify(r.name), code: r.code, flag: r.flag },
    });
    regionIdMap[r.code] = region.id;
  }
  console.log(`✅ ${REGIONS.length} regions seeded.`);

  // ── 2. Seed countries ──
  console.log("⏳ Fetching country list from flagcdn...");
  const res = await fetch("https://flagcdn.com/en/codes.json");
  if (!res.ok) throw new Error(`flagcdn responded with ${res.status}`);

  const codes: Record<string, string> = await res.json();
  const entries = Object.entries(codes).filter(
    ([code]) => code.length === 2 && !SKIP_CODES.has(code)
  );

  console.log(`📦 Seeding ${entries.length} countries...`);

  let created = 0;
  let skipped = 0;

  for (const [code, name] of entries) {
    const upperCode = code.toUpperCase();
    const flag = `https://flagcdn.com/${code}.svg`;
    const slug = slugify(name);
    const regionCode = COUNTRY_TO_REGION[upperCode];
    const regionId = regionCode ? regionIdMap[regionCode] : undefined;
    const popularity = POPULAR_COUNTRIES[upperCode] || 0;

    try {
      await prisma.country.upsert({
        where: { code: upperCode },
        update: { name, slug, flag, popularity, regionId: regionId ?? null },
        create: { name, slug, code: upperCode, flag, popularity, regionId: regionId ?? null },
      });
      created++;
    } catch (err) {
      console.warn(`⚠️  Skipped ${upperCode} (${name}): ${err}`);
      skipped++;
    }
  }

  console.log(`✅ Done! ${created} countries seeded, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
