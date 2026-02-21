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

const REGIONS = [
  { code: "AF", name: "Africa", flag: "🌍" },
  { code: "AN", name: "Antarctica", flag: "🌏" },
  { code: "AS", name: "Asia", flag: "🌏" },
  { code: "EU", name: "Europe", flag: "🌍" },
  { code: "NA", name: "North America", flag: "🌎" },
  { code: "OC", name: "Oceania", flag: "🌏" },
  { code: "SA", name: "South America", flag: "🌎" },
];

// ─── Country → Region mapping (ISO alpha-2 → region code) ───────

const COUNTRY_TO_REGION: Record<string, string> = {
  // ── Africa ──
  AO: "AF", BF: "AF", BI: "AF", BJ: "AF", BW: "AF", CD: "AF", CF: "AF",
  CG: "AF", CI: "AF", CM: "AF", CV: "AF", DJ: "AF", DZ: "AF", EG: "AF",
  EH: "AF", ER: "AF", ET: "AF", GA: "AF", GH: "AF", GM: "AF", GN: "AF",
  GQ: "AF", GW: "AF", KE: "AF", KM: "AF", LR: "AF", LS: "AF", LY: "AF",
  MA: "AF", MG: "AF", ML: "AF", MR: "AF", MU: "AF", MW: "AF", MZ: "AF",
  NA: "AF", NE: "AF", NG: "AF", RE: "AF", RW: "AF", SC: "AF", SD: "AF",
  SL: "AF", SN: "AF", SO: "AF", SS: "AF", ST: "AF", SZ: "AF", TD: "AF",
  TG: "AF", TN: "AF", TZ: "AF", UG: "AF", YT: "AF", ZA: "AF", ZM: "AF",
  ZW: "AF",

  // ── Antarctica ──
  AQ: "AN", BV: "AN", GS: "AN", HM: "AN", TF: "AN",

  // ── Asia ──
  AE: "AS", AF: "AS", AM: "AS", AZ: "AS", BD: "AS", BH: "AS", BN: "AS",
  BT: "AS", CN: "AS", GE: "AS", HK: "AS", ID: "AS", IL: "AS", IN: "AS",
  IO: "AS", IQ: "AS", IR: "AS", JO: "AS", JP: "AS", KG: "AS", KH: "AS",
  KP: "AS", KR: "AS", KW: "AS", KZ: "AS", LA: "AS", LB: "AS", LK: "AS",
  MM: "AS", MN: "AS", MO: "AS", MV: "AS", MY: "AS", NP: "AS", OM: "AS",
  PH: "AS", PK: "AS", PS: "AS", QA: "AS", SA: "AS", SG: "AS", SY: "AS",
  TH: "AS", TJ: "AS", TL: "AS", TM: "AS", TR: "AS", TW: "AS", UZ: "AS",
  VN: "AS", YE: "AS",

  // ── Europe ──
  AD: "EU", AL: "EU", AT: "EU", AX: "EU", BA: "EU", BE: "EU", BG: "EU",
  BY: "EU", CH: "EU", CY: "EU", CZ: "EU", DE: "EU", DK: "EU", EE: "EU",
  ES: "EU", FI: "EU", FO: "EU", FR: "EU", GB: "EU", GG: "EU", GI: "EU",
  GR: "EU", HR: "EU", HU: "EU", IE: "EU", IM: "EU", IS: "EU", IT: "EU",
  JE: "EU", LI: "EU", LT: "EU", LU: "EU", LV: "EU", MC: "EU", MD: "EU",
  ME: "EU", MK: "EU", MT: "EU", NL: "EU", NO: "EU", PL: "EU", PT: "EU",
  RO: "EU", RS: "EU", RU: "EU", SE: "EU", SI: "EU", SJ: "EU", SK: "EU",
  SM: "EU", UA: "EU", VA: "EU", XK: "EU",

  // ── North America ──
  AG: "NA", AI: "NA", AW: "NA", BB: "NA", BL: "NA", BM: "NA", BQ: "NA",
  BS: "NA", BZ: "NA", CA: "NA", CR: "NA", CU: "NA", CW: "NA", DM: "NA",
  DO: "NA", GD: "NA", GL: "NA", GP: "NA", GT: "NA", HN: "NA", HT: "NA",
  JM: "NA", KN: "NA", KY: "NA", LC: "NA", MF: "NA", MQ: "NA", MS: "NA",
  MX: "NA", NI: "NA", PA: "NA", PM: "NA", PR: "NA", SV: "NA", SX: "NA",
  TC: "NA", TT: "NA", US: "NA", VC: "NA", VG: "NA", VI: "NA",

  // ── Oceania ──
  AS: "OC", AU: "OC", CC: "OC", CK: "OC", CX: "OC", FJ: "OC", FM: "OC",
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
