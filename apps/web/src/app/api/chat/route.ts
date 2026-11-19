import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import {
  buildChatSystemInstruction,
  parseAiJsonResponse,
  preflightGuardrail,
  REJECTED_MESSAGES,
} from "@/lib/aiRules";
import {
  buildRagContextBlock,
  injectRagContext,
  retrieveRelevantChunks,
} from "@/lib/rag";

export const maxDuration = 60;

function getFallbackReply(message: string, culture: string): string {
  const isAceh = culture === "aceh";
  const lower = message.toLowerCase();

  if (
    lower.includes("takut") ||
    lower.includes("gempa") ||
    lower.includes("angin") ||
    lower.includes("suara") ||
    lower.includes("cemas")
  ) {
    if (isAceh) {
      return (
        "Terima kasih sudah sangat berani menceritakan rasa takut ini. Merasa waspada, cemas, dan dada berdebar setelah bencana adalah reaksi yang wajar dan alami dari tubuhmu untuk melindungi diri. Kamu tidak sendirian di posko ini.\n\n" +
        "🌿 Kearifan Meuseuraya Aceh:\n" +
        "“Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong.”\n" +
        "Duka dan lelah ini kita pikul bersama di posko. Bunga yang mekar saling bertaut, luka batin perlahan sembuh saat kita saling menguatkan.\n\n" +
        "Mari kita tenangkan debaran dadamu bersama-sama sejenak: tarik napas perlahan lewat hidung (4 detik)... tahan 3 detik... lalu hembuskan lembut lewat mulut (5 detik). Kamu aman saat ini."
      );
    } else {
      return (
        "Terima kasih sudah sangat berani menceritakan rasa takut ini. Merasa waspada, cemas, dan dada berdebar setelah bencana adalah reaksi yang wajar dan alami dari tubuhmu untuk melindungi diri. Kamu tidak sendirian.\n\n" +
        "🏛️ Falsafah Mambangkik Batang Tarandam:\n" +
        "“Batang kayu yang terendam air lambat laun akan timbul kembali.”\n" +
        "Rasa cemas ini adalah fase awal pemulihan. Kamu memiliki daya lentur batin untuk bangkit kembali bersama sanak saudara dan teman-teman.\n\n" +
        "Mari kita tenangkan debaran dadamu bersama-sama sejenak: tarik napas perlahan lewat hidung (4 detik)... tahan 3 detik... lalu hembuskan lembut lewat mulut (5 detik). Kamu aman saat ini."
      );
    }
  }

  if (
    lower.includes("kangen") ||
    lower.includes("rindu") ||
    lower.includes("rumah") ||
    lower.includes("sekolah")
  ) {
    return (
      "Rasa rindu pada rumah, kamar, dan teman sekolah adalah perasaan yang sangat tulus dan manusiawi. Kehilangan rasa nyaman yang biasa kita rasakan memang berat bagi siapapun, apalagi bagi pejuang hebat sepertimu.\n\n" +
      (isAceh
        ? "Di posko ini, semangat Meuseuraya hadir agar kita bisa saling berbagi tawa dan kehangatan. Langkah kecilmu hari ini adalah bekal untuk membangun kembali hari esok yang lebih cerah."
        : "Falsafah Minangkabau mengajarkan bahwa di mana pun bumi dipijak, langit harapan tetap kita junjung bersama. Kamu punya kekuatan untuk menciptakan kenangan baik baru bersama teman-teman di sekitar.") +
      "\n\nApakah ada cerita atau kenangan indah dari rumah yang paling ingin kamu bagikan denganku hari ini?"
    );
  }

  return (
    "Aku mendengarkanmu dengan sungguh-sungguh. Setiap perasaan yang kamu rasakan valid, nyata, dan kamu berharga. " +
    (isAceh
      ? "Dalam semangat Meuseuraya, kita saling merangkul dan menguatkan di setiap langkah pemulihan jiwa."
      : "Sebagaimana falsafah Mambangkik Batang Tarandam, perlahan kita akan bangkit bersama melewati masa sulit ini.") +
    "\n\nCeritakan apa yang sedang terpikirkan di hatimu, atau jika kamu merasa lelah, kita bisa latihan napas tenang bersama-sama."
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, culture = "aceh", history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, status: "rejected", reply: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    const preflight = preflightGuardrail(message, "chat");
    if (preflight?.status === "crisis") {
      return NextResponse.json(
        {
          success: false,
          status: "crisis",
          crisis: preflight,
          reply: preflight.immediateResponse,
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
          reply: preflight.message,
        },
        { status: 422 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    let ragContext = "";
    try {
      const chunks = await retrieveRelevantChunks(message.trim());
      ragContext = buildRagContextBlock(chunks);
    } catch {
      ragContext = "";
    }

    if (!apiKey) {
      const fallback = getFallbackReply(message, culture);
      return NextResponse.json({
        success: true,
        status: "accepted",
        reply: fallback,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction: buildChatSystemInstruction(culture),
    });

    // Construct conversation prompt
    let promptText = "";
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      promptText = recentHistory
        .map((h: { role: string; content: string }) =>
          h.role === "user"
            ? `Pengguna: ${h.content}`
            : `Pendamping: ${h.content}`,
        )
        .join("\n\n");
      promptText += `\n\nPengguna: ${message.trim()}\n\nHasilkan respons dalam JSON sesuai instruksi.`;
    } else {
      promptText = `Pesan Anak: "${message.trim()}"\n\nHasilkan respons dalam JSON sesuai instruksi.`;
    }

    const promptWithContext = injectRagContext(promptText, ragContext);
    const result = await model.generateContent(promptWithContext);
    const rawText = result.response.text();
    const parsed = parseAiJsonResponse(rawText);

    if (parsed) {
      if (parsed.status === "crisis") {
        const immediateResponse =
          typeof parsed.immediateResponse === "string" &&
          parsed.immediateResponse.trim()
            ? parsed.immediateResponse.trim()
            : "Perasaanmu sangat berharga dan didengar. Tolong segera ceritakan kondisimu kepada orang dewasa tepercaya, pendamping lapangan PERMATA, atau hubungi layanan darurat SafeConnect 119 sekarang ya.";
        return NextResponse.json(
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
          },
          { status: 422 },
        );
      }

      if (parsed.status === "rejected") {
        const rejectedMessage =
          typeof parsed.message === "string" && parsed.message.trim()
            ? parsed.message.trim()
            : REJECTED_MESSAGES.chat;
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            rejected: true,
            message: rejectedMessage,
            reply: rejectedMessage,
          },
          { status: 422 },
        );
      }

      if (typeof parsed.reply === "string" && parsed.reply.trim()) {
        return NextResponse.json({
          success: true,
          status: "accepted",
          reply: parsed.reply.trim(),
        });
      }
    }

    const trimmedRaw = rawText.trim();
    if (/^maaf,\s*ruang ini khusus/i.test(trimmedRaw)) {
      return NextResponse.json(
        {
          success: false,
          status: "rejected",
          rejected: true,
          message: trimmedRaw,
          reply: trimmedRaw,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      status: "accepted",
      reply: trimmedRaw || getFallbackReply(message, culture),
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    try {
      const body = await req
        .clone()
        .json()
        .catch(() => ({}));
      const msg = typeof body.message === "string" ? body.message : "";
      const preflight = preflightGuardrail(msg, "chat");
      if (preflight?.status === "rejected") {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            rejected: true,
            message: preflight.message,
            reply: preflight.message,
          },
          { status: 422 },
        );
      }
      const fallback = getFallbackReply(msg, body.culture || "aceh");
      return NextResponse.json({
        success: true,
        status: "accepted",
        reply: fallback,
      });
    } catch {
      return NextResponse.json(
        {
          success: true,
          status: "accepted",
          reply:
            "Terima kasih sudah berbagi ceritamu hari ini. Kamu sangat berani. Ingatlah bahwa kamu tidak sendirian di sini, dan kita akan melangkah bersama satu demi satu menuju ketenangan jiwa.",
        },
        { status: 200 },
      );
    }
  }
}
