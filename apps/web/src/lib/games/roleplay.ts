/** Curated, versioned story rules shared by the browser and the save endpoint. */
export const ROLEPLAY_GAME_ID = "roleplay-psikoedukasi";
export const ROLEPLAY_XP = 20;
export const ROLEPLAY_VERSION = 1;
export const ROLEPLAY_MAX_ANSWERS = 24;
export type RoleplayCulture = "aceh" | "kalimantan";
export type RoleplayAnswer = { nodeId: string; optionId: string };
export type RoleplayOption = {
  id: string;
  text: string;
  reaction: string;
  explanation: string;
  next: string;
  skill: string;
};
export type RoleplayNode = {
  id: string;
  stage: number;
  title: string;
  situation: string;
  dialogue: string;
  options: RoleplayOption[];
};
export type RoleplayScenario = {
  id: string;
  title: string;
  description: string;
  topic: string;
  icon: "heart" | "home" | "shield" | "chat";
  takeaway: string;
  nodes: RoleplayNode[];
};
export type RoleplayRun = {
  id: string;
  scenarioId: string;
  version: number;
  culture: RoleplayCulture;
  ownerId: string | null;
  answers: RoleplayAnswer[];
  activeMs: number;
  updatedAt: number;
};

function option(
  id: string,
  text: string,
  reaction: string,
  explanation: string,
  next: string,
  skill: string,
): RoleplayOption {
  return { id, text, reaction, explanation, next, skill };
}
function end(dialogue: string): RoleplayNode {
  return {
    id: "selesai",
    stage: 5,
    title: "Langkah kecil yang berarti",
    situation:
      "Percakapanmu sampai di akhir. Kalian tidak harus menyelesaikan semuanya hari ini.",
    dialogue,
    options: [],
  };
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "teman-di-posko",
    title: "Aku di sini, menemanimu",
    topic: "Empati & mencari bantuan",
    icon: "heart",
    description:
      "Temani seorang teman yang merasa takut di posko. Belajar hadir, mendengarkan, dan mengajak mencari pendamping.",
    takeaway:
      "Menemani berarti menghargai pilihan teman dan menghubungkannya dengan orang dewasa tepercaya. Kamu juga boleh meminta bantuan.",
    nodes: [
      {
        id: "sapa",
        stage: 1,
        title: "Seseorang di sudut balai",
        situation:
          "Kalian berada di {place}, di area yang sudah diarahkan pendamping. {friend} duduk sendiri setelah mendengar suara hujan.",
        dialogue: "Aku masih kaget mendengar suara tadi…",
        options: [
          option(
            "izin",
            "Boleh aku duduk di dekatmu?",
            "{friend} mengangguk dan memberi sedikit ruang.",
            "Meminta izin memberi teman kesempatan menentukan apa yang nyaman baginya.",
            "dengar",
            "Meminta izin",
          ),
          option(
            "cerita",
            "Ceritakan semua yang terjadi supaya aku mengerti.",
            "{friend} menunduk. Ia belum ingin bercerita panjang.",
            "Niatmu ingin memahami. Coba tawarkan kehadiran tanpa meminta detail kejadian.",
            "ruang",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "ruang",
        stage: 1,
        title: "Memberi ruang",
        situation:
          "Temanmu belum siap berbicara. Kamu bisa memperbaiki cara mengajaknya.",
        dialogue: "Boleh kalau aku diam dulu?",
        options: [
          option(
            "temani",
            "Boleh. Aku bisa menemanimu tanpa harus bercerita.",
            "{friend} mengangguk pelan.",
            "Diam bersama juga bisa menjadi bentuk dukungan.",
            "dengar",
            "Menghargai batas",
          ),
          option(
            "jarak",
            "Boleh. Aku di dekat pendamping kalau kamu ingin ditemani.",
            "{friend} tahu ke mana mencari teman ketika ia siap.",
            "Menjaga jarak yang nyaman tetap dapat menunjukkan kepedulian.",
            "dengar",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "dengar",
        stage: 2,
        title: "Mendengarkan tanpa mendesak",
        situation: "Setelah beberapa saat, {friend} mulai berbicara sedikit.",
        dialogue: "Aku takut kalau suara itu datang lagi.",
        options: [
          option(
            "akui",
            "Kedengarannya kamu masih takut. Aku mendengarkan.",
            "{friend} melanjutkan ceritanya dengan kalimat pendek.",
            "Mengakui perasaan membantu percakapan terasa didengar, tanpa menjanjikan hal yang belum pasti.",
            "pilihan",
            "Mendengarkan",
          ),
          option(
            "janji",
            "Aku janji tidak akan terjadi apa-apa lagi.",
            "{friend} bertanya, “Kamu benar-benar tahu?”",
            "Kita belum bisa memastikan apa yang akan terjadi. Jelaskan langkah yang bisa dilakukan sekarang.",
            "jujur",
            "Berbicara jujur",
          ),
        ],
      },
      {
        id: "jujur",
        stage: 2,
        title: "Janji yang bisa ditepati",
        situation:
          "Kamu ingin menenangkan teman dengan hal yang memang dapat dilakukan.",
        dialogue: "Jadi sekarang bagaimana?",
        options: [
          option(
            "sekarang",
            "Aku belum tahu soal nanti. Sekarang kita bisa menemui pendamping bersama.",
            "{friend} melihat ke arah pendamping di balai.",
            "Tawarkan langkah nyata yang berada dalam jangkauanmu.",
            "pilihan",
            "Berbicara jujur",
          ),
          option(
            "panggil",
            "Aku bisa meminta pendamping ke sini kalau kamu ingin tetap duduk.",
            "{friend} ingin memilih tempat yang nyaman bersama pendamping.",
            "Tawarkan bantuan yang dapat kamu lakukan tanpa menjanjikan keadaan yang belum pasti.",
            "pilihan",
            "Memberi pilihan",
          ),
        ],
      },
      {
        id: "pilihan",
        stage: 3,
        title: "Tawarkan, lalu dengarkan",
        situation:
          "Pendamping berada tidak jauh dari kalian. Ada tempat duduk yang lebih tenang di dekatnya.",
        dialogue: "Aku bingung harus melakukan apa.",
        options: [
          option(
            "bersama",
            "Mau kita duduk dekat pendamping sambil pelan-pelan mengatur napas?",
            "{friend} ingin duduk dekat pendamping lebih dulu.",
            "Memberi pilihan sederhana membantu teman menyampaikan kebutuhannya. Latihan napas selalu boleh dilewati.",
            "hubungkan",
            "Memberi pilihan",
          ),
          option(
            "panggil",
            "Kamu mau aku memanggil pendamping ke sini?",
            "{friend} memilih tetap duduk sambil menunggu pendamping.",
            "Mencari bantuan tidak selalu berarti memindahkan teman. Dengarkan pilihannya.",
            "hubungkan",
            "Mencari bantuan",
          ),
        ],
      },
      {
        id: "hubungkan",
        stage: 4,
        title: "Kepedulian yang dibagi",
        situation:
          "Pendamping mendekat. Semangat {value} berarti saling membantu, termasuk meminta dukungan orang dewasa.",
        dialogue: "Bisa bantu aku menjelaskan ke pendamping?",
        options: [
          option(
            "izin",
            "Bisa. Apa yang ingin kamu sampaikan? Aku akan menemanimu.",
            "Kalian menyapa pendamping bersama. {friend} memilih kata-katanya sendiri.",
            "Teman tetap punya suara. Pendamping dapat membantu langkah selanjutnya.",
            "selesai",
            "Mencari bantuan",
          ),
          option(
            "pendamping",
            "Kita bisa bilang kamu ingin ditemani, tanpa menceritakan semua detail.",
            "Pendamping mengajak kalian duduk dan mendengarkan kebutuhan {friend}.",
            "Meminta bantuan tidak mengharuskan teman mengulang pengalaman yang belum ingin ia ceritakan.",
            "selesai",
            "Menghargai batas",
          ),
        ],
      },
      end(
        "Terima kasih sudah menemani. Aku ingin duduk bersama pendamping dulu.",
      ),
    ],
  },
  {
    id: "rindu-rumah",
    title: "Sepotong cerita tentang rumah",
    topic: "Mendengarkan & menghargai perasaan",
    icon: "home",
    description:
      "Dengarkan teman yang merindukan rumah dan sekolah. Beri ruang untuk bercerita, menggambar, atau beristirahat.",
    takeaway:
      "Rasa rindu tidak harus segera hilang. Kita bisa menghargainya, memberi pilihan, dan mencari dukungan bersama.",
    nodes: [
      {
        id: "sapa",
        stage: 1,
        title: "Gambar yang belum selesai",
        situation:
          "Di meja kegiatan {place}, {friend} memegang kertas dengan gambar rumah.",
        dialogue: "Aku kangen rumah dan teman sekolahku.",
        options: [
          option(
            "dengar",
            "Ada bagian rumah atau sekolah yang ingin kamu ceritakan? Boleh juga tidak.",
            "{friend} menunjuk gambar jendela.",
            "Undangan yang boleh ditolak memberi ruang bagi teman untuk memilih.",
            "kenangan",
            "Memberi pilihan",
          ),
          option(
            "alihkan",
            "Sudah, jangan dipikirkan. Kita main yang lain saja.",
            "{friend} menyimpan gambarnya dan menjadi lebih diam.",
            "Mengajak bermain boleh, tetapi dengarkan dulu apakah teman ingin bercerita atau melakukan hal lain.",
            "ruang",
            "Mendengarkan",
          ),
        ],
      },
      {
        id: "ruang",
        stage: 1,
        title: "Membuka percakapan kembali",
        situation:
          "Kamu bisa menawarkan pilihan tanpa menyuruh teman melupakan rasa rindunya.",
        dialogue: "Aku masih ingin memegang gambar ini.",
        options: [
          option(
            "boleh",
            "Boleh. Kamu mau aku mendengarkan atau duduk bersamamu saja?",
            "{friend} ingin menceritakan sedikit tentang gambarnya.",
            "Kita dapat menemani tanpa mengubah perasaan teman.",
            "kenangan",
            "Menghargai batas",
          ),
          option(
            "tunggu",
            "Boleh. Aku akan duduk di sini kalau kamu ingin ditemani.",
            "Setelah duduk sebentar, {friend} mulai bercerita tentang gambarnya.",
            "Beri waktu bagi teman untuk memulai percakapan dengan caranya sendiri.",
            "kenangan",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "kenangan",
        stage: 2,
        title: "Cerita kecil yang berarti",
        situation:
          "{friend} bercerita tentang tempat ia biasa menggambar sepulang sekolah.",
        dialogue: "Biasanya aku menggambar di dekat jendela rumah.",
        options: [
          option(
            "pantulkan",
            "Tempat itu berarti buatmu, ya. Aku senang kamu mau bercerita.",
            "{friend} menambahkan satu garis pada gambarnya.",
            "Menanggapi apa yang didengar menunjukkan bahwa kita memperhatikan.",
            "pilihan",
            "Mendengarkan",
          ),
          option(
            "hadir",
            "Aku di sini. Kita boleh diam sambil melihat gambarmu.",
            "Kalian duduk sebentar tanpa terburu-buru.",
            "Percakapan tidak harus terus diisi dengan pertanyaan.",
            "pilihan",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "pilihan",
        stage: 3,
        title: "Cara menyimpan rasa rindu",
        situation:
          "Ada kertas dan pensil lain di meja. Pendamping juga menyediakan tempat beristirahat.",
        dialogue: "Aku belum ingin ikut permainan ramai.",
        options: [
          option(
            "gambar",
            "Mau lanjut menggambar bersama? Kamu boleh berhenti kapan saja.",
            "{friend} memilih warna untuk gambarnya.",
            "Kegiatan sederhana bisa ditawarkan sebagai pilihan, tanpa memaksa teman melupakan perasaannya.",
            "hubungkan",
            "Memberi pilihan",
          ),
          option(
            "istirahat",
            "Kita bisa istirahat dulu dan bilang ke pendamping.",
            "{friend} ingin duduk di tempat yang lebih sepi bersama pendamping.",
            "Beristirahat juga pilihan yang boleh dihargai.",
            "hubungkan",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "hubungkan",
        stage: 4,
        title: "Ada yang bisa menemani",
        situation: "Pendamping mendekat untuk menanyakan kegiatan kalian.",
        dialogue: "Kalau nanti aku kangen lagi bagaimana?",
        options: [
          option(
            "dewasa",
            "Kamu boleh bilang ke orang dewasa yang kamu percaya. Aku juga bisa menemanimu mencari mereka.",
            "{friend} ingin menyimpan gambar dan menunjukkan kepada pendamping.",
            "Kepedulian dapat dibagi dengan orang dewasa. Kamu tidak harus menjawab semua kebutuhan teman sendirian.",
            "selesai",
            "Mencari bantuan",
          ),
          option(
            "pilih",
            "Kita bisa tanyakan ke pendamping siapa yang bisa menemani saat kamu ingin bercerita.",
            "Kalian menanyakan pilihan pendamping yang tersedia.",
            "Bantu teman mengenali dukungan yang benar-benar ada di sekitarnya.",
            "selesai",
            "Mencari bantuan",
          ),
        ],
      },
      end("Aku masih rindu. Sekarang aku tahu ada yang bisa mendengarkan."),
    ],
  },
  {
    id: "tenang-bersama",
    title: "Selangkah bersama pendamping",
    topic: "Keselamatan & dukungan",
    icon: "shield",
    description:
      "Ikuti arahan pendamping setelah guncangan berhenti, lalu temani adik yang masih merasa kaget di titik kumpul.",
    takeaway:
      "Utamakan keselamatan dan arahan pendamping. Setelah berada di tempat yang diarahkan, tawarkan dukungan tanpa memaksa.",
    nodes: [
      {
        id: "sapa",
        stage: 1,
        title: "Ikuti arahan yang ada",
        situation:
          "Guncangan sudah berhenti. Pendamping mengarahkan kalian melalui jalur yang sudah diperiksa menuju titik kumpul. {friend} terlihat kaget.",
        dialogue: "Aku bingung harus ke mana.",
        options: [
          option(
            "ikuti",
            "Kita ikuti pendamping dengan tertib. Aku bisa berjalan di dekatmu.",
            "{friend} memperhatikan pendamping dan ikut berjalan.",
            "Saat berpindah tempat, utamakan arahan keselamatan dari pendamping.",
            "dengar",
            "Mengikuti arahan",
          ),
          option(
            "barang",
            "Kita kembali mengambil barang dulu, yuk.",
            "Pendamping mengingatkan agar kalian tetap mengikuti jalur keluar.",
            "Barang dapat ditangani kemudian. Perhatikan kembali arahan keselamatan yang sedang diberikan.",
            "ruang",
            "Mengikuti arahan",
          ),
        ],
      },
      {
        id: "ruang",
        stage: 1,
        title: "Kembali pada arahan",
        situation: "Pendamping menunggu di jalur yang ditentukan.",
        dialogue: "Aku mau ikut pendamping saja.",
        options: [
          option(
            "bersama",
            "Iya, kita ikut pendamping dan beri tahu kalau butuh bantuan.",
            "Kalian kembali mengikuti kelompok.",
            "Mengubah pilihan setelah mendapat arahan adalah bagian dari belajar.",
            "dengar",
            "Mengikuti arahan",
          ),
          option(
            "bantuan",
            "Kita beri tahu pendamping bahwa kamu ingin berjalan di dekatnya.",
            "Pendamping mengajak kalian mengikuti kelompok bersama.",
            "Sampaikan kebutuhan kepada orang dewasa sambil tetap mengikuti arahan keselamatan.",
            "dengar",
            "Mencari bantuan",
          ),
        ],
      },
      {
        id: "dengar",
        stage: 2,
        title: "Di titik kumpul",
        situation:
          "Kalian sudah tiba bersama pendamping. {friend} masih menggenggam ujung bajunya.",
        dialogue: "Aku masih kaget tadi.",
        options: [
          option(
            "akui",
            "Aku mendengar kamu masih kaget. Mau duduk dekat pendamping?",
            "{friend} ingin duduk di samping pendamping.",
            "Dengarkan kebutuhan teman setelah mengikuti arahan keselamatan.",
            "pilihan",
            "Mendengarkan",
          ),
          option(
            "paksa",
            "Ayo cepat tenang supaya kita bisa main lagi.",
            "{friend} belum siap bermain.",
            "Setiap orang membutuhkan waktu berbeda. Coba tawarkan pilihan tanpa menyuruhnya cepat tenang.",
            "jeda",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "jeda",
        stage: 2,
        title: "Tidak terburu-buru",
        situation: "Temanmu ingin tetap dekat dengan orang dewasa.",
        dialogue: "Aku mau duduk dulu.",
        options: [
          option(
            "duduk",
            "Boleh. Kita bilang ke pendamping dan duduk di dekatnya.",
            "Pendamping memberi tempat untuk kalian duduk.",
            "Memberi waktu dan mencari dukungan adalah langkah yang dapat dilakukan bersama.",
            "pilihan",
            "Menghargai batas",
          ),
          option(
            "temani",
            "Aku bisa menemanimu diam sebentar di dekat pendamping.",
            "{friend} duduk dan memberi tanda kepada pendamping.",
            "Kehadiran yang tenang dapat ditawarkan tanpa memaksa teman berbicara.",
            "pilihan",
            "Menghargai batas",
          ),
        ],
      },
      {
        id: "pilihan",
        stage: 3,
        title: "Pilihan kecil",
        situation:
          "Pendamping sudah mengetahui keadaan kalian. Kamu menawarkan kegiatan yang boleh ditolak.",
        dialogue: "Sekarang aku ingin pelan-pelan dulu.",
        options: [
          option(
            "napas",
            "Mau mencoba tarik dan hembus napas pelan bersama? Kalau tidak nyaman, kita berhenti.",
            "{friend} ingin mencoba sebentar bersama pendamping.",
            "Tawarkan latihan sebagai pilihan. Tidak perlu menahan napas atau memaksakan ritme.",
            "hubungkan",
            "Memberi pilihan",
          ),
          option(
            "amati",
            "Mau melihat beberapa benda di sekitar sambil duduk?",
            "{friend} menunjuk benda yang ada di dekat kalian.",
            "Kegiatan mengamati sekitar dapat dilakukan dengan santai dan boleh dilewati.",
            "hubungkan",
            "Memberi pilihan",
          ),
        ],
      },
      {
        id: "hubungkan",
        stage: 4,
        title: "Sampaikan kebutuhan",
        situation: "Pendamping menanyakan apakah ada yang kalian perlukan.",
        dialogue: "Aku mau tetap dekat kakak pendamping.",
        options: [
          option(
            "sampaikan",
            "Yuk, kita sampaikan itu. Kamu boleh memilih ditemani orang dewasa.",
            "Pendamping mendengarkan dan mengatur agar {friend} tetap didampingi.",
            "Dukungan orang dewasa membantu agar tanggung jawab tidak dipikul anak sendirian.",
            "selesai",
            "Mencari bantuan",
          ),
          option(
            "panggil",
            "Aku bisa memanggil pendamping ke dekatmu. Kamu yang memilih mau bercerita atau diam dulu.",
            "Pendamping duduk bersama {friend} dan mendengarkan pilihannya.",
            "Mencari dukungan tetap bisa dilakukan sambil menghargai pilihan teman.",
            "selesai",
            "Memberi pilihan",
          ),
        ],
      },
      end(
        "Aku mau duduk dulu di sini bersama pendamping. Terima kasih sudah berjalan bersamaku.",
      ),
    ],
  },
  {
    id: "kabar-di-posko",
    title: "Dengar kabarnya, periksa bersama",
    topic: "Informasi & kepedulian",
    icon: "chat",
    description:
      "Temanmu mendengar kabar yang membuatnya takut. Latih cara mendengarkan dan memeriksa informasi kepada petugas.",
    takeaway:
      "Kita boleh mengakui rasa takut tanpa menganggap setiap kabar sudah benar. Tanyakan kepada petugas dan bagikan informasi yang sudah diperiksa.",
    nodes: [
      {
        id: "sapa",
        stage: 1,
        title: "Kabar yang beredar",
        situation:
          "Di {place}, {friend} mendengar bahwa semua orang harus segera pindah, tetapi sumber kabarnya belum jelas.",
        dialogue: "Katanya kita harus pergi sekarang. Aku takut!",
        options: [
          option(
            "dengar",
            "Kedengarannya kabar itu membuatmu takut. Dari mana kabarnya?",
            "{friend} mengatakan ia mendengarnya dari percakapan di dekat balai.",
            "Dengarkan perasaannya sambil mengenali sumber informasi.",
            "periksa",
            "Mendengarkan",
          ),
          option(
            "sebar",
            "Kita beri tahu semua orang sekarang juga.",
            "{friend} bertanya apakah kalian sudah tahu kabarnya benar.",
            "Menyebarkan kabar yang belum jelas dapat membuat orang lain ikut bingung. Kita bisa memeriksanya lebih dulu.",
            "ruang",
            "Memeriksa informasi",
          ),
        ],
      },
      {
        id: "ruang",
        stage: 1,
        title: "Berhenti sebelum membagikan",
        situation:
          "Belum ada arahan baru dari petugas yang mendampingi kalian.",
        dialogue: "Bagaimana kalau ternyata kabarnya berbeda?",
        options: [
          option(
            "tanya",
            "Kita tanyakan dulu ke petugas bersama, ya.",
            "{friend} ingin ikut bertanya.",
            "Memeriksa sumber membantu kita mengambil langkah berikutnya.",
            "periksa",
            "Memeriksa informasi",
          ),
          option(
            "pendamping",
            "Kita minta pendamping membantu memastikan kabarnya sebelum membagikannya.",
            "{friend} setuju mencari pendamping bersamamu.",
            "Meminta bantuan untuk memeriksa informasi juga merupakan langkah yang bertanggung jawab.",
            "periksa",
            "Mencari bantuan",
          ),
        ],
      },
      {
        id: "periksa",
        stage: 2,
        title: "Tanyakan kepada petugas",
        situation: "Petugas informasi berada bersama pendamping di meja posko.",
        dialogue: "Aku malu kalau bertanya sendiri.",
        options: [
          option(
            "temani",
            "Aku bisa menemanimu. Kita bilang ingin memastikan arahan terbaru.",
            "Kalian menyapa petugas dan menyampaikan pertanyaan singkat.",
            "Menemani teman bertanya adalah bentuk saling membantu dalam semangat {value}.",
            "dengar-arahan",
            "Mencari bantuan",
          ),
          option(
            "pendamping",
            "Kita minta pendamping membantu menyampaikan pertanyaanmu.",
            "Pendamping membantu menanyakan informasi terbaru.",
            "Kita boleh meminta orang dewasa membantu saat belum nyaman bertanya sendiri.",
            "dengar-arahan",
            "Mencari bantuan",
          ),
        ],
      },
      {
        id: "dengar-arahan",
        stage: 3,
        title: "Dengarkan penjelasannya",
        situation:
          "Dalam cerita ini, petugas menjelaskan belum ada arahan pindah. Jika ada perubahan, petugas akan menyampaikannya melalui pendamping.",
        dialogue: "Jadi kita menunggu arahan pendamping, ya?",
        options: [
          option(
            "arahan",
            "Iya. Kalau ada kabar lain, kita periksa lagi ke petugas.",
            "{friend} mengetahui siapa yang bisa ditanya.",
            "Ikuti arahan petugas yang bertanggung jawab. Jangan menganggap contoh cerita ini sebagai informasi kejadian nyata.",
            "bagikan",
            "Memeriksa informasi",
          ),
          option(
            "pastikan",
            "Kita tanyakan cara menerima pengumuman berikutnya supaya tidak bingung.",
            "Petugas menunjukkan tempat pengumuman dan pendamping yang dapat ditanya.",
            "Mengetahui sumber pengumuman membantu teman memeriksa kabar berikutnya.",
            "bagikan",
            "Memeriksa informasi",
          ),
        ],
      },
      {
        id: "bagikan",
        stage: 4,
        title: "Berbagi dengan hati-hati",
        situation: "Teman lain menanyakan kabar yang kalian dengar sebelumnya.",
        dialogue: "Apa yang sebaiknya kita katakan?",
        options: [
          option(
            "sumber",
            "Tadi kita sudah bertanya ke petugas. Yuk, dengarkan arahan terbaru lewat pendamping.",
            "Kalian menunjukkan tempat bertanya tanpa menambahkan kabar baru.",
            "Sebutkan sumber dan arahkan orang lain ke informasi yang dapat diperiksa.",
            "selesai",
            "Berbagi dengan hati-hati",
          ),
          option(
            "koreksi",
            "Kabar tadi belum jelas. Sebaiknya kita tanyakan ke petugas, bukan meneruskannya.",
            "Teman lain ikut bertanya kepada pendamping.",
            "Mengoreksi kabar dengan tenang membantu menjaga percakapan tetap jelas.",
            "selesai",
            "Berbagi dengan hati-hati",
          ),
        ],
      },
      end(
        "Sekarang aku tahu harus bertanya ke siapa kalau ada kabar yang membuatku bingung.",
      ),
    ],
  },
];

export function getRoleplayScenario(id: string) {
  return ROLEPLAY_SCENARIOS.find((scenario) => scenario.id === id);
}

/** Replay the actual graph: foreign options, skipped nodes and post-ending answers are invalid. */
export function replayRoleplay(scenarioId: string, answers: unknown) {
  const scenario = getRoleplayScenario(scenarioId);
  if (
    !scenario ||
    !Array.isArray(answers) ||
    answers.length > ROLEPLAY_MAX_ANSWERS
  )
    return null;
  let node = scenario.nodes[0];
  const skills = new Set<string>();
  for (const answer of answers) {
    if (
      !answer ||
      typeof answer !== "object" ||
      answer.nodeId !== node.id ||
      typeof answer.optionId !== "string"
    )
      return null;
    const selected = node.options.find((item) => item.id === answer.optionId);
    if (!selected) return null;
    const next = scenario.nodes.find((item) => item.id === selected.next);
    if (!next) return null;
    skills.add(selected.skill);
    node = next;
  }
  return {
    scenario,
    node,
    completed: node.options.length === 0,
    skills: Array.from(skills),
  };
}

export function isRoleplayRun(value: unknown): value is RoleplayRun {
  if (!value || typeof value !== "object") return false;
  const run = value as RoleplayRun;
  return (
    typeof run.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      run.id,
    ) &&
    run.version === ROLEPLAY_VERSION &&
    (run.culture === "aceh" || run.culture === "kalimantan") &&
    (run.ownerId === null ||
      (typeof run.ownerId === "string" && run.ownerId.length <= 100)) &&
    Number.isInteger(run.activeMs) &&
    run.activeMs >= 0 &&
    run.activeMs <= 86400000 &&
    Number.isFinite(run.updatedAt) &&
    typeof run.scenarioId === "string" &&
    replayRoleplay(run.scenarioId, run.answers) !== null
  );
}

export function roleplayText(text: string, culture: RoleplayCulture): string {
  const context =
    culture === "kalimantan"
      ? {
          friend: "Lala",
          place: "balai warga dekat Rumah Betang",
          value: "Handep, saling membantu",
        }
      : {
          friend: "Rafi",
          place: "balai gampong dekat meunasah",
          value: "Meuseuraya, saling membantu",
        };
  return text.replace(
    /\{(friend|place|value)\}/g,
    (_, key: keyof typeof context) => context[key],
  );
}
