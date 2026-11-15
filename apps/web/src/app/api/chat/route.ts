import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

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

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    const isAceh = culture === "aceh";
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      const fallback = getFallbackReply(message, culture);
      return NextResponse.json({ reply: fallback });
    }

    const systemInstruction = `
Kamu adalah "Sahabat Dengar PERMATA", pendamping dukungan mental dan Psychological First Aid (PFA) anak serta remaja pascabencana alam di Indonesia.

PRINSIP UTAMA:
1. Validasi Emosi: Validasi bahwa rasa takut, kaget terhadap suara keras (gemuruh angin, suara reruntuhan), sedih, atau cemas adalah respon normal terhadap peristiwa yang luar biasa.
2. Kehangatan & Ramah Anak: Gunakan gaya bahasa Indonesia yang hangat, lembut, suportif, tidak kaku, dan mudah dipahami anak/remaja. Sapa dengan empati.
3. Kearifan Lokal Budaya (${isAceh ? "ACEH - MEUSEURAYA" : "MINANGKABAU - MAMBANGKIK BATANG TARANDAM"}):
${
  isAceh
    ? `   - Integrasikan nilai Meuseuraya (gotong-royong pemulihan jiwa, saling menguatkan, persaudaraan posko).
   - Selipkan petuah Aceh yang menenangkan, contoh: "Bungoeng jeumpa meugisa meutaloe, saboh hatee peugot gampong" atau "Udep sare mate syahid, beusajan lam geunaseh. Badai brat ka lheueh ta lewati, singoh langet teuh glah."`
    : `   - Integrasikan falsafah "Mambangkik Batang Tarandam" (mengangkat kembali batang kayu yang terendam air; daya lentur / resiliensi jiwa untuk bangkit kembali dari musibah bersama sanak saudara).
   - Selipkan petuah Minang yang menenangkan, contoh: "Dima bumi dipijak, di sinan langik dijunjuang; Mambangkik batang tarandam, bangkik marwah kito basamo."`
}
4. Tindakan Praktis PFA:
   - Jika anak merasa cemas/berdebar/panik, sertakan panduan relaksasi napas 4-4-4 (tarik napas 4 detik, tahan 3-4 detik, hembuskan 4-5 detik) atau teknik grounding 5-4-3-2-1.
5. Batasan & Keamanan:
   - Bukan pengganti diagnosis dokter psikiatri atau medis darurat.
   - Jika mendeteksi keputusasaan ekstrim atau ancaman bahaya diri, ingatkan bahwa mereka tidak sendirian dan arahkan dengan lembut ke layanan SafeConnect 119.
6. Panjang respons: 2 sampai 4 paragraf ringkas, terstruktur, nyaman dibaca di layar ponsel.
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction,
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
      promptText += `\n\nPengguna: ${message}\n\nPendamping:`;
    } else {
      promptText = message;
    }

    const result = await model.generateContent(promptText);
    const reply = result.response.text();

    return NextResponse.json({
      success: true,
      reply: reply || getFallbackReply(message, culture),
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    try {
      // Fallback response so user experience is never broken
      const body = await req
        .clone()
        .json()
        .catch(() => ({}));
      const fallback = getFallbackReply(
        body.message || "",
        body.culture || "aceh",
      );
      return NextResponse.json({ success: true, reply: fallback });
    } catch {
      return NextResponse.json(
        {
          success: true,
          reply:
            "Terima kasih sudah berbagi ceritamu hari ini. Kamu sangat berani. Ingatlah bahwa kamu tidak sendirian di sini, dan kita akan melangkah bersama satu demi satu menuju ketenangan jiwa.",
        },
        { status: 200 },
      );
    }
  }
}
