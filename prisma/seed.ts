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

// ─── Non-country codes to skip ───────────────────────────────────

const SKIP_CODES = new Set(["eu", "un"]);

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter } as any);

  console.log("⏳ Fetching country list from flagcdn...");

  const res = await fetch("https://flagcdn.com/en/codes.json");
  if (!res.ok) throw new Error(`flagcdn responded with ${res.status}`);

  const codes: Record<string, string> = await res.json();

  // Filter: only 2-letter ISO codes, skip non-countries
  const entries = Object.entries(codes).filter(
    ([code]) => code.length === 2 && !SKIP_CODES.has(code)
  );

  console.log(`📦 Seeding ${entries.length} countries...`);

  let created = 0;
  let skipped = 0;

  for (const [code, name] of entries) {
    const upperCode = code.toUpperCase();
    const flag = `https://flagcdn.com/w320/${code}.png`;
    const slug = slugify(name);

    try {
      await prisma.country.upsert({
        where: { code: upperCode },
        update: { name, slug, flag },
        create: { name, slug, code: upperCode, flag },
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
