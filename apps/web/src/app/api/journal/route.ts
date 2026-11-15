import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateTreeStats } from "@/lib/treeProgress";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DBJournalRow {
  id: string;
  childId: string;
  title: string | null;
  content: string | null;
  mood: number | null;
  privacy: "PRIVATE" | "CARE_CIRCLE" | "PUBLIC";
  activityType: string | null;
  tags: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
}

// Fallback cultural insights
function getFallbackInsight(culture: string, mood: number) {
  const isAceh = culture === "aceh";
  const isLowMood = mood <= 2;

  let empathy = "";
  if (isLowMood) {
    empathy = isAceh
      ? "Perasaan sedih dan cemas yang kamu rasakan adalah reaksi yang sepenuhnya wajar setelah menghadapi musibah. Di posko ini, semangat 'Meuseuraya' merangkulmu agar kamu tidak pernah merasa sendirian. Langkah kecilmu menulis hari ini adalah wujud keberanian yang luar biasa."
      : "Rasa duka dan gundah adalah bagian dari proses pemulihan. Mengingat falsafah 'Mambangkik Batang Tarandam', dari dalam lumpur duka inilah tunas ketangguhan baru akan tumbuh kembali perlahan bersama kasih orang-orang terdekat.";
  } else {
    empathy = isAceh
      ? "Kamu telah berhasil melangkah melewati hari yang penuh tantangan. Perasaan tenang dan syukur yang kamu miliki saat berada di posko bersama adik dan teman adalah bibit ketangguhan yang sangat berharga. Kekhawatiran pada suara keras pascabencana adalah hal yang sepenuhnya wajar dialami oleh pejuang kecil sepertimu."
      : "Keteguhan hatimu untuk tetap melihat sisi baik dan bersyukur adalah perwujudan nyata dari 'Mambangkik Batang Tarandam'. Daya lentur jiwamu menginspirasi teman-teman di sekitar posko untuk terus bangkit bersama.";
  }

  const proverb = isAceh
    ? "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”"
    : "“Dima bumi dipijak, di sinan langik dijunjuang; Mambangkik batang tarandam, bangkik marwah kito basamo.”";

  const proverbTradition = isAceh
    ? "Kearifan Tradisi Meuseuraya (Aceh)"
    : "Kearifan Tradisi Batang Tarandam (Minang)";

  const meaning = isAceh
    ? "Bunga yang mekar saling bertaut erat, satu hati membangun kembali masa depan bersama. Kesediaanmu berbagi tawa dan membantu orang lain di posko adalah perwujudan nyata dari jiwa tangguh yang menyembuhkan luka."
    : "Mengangkat kembali batang kayu yang terendam air; simbol kebangkitan karakter dan harga diri. Ujian dan musibah bukanlah akhir, melainkan awal pemulihan jiwa yang lebih tangguh bersama keluarga dan komunitas.";

  const tag = isLowMood
    ? "Respon Normal Distres"
    : isAceh
    ? "Meuseuraya Gotong Royong"
    : "Nilai Badunsanak";

  return { empathy, proverb, proverbTradition, meaning, tag };
}

// Calculate streak days from dates
function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const uniqueDateStrs = Array.from(
    new Set(dates.map((d) => d.toISOString().split("T")[0]))
  ).sort().reverse();

  let streak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // If latest entry is today or yesterday, start streak count
  if (uniqueDateStrs[0] === todayStr || uniqueDateStrs[0] === yesterdayStr) {
    let checkDate = new Date(uniqueDateStrs[0]);
    streak = 1;
    for (let i = 1; i < uniqueDateStrs.length; i++) {
      const prevExpected = new Date(checkDate);
      prevExpected.setDate(prevExpected.getDate() - 1);
      const expectedStr = prevExpected.toISOString().split("T")[0];
      if (uniqueDateStrs[i] === expectedStr) {
        streak++;
        checkDate = prevExpected;
      } else {
        break;
      }
    }
  } else {
    // If last active was a few days ago, report total active days recorded up to 5
    streak = Math.min(uniqueDateStrs.length, 5);
  }

  return Math.max(1, streak);
}

// Ensure demo user & child profile exists in database
async function ensureDefaultProfile() {
  const sql = getDb();
  await sql`
    INSERT INTO "User" ("id", "isVerified", "isActive", "createdAt", "updatedAt")
    VALUES ('user-permata-demo', true, true, NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;
  `;
  await sql`
    INSERT INTO "ChildProfile" (
      "id", "createdByUserId", "fullName", "displayName", "nickname", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      'child-permata-demo', 'user-permata-demo', 'Cut Rayyan Al-Farizi', 'Rayyan', 'Rayyan', true, NOW(), NOW()
    )
    ON CONFLICT ("id") DO NOTHING;
  `;
}

// GET: Fetch journal entries & statistics from Neon PostgreSQL
export async function GET() {
  try {
    const sql = getDb();
    await ensureDefaultProfile();

    const rows = (await sql`
      SELECT 
        id, 
        "childId", 
        title, 
        content, 
        mood, 
        privacy, 
        "activityType", 
        tags, 
        "createdAt", 
        "updatedAt", 
        "deletedAt"
      FROM "RecoveryJournalEntry"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" DESC;
    `) as DBJournalRow[];

    // Parse and map rows to frontend structure
    const entries = rows.map((row) => {
      const createdDate = new Date(row.createdAt);
      const formattedDate = createdDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const tags = Array.isArray(row.tags) ? row.tags : [];
      let aiInsight = "";
      let proverb = "";
      let proverbMeaning = "";

      // Extract insight from tags if formatted as 'insight:...'
      const insightTag = tags.find((t) => t.startsWith("insight:"));
      if (insightTag) {
        aiInsight = insightTag.replace("insight:", "").trim();
      }

      // Extract proverb if tagged
      const proverbTag = tags.find((t) => t.startsWith("proverb:"));
      if (proverbTag) {
        proverb = proverbTag.replace("proverb:", "").trim();
      }

      const meaningTag = tags.find((t) => t.startsWith("meaning:"));
      if (meaningTag) {
        proverbMeaning = meaningTag.replace("meaning:", "").trim();
      }

      const culture = row.activityType || "aceh";
      const fallback = getFallbackInsight(culture, row.mood || 3);

      return {
        id: row.id,
        date: formattedDate,
        createdAt: row.createdAt,
        content: row.content || "",
        mood: row.mood || 3,
        privacy: row.privacy,
        culture,
        tag: tags[0] || fallback.tag,
        tags,
        aiInsight: aiInsight || fallback.empathy,
        proverb: proverb || fallback.proverb,
        proverbMeaning: proverbMeaning || fallback.meaning,
      };
    });

    // Query total waterings count from AuditLog
    const waterCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'WATER_HOPE_TREE';
    `) as { count: number }[];
    const waterCount = waterCountRes[0]?.count || 0;

    // Query total breathing exercises from AuditLog
    const breatheCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'BREATHING_EXERCISE';
    `) as { count: number }[];
    const breatheCount = breatheCountRes[0]?.count || 0;

    // Query total tele-screening assessments from AuditLog
    const screeningCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'TELESCREENING_DASS21';
    `) as { count: number }[];
    const screeningCount = screeningCountRes[0]?.count || 0;

    // Check if tree was watered today
    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const wateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    // Calculate dynamic Tree XP and Level Stats from DB records
    const treeStats = calculateTreeStats({
      journalCount: entries.length,
      waterCount,
      breatheCount,
      screeningCount,
      wateredToday,
    });

    // Calculate streak
    const dates = rows.map((r) => new Date(r.createdAt));
    const streakDays = calculateStreak(dates);

    return NextResponse.json({
      success: true,
      entries,
      stats: {
        totalEntries: entries.length,
        treeXp: treeStats.totalXp,
        treeStats,
        streakDays,
        childName: "Rayyan",
      },
    });
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data jurnal dari database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: Save new journal entry to Neon PostgreSQL and generate AI Cultural Hikmah
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, mood = 3, culture = "aceh", privacy = "PRIVATE", tags = [] } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Isi catatan jurnal tidak boleh kosong" },
        { status: 400 }
      );
    }

    const sql = getDb();
    await ensureDefaultProfile();

    // 1. Generate Cultural AI Insight
    let insight = getFallbackInsight(culture, mood);

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: `
Kamu adalah Konselor Psikososial Anak & Pakar Kearifan Budaya Nusantara dalam Program PERMATA.
Tugasmu: Menganalisis catatan jurnal pemulihan pascabencana dari seorang anak dan memberikan empati mendalam serta hikmah budaya lokal yang membangkitkan harapan.
Fokus budaya:
- Aceh: Tradisi "Meuseuraya" (gotong royong tulus saling menopang satu sama lain), falsafah Bungoeng Jeumpa, semangat bangkit dari tsunami/bencana.
- Sumbar: Tradisi Minang "Mambangkik Batang Tarandam" (membangkitkan kembali marwah dan ketangguhan yang sempat terbenam), kebersamaan Badunsanak.

Format output WAJIB JSON murni tanpa markdown:
{
  "empathy": "2-3 kalimat hangat penuh empati, memvalidasi emosi anak tanpa menghakimi, menegaskan bahwa reaksinya wajar dan dia kuat.",
  "proverb": "Pepatah atau kata hikmah budaya lokal yang relevan",
  "proverbTradition": "Nama tradisi budaya (misal: Kearifan Tradisi Meuseuraya atau Kearifan Batang Tarandam)",
  "meaning": "1-2 kalimat menjelaskan makna pepatah tersebut terhadap situasi anak untuk menumbuhkan asa.",
  "tag": "Label kategori singkat (maks 4 kata)"
}
`,
        });

        const promptText = `
Catatan Anak: "${content.trim()}"
Skor Emosi / Mood: ${mood} dari skala 1-5 (1: cemas/takut, 3: tenang, 5: penuh harapan)
Pilihan Budaya: ${culture === "aceh" ? "Aceh (Meuseuraya)" : "Sumatera Barat (Batang Tarandam)"}

Hasilkan respons dalam JSON sesuai instruksi.`;

        const geminiRes = await model.generateContent(promptText);
        const textRes = geminiRes.response.text();
        const jsonMatch = textRes.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.empathy && parsed.proverb) {
            insight = {
              empathy: parsed.empathy,
              proverb: parsed.proverb,
              proverbTradition: parsed.proverbTradition || insight.proverbTradition,
              meaning: parsed.meaning || insight.meaning,
              tag: parsed.tag || insight.tag,
            };
          }
        }
      } catch (aiErr) {
        console.warn("Gemini AI generation warning (using cultural fallback):", aiErr);
      }
    }

    // 2. Prepare database tags
    const entryId = `rje-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dbTags: string[] = [
      insight.tag,
      ...(Array.isArray(tags) ? tags : []),
      `XP:+50`,
      `insight:${insight.empathy}`,
      `proverb:${insight.proverb}`,
      `meaning:${insight.meaning}`,
    ];

    const dbPrivacy = privacy === "CARE_CIRCLE" ? "CARE_CIRCLE" : "PRIVATE";

    // 3. Insert into Neon PostgreSQL table RecoveryJournalEntry
    const inserted = (await sql`
      INSERT INTO "RecoveryJournalEntry" (
        "id",
        "childId",
        "title",
        "content",
        "mood",
        "privacy",
        "activityType",
        "tags",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${entryId},
        'child-permata-demo',
        ${`Refleksi ${culture === "sumbar" ? "Batang Tarandam" : "Meuseuraya"}`},
        ${content.trim()},
        ${mood},
        ${dbPrivacy}::"JournalPrivacy",
        ${culture},
        ${dbTags},
        NOW(),
        NOW()
      )
      RETURNING 
        id, 
        "childId", 
        title, 
        content, 
        mood, 
        privacy, 
        "activityType", 
        tags, 
        "createdAt", 
        "updatedAt";
    `) as DBJournalRow[];

    const createdRow = inserted[0];
    const createdDate = new Date(createdRow.createdAt);
    const formattedDate = createdDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // 4. Query total entries, waterings, and breathing exercises for updated tree progress
    const countResult = (await sql`
      SELECT COUNT(*)::int AS count FROM "RecoveryJournalEntry" WHERE "deletedAt" IS NULL;
    `) as { count: number }[];
    const totalCount = countResult[0]?.count || 1;

    const waterCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'WATER_HOPE_TREE';
    `) as { count: number }[];
    const waterCount = waterCountRes[0]?.count || 0;

    const breatheCountRes = (await sql`
      SELECT COUNT(*)::int AS count FROM "AuditLog" WHERE "action" = 'BREATHING_EXERCISE';
    `) as { count: number }[];
    const breatheCount = breatheCountRes[0]?.count || 0;

    const wateredTodayRes = (await sql`
      SELECT COUNT(*)::int AS count 
      FROM "AuditLog" 
      WHERE "action" = 'WATER_HOPE_TREE' 
        AND "createdAt" >= CURRENT_DATE;
    `) as { count: number }[];
    const wateredToday = (wateredTodayRes[0]?.count || 0) > 0;

    const treeStats = calculateTreeStats({
      journalCount: totalCount,
      waterCount,
      breatheCount,
      wateredToday,
    });

    return NextResponse.json({
      success: true,
      message: "Refleksi berhasil disimpan ke database",
      entry: {
        id: createdRow.id,
        date: formattedDate,
        createdAt: createdRow.createdAt,
        content: createdRow.content,
        mood: createdRow.mood,
        privacy: createdRow.privacy,
        culture: createdRow.activityType || culture,
        tag: insight.tag,
        tags: createdRow.tags,
        aiInsight: insight.empathy,
        proverb: insight.proverb,
        proverbMeaning: insight.meaning,
      },
      insight,
      stats: {
        totalEntries: totalCount,
        treeXp: treeStats.totalXp,
        treeStats,
      },
    });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyimpan catatan jurnal ke database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
