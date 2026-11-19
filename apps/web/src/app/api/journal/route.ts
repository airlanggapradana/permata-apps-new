import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import {
  buildJournalSystemInstruction,
  parseAiJsonResponse,
  preflightGuardrail,
  REJECTED_MESSAGES,
} from "@/lib/aiRules";

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
      : "Rasa duka dan cemas adalah bagian dari proses pemulihan. Mengingat falsafah kebersamaan 'Handep' dan ketangguhan kayu ulin di rimba Kalimantan, di tengah ujian inilah ketangguhan baru akan tumbuh kembali perlahan bersama orang-orang terkasih.";
  } else {
    empathy = isAceh
      ? "Kamu telah berhasil melangkah melewati hari yang penuh tantangan. Perasaan tenang dan syukur yang kamu miliki saat berada di posko bersama adik dan teman adalah bibit ketangguhan yang sangat berharga. Kekhawatiran pada suara keras pascabencana adalah hal yang sepenuhnya wajar dialami oleh pejuang kecil sepertimu."
      : "Keteguhan hatimu untuk tetap melihat sisi baik dan bersyukur mencerminkan keteguhan pohon ulin dan semangat Rumah Betang. Rasa saling menguatkan ini memberi kehangatan bagi teman-teman di sekitarmu.";
  }

  const proverb = isAceh
    ? "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”"
    : "“Adat diturut, pusaka dijaga; bapakat kita bagawi, teguh laksana ulin di rimba.”";

  const proverbTradition = isAceh
    ? "Kearifan Tradisi Meuseuraya (Aceh)"
    : "Kearifan Tradisi Handep Betang (Kalimantan)";

  const meaning = isAceh
    ? "Bunga yang mekar saling bertaut erat, satu hati membangun kembali masa depan bersama. Kesediaanmu berbagi tawa dan membantu orang lain di posko adalah perwujudan nyata dari jiwa tangguh yang menyembuhkan luka."
    : "Semangat gotong royong dan keteguhan bersama di bawah satu naungan Rumah Betang. Cobaan dihadapi bahu-membahu, melahirkan daya lentur batin yang kokoh seperti pohon ulin.";

  const tag = isLowMood
    ? "Respon Normal Distres"
    : isAceh
      ? "Meuseuraya Gotong Royong"
      : "Handep Gotong Royong";

  return { empathy, proverb, proverbTradition, meaning, tag };
}

// Calculate streak days from dates
function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const uniqueDateStrs = Array.from(
    new Set(dates.map((d) => d.toISOString().split("T")[0])),
  )
    .sort()
    .reverse();

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

// GET: Fetch journal entries & statistics from Neon PostgreSQL for authenticated user
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Silakan masuk ke akun Anda untuk mengakses Jurnal Hikmah dan progres Pohon Harapan pribadi.",
        },
        { status: 401 },
      );
    }

    const sql = getDb();

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
      WHERE "childId" = ${session.childId}
        AND "deletedAt" IS NULL
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

    const treeStats = await getUserTreeStats(session.userId, session.childId);

    // Calculate streak
    const dates = rows.map((r) => new Date(r.createdAt));
    const streakDays = rows.length ? calculateStreak(dates) : 0;

    return NextResponse.json({
      success: true,
      entries,
      stats: {
        totalEntries: entries.length,
        treeXp: treeStats.totalXp,
        treeStats,
        streakDays,
        childName: session.childName,
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
      { status: 500 },
    );
  }
}

// POST: Save new journal entry to Neon PostgreSQL and generate AI Cultural Hikmah
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Silakan masuk ke akun Anda untuk menyimpan catatan jurnal pribadi.",
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      content,
      mood = 3,
      culture = "aceh",
      privacy = "PRIVATE",
      tags = [],
    } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Isi catatan jurnal tidak boleh kosong" },
        { status: 400 },
      );
    }

    const preflight = preflightGuardrail(content, "journal");
    if (preflight?.status === "crisis") {
      return NextResponse.json(
        {
          success: false,
          status: "crisis",
          crisis: preflight,
          error: preflight.immediateResponse,
        },
        { status: 422 },
      );
    }
    if (preflight?.status === "rejected") {
      return NextResponse.json(
        {
          success: false,
          status: "rejected",
          rejected: true,
          message: preflight.message,
          error: preflight.message,
        },
        { status: 422 },
      );
    }

    const sql = getDb();

    // 1. Generate Cultural AI Insight
    let insight = getFallbackInsight(culture, mood);

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (apiKey) {
      let aiGuardrailResponse: NextResponse | null = null;
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: buildJournalSystemInstruction(),
        });

        const promptText = `
Catatan Anak: "${content.trim()}"
Skor Emosi / Mood: ${mood} dari skala 1-5 (1: cemas/takut, 3: tenang, 5: penuh harapan)
Pilihan Budaya: ${culture === "aceh" ? "Aceh (Meuseuraya)" : "Sumatera Barat (Batang Tarandam)"}

Hasilkan respons dalam JSON sesuai instruksi.`;

        const geminiRes = await model.generateContent(promptText);
        const textRes = geminiRes.response.text();
        const parsed = parseAiJsonResponse(textRes);
        if (parsed) {
          if (parsed.status === "crisis") {
            const immediateResponse =
              typeof parsed.immediateResponse === "string" &&
              parsed.immediateResponse.trim()
                ? parsed.immediateResponse.trim()
                : "Perasaanmu sangat berharga dan didengar. Tolong segera ceritakan kondisimu kepada orang dewasa tepercaya, pendamping lapangan PERMATA, atau hubungi layanan darurat 119 sekarang ya.";
            aiGuardrailResponse = NextResponse.json(
              {
                success: false,
                status: "crisis",
                crisis: {
                  status: "crisis",
                  triggerCategory:
                    typeof parsed.triggerCategory === "string"
                      ? parsed.triggerCategory
                      : "Keselamatan Anak",
                  immediateResponse,
                  escalateToHuman: true,
                },
                error: immediateResponse,
              },
              { status: 422 },
            );
          } else if (parsed.status === "rejected") {
            const message =
              typeof parsed.message === "string" && parsed.message.trim()
                ? parsed.message.trim()
                : REJECTED_MESSAGES.journal;
            aiGuardrailResponse = NextResponse.json(
              {
                success: false,
                status: "rejected",
                rejected: true,
                message,
                error: message,
              },
              { status: 422 },
            );
          } else if (
            typeof parsed.empathy === "string" &&
            typeof parsed.proverb === "string"
          ) {
            insight = {
              empathy: parsed.empathy,
              proverb: parsed.proverb,
              proverbTradition:
                typeof parsed.proverbTradition === "string" &&
                parsed.proverbTradition
                  ? parsed.proverbTradition
                  : insight.proverbTradition,
              meaning:
                typeof parsed.meaning === "string" && parsed.meaning
                  ? parsed.meaning
                  : insight.meaning,
              tag:
                typeof parsed.tag === "string" && parsed.tag
                  ? parsed.tag
                  : insight.tag,
            };
          }
        }
      } catch (aiErr) {
        console.warn(
          "Gemini AI generation warning (using cultural fallback):",
          aiErr,
        );
      }

      if (aiGuardrailResponse) {
        return aiGuardrailResponse;
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
        ${session.childId},
        ${`Refleksi ${culture === "kalimantan" ? "Handep Betang" : "Meuseuraya"}`},
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

    // 4. Query total entries and user-scoped tree progress
    const treeStats = await getUserTreeStats(session.userId, session.childId);

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
        totalEntries: treeStats.journalCount,
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
      { status: 500 },
    );
  }
}
