import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";
import {
  buildMoodFoodSystemInstruction,
  parseAiJsonResponse,
  preflightGuardrail,
  REJECTED_MESSAGES,
} from "@/lib/aiRules";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_FOOD_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDTfbQkm81C_p2FO2nGrM9p2g5Gv0P5Kq0VP_qepgn_EHWekAGKnzK7NNduL_qfG8o-CXNsg5Irr3c-7eYhS5HjefMJghhMk-IBaxe9Qlw3SfNaiVrAj2QR3M1CTW85O2GrS-sLjs9Wcu3G9AFCbr6lNpjzVhNMXSJZ7GnyGBgYTDGWsnDzmdvtmyJICraFDGAlQ8QGR7IuC-PDzEXaEvfQJnte8OphS-HH5uYQGPg";

// Fallback cultural food analyses
function getFallbackFoodAnalysis(mood: string, symptoms: string[], culture: string) {
  const isAceh = culture === "aceh";
  const normalizedMood = (mood || "marah").toLowerCase();

  if (normalizedMood === "marah") {
    return {
      detectedFood: "Sayur Bening Kelor & Tempe Rebus Posko",
      fileMeta: "1.2 MB • JPG",
      components:
        "Teridentifikasi komponen: Daun kelor, jagung manis, tempe kukus, kaldu rempah bening. Komposisi kaya flavonoid dan triptofan tinggi.",
      headline: "Pereda Ketegangan Sistem Saraf Otonom",
      explanation:
        "Saat marah atau tegang pascabencana, tubuh memproduksi hormon kortisol dan memicu vasokonstriksi lambung. Makanan berkuah hangat dengan kandungan magnesium daun kelor dan asam amino tempe merelaksasi otot-otot dinding perut serta menstimulasi nervus vagus untuk meredam amarah.",
      tryptophanPercent: 88,
      tryptophanDesc:
        "Tempe rebus menyediakan asam amino esensial prekursor hormon penenang alami.",
      glycemicStatus: "Stabil Rendah",
      glycemicDesc:
        "Menghindari lonjakan gula darah yang kerap memicu ledakan emosi mendadak.",
      antiInflammatoryStatus: "Optimal",
      antiInflammatoryDesc:
        "Kuah rempah membersihkan zat sisa stres biologis pascamusibah.",
      gutBrainScore: 78,
      gutBrainStatus: "Seimbang",
      gutBrainSummary:
        "90% hormon serotonin diproduksi dalam saluran cerna. Menu berserat tinggi hari ini memperkuat resiliensi mentalmu.",
      nutritionistNote:
        "Hindari santapan tinggi pemanis buatan di masa krisis karena dapat memicu fluktuasi suasana hati mendadak.",
      recommendations: isAceh
        ? [
            {
              title: "Seduhan Jahe Temulawak Hangat",
              desc: "Senyawa gingerol menurunkan denyut jantung tegang dan menghangatkan ulu hati yang gelisah.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
            },
            {
              title: "Kuah Beulangong Rempah Tenang",
              desc: "Kaya rempah cengkeh dan kapulaga yang membantu menurunkan ketegangan fisik dan memperbaiki kualitas tidur di posko.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
            },
          ]
        : [
            {
              title: "Seduhan Jahe Temulawak Hangat",
              desc: "Senyawa gingerol menurunkan denyut jantung tegang dan menghangatkan ulu hati yang gelisah.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
            },
            {
              title: "Teh Talua Minang (Asam Amino)",
              desc: "Kandungan kolin dan protein bioaktif mengembalikan stamina fisik yang terkuras akibat letupan emosi.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
            },
          ],
    };
  }

  if (normalizedMood === "sedih") {
    return {
      detectedFood: "Bubur Sup Hangat & Telur Rebus Posko",
      fileMeta: "1.1 MB • JPG",
      components:
        "Teridentifikasi komponen: Bubur beras merah, kaldu ayam herbal, telur rebus, wortel, seledri. Kaya triptofan, zinc, dan vitamin B kompleks.",
      headline: "Pemicu Produksi Serotonin & Kehangatan Jiwa",
      explanation:
        "Kondisi duka dan sedih sering memperlambat motilitas saluran cerna dan mengurangi nafsu makan. Santapan lembut berkuah kaya asam amino dan zinc ini merangsang produksi serotonin dan endorfin untuk memulihkan kehangatan emosi secara bertahap.",
      tryptophanPercent: 82,
      tryptophanDesc:
        "Telur rebus kaya kolin dan triptofan mempercepat regenerasi neurotransmitter saraf.",
      glycemicStatus: "Bertahap Seimbang",
      glycemicDesc:
        "Pelepasan glukosa teratur menjaga kestabilan energi tanpa memicu rasa lemas mendadak.",
      antiInflammatoryStatus: "Tinggi",
      antiInflammatoryDesc:
        "Kaldu herbal alami memperkuat selaput usus dari dampak distres berkepanjangan.",
      gutBrainScore: 74,
      gutBrainStatus: "Seimbang",
      gutBrainSummary:
        "Serat lembut dan protein mudah serap menjaga kontinuitas sintesis hormon dopamin dan serotonin.",
      nutritionistNote:
        "Makanlah dalam porsi kecil namun sering bila perut terasa begah akibat rasa cemas dan sedih.",
      recommendations: isAceh
        ? [
            {
              title: "Kanji Rumpun Posko Hangat",
              desc: "Bubur rempah tradisional Aceh memberi rasa kenyang lembut dan kenyamanan batin di tenda posko.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDTfbQkm81C_p2FO2nGrM9p2g5Gv0P5Kq0VP_qepgn_EHWekAGKnzK7NNduL_qfG8o-CXNsg5Irr3c-7eYhS5HjefMJghhMk-IBaxe9Qlw3SfNaiVrAj2QR3M1CTW85O2GrS-sLjs9Wcu3G9AFCbr6lNpjzVhNMXSJZ7GnyGBgYTDGWsnDzmdvtmyJICraFDGAlQ8QGR7IuC-PDzEXaEvfQJnte8OphS-HH5uYQGPg",
            },
            {
              title: "Seduhan Serai Madu Hutan",
              desc: "Menghangatkan dada yang terasa sesak dan memperbaiki kualitas istirahat malam pascamusibah.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
            },
          ]
        : [
            {
              title: "Teh Talua Minang (Asam Amino)",
              desc: "Kandungan kolin dan protein bioaktif mengembalikan stamina fisik yang terkuras akibat duka.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
            },
            {
              title: "Seduhan Jahe Temulawak Hangat",
              desc: "Senyawa gingerol menurunkan denyut jantung tegang dan menghangatkan ulu hati yang gelisah.",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
            },
          ],
    };
  }

  // Bahagia / Netral default
  return {
    detectedFood: "Nasi Gurih Ikan Bakar Rempah & Lalapan",
    fileMeta: "1.4 MB • JPG",
    components:
      "Teridentifikasi komponen: Nasi beras lokal, ikan bakar rempah kunyit, lalapan timun & kemangi, sambal tomat segar. Kaya asam lemak omega-3 dan polifenol.",
    headline: "Pemelihara Dopamin & Keseimbangan Resiliensi",
    explanation:
      "Suasana hati positif memperkuat kekebalan mukosa usus dan keseimbangan mikrobioma. Asupan omega-3 dan fitonutrien rempah mempertahankan kestabilan emosi serta menjaga energi beraktivitas di lingkungan posko.",
    tryptophanPercent: 92,
    tryptophanDesc:
      "Kombinasi asam lemak omega-3 dan triptofan ikan menjaga fungsi kognitif dan fokus.",
    glycemicStatus: "Sangat Terkontrol",
    glycemicDesc:
      "Serat pangan lalapan menyeimbangkan penyerapan glukosa secara bertahap dan harmonis.",
    antiInflammatoryStatus: "Maksimal",
    antiInflammatoryDesc:
      "Kurkumin dan flavonoid rempah menetralkan radikal bebas dalam tubuh secara alami.",
    gutBrainScore: 86,
    gutBrainStatus: "Sangat Baik",
    gutBrainSummary:
      "Keseimbangan mikrobioma sangat sehat, mendukung transmisi sinyal saraf ketenangan dan optimisme.",
    nutritionistNote:
      "Pertahankan hidrasi air putih minimal 2 liter per hari agar metabolisme nutrisi emosional tetap optimal.",
    recommendations: isAceh
      ? [
          {
            title: "Ikan Keumamah Bumbu Asam Sunti",
            desc: "Protein tinggi dengan fermentasi alami yang menyuburkan bakteri baik dalam usus.",
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDTfbQkm81C_p2FO2nGrM9p2g5Gv0P5Kq0VP_qepgn_EHWekAGKnzK7NNduL_qfG8o-CXNsg5Irr3c-7eYhS5HjefMJghhMk-IBaxe9Qlw3SfNaiVrAj2QR3M1CTW85O2GrS-sLjs9Wcu3G9AFCbr6lNpjzVhNMXSJZ7GnyGBgYTDGWsnDzmdvtmyJICraFDGAlQ8QGR7IuC-PDzEXaEvfQJnte8OphS-HH5uYQGPg",
          },
          {
            title: "Seduhan Serai Jahe Madu",
            desc: "Menyegarkan tubuh dan menjaga vitalitas daya tahan tubuh pejuang posko.",
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
          },
        ]
      : [
          {
            title: "Teh Talua Minang (Asam Amino)",
            desc: "Kandungan kolin dan protein bioaktif mengembalikan stamina fisik dan menjaga fokus belajar.",
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDXzK6-yVOQqlKZdYc5B4-kaXRbJwbRMkWnCk4lDLTYcFAERIuOYgzcAGGXJ77-Adz0FBt2HdcXUl6eNnapc7MVWTBChJmCnAdN_YBHneDu4eaNIQ66iXInG3fPPjzk2EgWhQIxTFyXtC6xptbu6HfDY8G9IsZPAEbXUyYajsMOfCUp61j3zOieo1s7fZvwVsYJ77Bhkvdm2aDwRbPu54LBBC9Ph2Fi1i6YnuPhkBM",
          },
          {
            title: "Seduhan Jahe Temulawak Hangat",
            desc: "Menjaga stamina pencernaan dan melancarkan peredaran darah untuk mendukung keceriaan batin.",
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuA0T264vQFqSzBhnbpB3tTnXHlOaAj9rRrbrCQ2ot7AzNBxKevUlENNdGiGSr4CIEW83xHCJijaS8fkciarGe1O6S_Bp4KUAqrbZ07bxe6lxtrlZWv0hQdFoklCTh6U5Hm4tMgrJGwClHHrPxP7NoMotyAPwV1JuRRongfwctUI8R2sjpQtIZ_wIaCJxP31WbnK1NV7ySLJSBri-Z-J8T8bsJHJGAW1DTgMO4phmgQ",
          },
        ],
  };
}

// GET: Fetch dynamic Mood Food entries, latest diagnosis, and tree stats from database for authenticated user
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          error:
            "Silakan masuk ke akun Anda untuk melihat riwayat analisis Mood + Food pribadi.",
        },
        { status: 401 }
      );
    }

    const sql = getDb();

    // Query mood food analysis records scoped to authenticated user & child
    interface AuditRow {
      id: string;
      actorId: string;
      action: string;
      metadata: any;
      createdAt: string | Date;
    }

    const rows = (await sql`
      SELECT "id", "actorId", "action", "metadata", "createdAt"
      FROM "AuditLog"
      WHERE "action" = 'MOOD_FOOD_ANALYSIS'
        AND "actorId" = ${session.userId}
        AND "resourceId" = ${session.childId}
      ORDER BY "createdAt" DESC
      LIMIT 20;
    `) as AuditRow[];

    // Parse records
    const history = rows.map((r) => {
      let meta = r.metadata;
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch {
          meta = {};
        }
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        mood: meta?.mood || "marah",
        symptoms: meta?.symptoms || [],
        notes: meta?.notes || "",
        culture: meta?.culture || "aceh",
        foodName: meta?.foodName || meta?.analysis?.detectedFood || "Santapan Posko",
        previewUrl: meta?.previewUrl || DEFAULT_FOOD_IMAGE,
        fileMeta: meta?.fileMeta || "1.2 MB • JPG",
        gutBrainScore: meta?.gutBrainScore || meta?.analysis?.gutBrainScore || 78,
        gutBrainStatus: meta?.analysis?.gutBrainStatus || "Seimbang",
        analysis: meta?.analysis || getFallbackFoodAnalysis(meta?.mood || "marah", meta?.symptoms || [], meta?.culture || "aceh"),
      };
    });

    const latest = history[0] || null;
    const treeStats = await getUserTreeStats(session.userId, session.childId);

    // Calculate aggregated stats from database
    const scores = history.map((h) => h.gutBrainScore);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 78;

    return NextResponse.json({
      success: true,
      latest,
      history,
      treeStats,
      stats: {
        totalAnalyses: history.length,
        averageGutBrainScore: avgScore,
      },
    });
  } catch (error) {
    console.error("GET /api/mood-food ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data dari database.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: Process new food image, analyze with Gemini AI, and persist to PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          requiresAuth: true,
          reply: "Silakan masuk ke akun Anda untuk menyimpan analisis Mood + Food dan progres Pohon Harapan pribadi.",
          error: "Autentikasi diperlukan untuk menyimpan analisis Mood + Food.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      mood = "marah",
      file = null,
      symptoms = [],
      notes = "",
      culture = "aceh",
    } = body;

    if (typeof notes === "string" && notes.trim()) {
      const preflight = preflightGuardrail(notes, "mood-food");
      if (preflight?.status === "crisis") {
        return NextResponse.json(
          {
            success: false,
            status: "crisis",
            crisis: preflight,
            reply: preflight.immediateResponse,
            error: preflight.immediateResponse,
          },
          { status: 422 }
        );
      }
      if (preflight?.status === "rejected") {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            rejected: true,
            message: preflight.message,
            reply: preflight.message,
            error: preflight.message,
          },
          { status: 422 }
        );
      }
    }

    const fallback = getFallbackFoodAnalysis(mood, symptoms, culture);
    let finalAnalysis = { ...fallback };
    let replyText = `${fallback.headline}\n\n${fallback.explanation}\n\nKomponen: ${fallback.components}`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (apiKey && file && file.base64) {
      let aiGuardrailResponse: NextResponse | null = null;
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: buildMoodFoodSystemInstruction(),
        });

        const prompt = `
Data Masukan:
- Mood Pengguna: ${mood}
- Gejala Somatis Penyerta: ${Array.isArray(symptoms) ? symptoms.join(", ") : "Tidak ada"}
- Catatan Pengguna: ${notes || "Tidak ada catatan khusus"}
- Konteks Budaya: ${culture === "kalimantan" ? "Kalimantan (Dayak & Banjar)" : "Aceh"}

Periksa foto dan catatan sesuai instruksi sistem, lalu keluarkan respons JSON murni.`;

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: file.mimeType || "image/jpeg",
                    data: file.base64,
                  },
                },
              ],
            },
          ],
        });

        const rawText = result.response.text();
        const parsed = parseAiJsonResponse(rawText);

        if (parsed) {
          if (parsed.status === "crisis") {
            const immediateResponse =
              typeof parsed.immediateResponse === "string" &&
              parsed.immediateResponse.trim()
                ? parsed.immediateResponse.trim()
                : "Perasaanmu sangat berharga dan didengar. Tolong segera ceritakan kondisimu kepada orang dewasa tepercaya, pendamping lapangan PERMATA, atau hubungi SafeConnect 119.";
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
                reply: immediateResponse,
                error: immediateResponse,
              },
              { status: 422 }
            );
          } else if (parsed.status === "rejected") {
            const rejectedMessage =
              typeof parsed.message === "string" && parsed.message.trim()
                ? parsed.message.trim()
                : REJECTED_MESSAGES["mood-food"];
            aiGuardrailResponse = NextResponse.json(
              {
                success: false,
                status: "rejected",
                rejected: true,
                message: rejectedMessage,
                reply: rejectedMessage,
                error: rejectedMessage,
              },
              { status: 422 }
            );
          } else {
            finalAnalysis = {
              ...finalAnalysis,
              ...(parsed as Partial<typeof finalAnalysis>),
              recommendations: fallback.recommendations,
              nutritionistNote: fallback.nutritionistNote,
            };
            replyText = `${finalAnalysis.headline}\n\n${finalAnalysis.explanation}\n\nKomponen: ${finalAnalysis.components}`;
          }
        }
      } catch (geminiError) {
        console.warn("Gemini Vision processing error, using enriched fallback:", geminiError);
      }

      if (aiGuardrailResponse) {
        return aiGuardrailResponse;
      }
    }

    // Award +40 XP & Persist to PostgreSQL Database scoped to authenticated user
    let treeStats = null;
    let savedRecord = null;
    try {
      const sql = getDb();

      const logId = `audit-moodfood-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = file?.base64
        ? `data:${file.mimeType || "image/jpeg"};base64,${file.base64}`
        : DEFAULT_FOOD_IMAGE;

      const metadata = {
        xp: 40,
        mood,
        moodScore: mood === "sedih" ? 2 : mood === "marah" ? 1 : 5,
        symptoms,
        notes,
        culture,
        previewUrl,
        foodName: finalAnalysis.detectedFood,
        fileMeta: file?.fileSize || finalAnalysis.fileMeta,
        gutBrainScore: finalAnalysis.gutBrainScore,
        analysis: finalAnalysis,
        timestamp: new Date().toISOString(),
      };

      // 1. Insert into AuditLog
      await sql`
        INSERT INTO "AuditLog" (
          "id",
          "actorId",
          "userId",
          "action",
          "resourceType",
          "resourceId",
          "metadata",
          "createdAt"
        )
        VALUES (
          ${logId},
          ${session.userId},
          ${session.userId},
          'MOOD_FOOD_ANALYSIS',
          'FoodEmotionRecord',
          ${session.childId},
          ${JSON.stringify(metadata)},
          NOW()
        );
      `;

      // 2. Insert into EmotionCheckIn
      const checkInId = `checkin-moodfood-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await sql`
        INSERT INTO "EmotionCheckIn" ("id", "childId", "emotion", "intensity", "context", "checkedInAt")
        VALUES (
          ${checkInId},
          ${session.childId},
          ${mood},
          ${mood === "sedih" ? 2 : mood === "marah" ? 1 : 5},
          ${'Mood Food: ' + finalAnalysis.detectedFood},
          NOW()
        )
        ON CONFLICT DO NOTHING;
      `;

      // 3. Insert into RecoveryJournalEntry
      const journalId = `journal-moodfood-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await sql`
        INSERT INTO "RecoveryJournalEntry" (
          "id", "childId", "title", "content", "mood", "privacy", "activityType", "tags", "createdAt", "updatedAt"
        )
        VALUES (
          ${journalId},
          ${session.childId},
          ${'Nutrisi Emosi: ' + finalAnalysis.detectedFood},
          ${finalAnalysis.headline + '\n\n' + finalAnalysis.explanation + '\n\nKomposisi: ' + finalAnalysis.components + (notes ? '\n\nCatatan: ' + notes : '')},
          ${mood === "sedih" ? 2 : mood === "marah" ? 1 : 5},
          'PRIVATE',
          'MOOD_FOOD',
          ${['mood-food', mood, ...(Array.isArray(symptoms) ? symptoms : [])]},
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING;
      `;

      treeStats = await getUserTreeStats(session.userId, session.childId);

      savedRecord = {
        id: logId,
        createdAt: new Date().toISOString(),
        mood,
        symptoms,
        notes,
        culture,
        foodName: finalAnalysis.detectedFood,
        previewUrl,
        fileMeta: file?.fileSize || finalAnalysis.fileMeta,
        gutBrainScore: finalAnalysis.gutBrainScore,
        gutBrainStatus: finalAnalysis.gutBrainStatus,
        analysis: finalAnalysis,
      };
    } catch (dbError) {
      console.warn("Could not save mood food log to PostgreSQL:", dbError);
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      analysis: finalAnalysis,
      savedRecord,
      treeStats,
      xpAwarded: 40,
    });
  } catch (error) {
    console.error("MOOD FOOD ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, reply: "Terjadi kesalahan saat memproses analisis makanan.", error: String(error) },
      { status: 500 }
    );
  }
}
