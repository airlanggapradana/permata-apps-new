export type SurvivalTopicId =
  | "earthquake"
  | "tsunami"
  | "flood"
  | "landslide"
  | "fire"
  | "first-aid";

export interface PhysicalGuide {
  id: SurvivalTopicId;
  title: string;
  shortLabel: string;
  summary: string;
  immediateSteps: string[];
  firstAidSteps: string[];
  avoidList: string[];
  seekHelpSigns: string[];
}

export interface PfaPrinciple {
  step: number;
  code: string;
  title: string;
  description: string;
  practicalActions: string[];
}

export interface PsychologicalScenario {
  id: string;
  title: string;
  situation: string;
  forSelf: string[];
  forChildOrPeer: string[];
  culturalNoteAceh: string;
  culturalNoteKalimantan: string;
}

export interface GroundingStep {
  count: number;
  sense: string;
  prompt: string;
  example: string;
}

export interface GoBagItem {
  id: string;
  label: string;
  category: "Keselamatan" | "Kesehatan" | "Dokumen & Komunikasi";
  note: string;
}

export interface EmergencyNumber {
  number: string;
  dialHref: string;
  agency: string;
  scope: string;
  note: string;
}

export const PHYSICAL_GUIDES: PhysicalGuide[] = [
  {
    id: "earthquake",
    title: "Gempa Bumi",
    shortLabel: "Gempa",
    summary:
      "Lindungi kepala dan leher segera saat guncangan terasa. Jangan panik berlari keluar ketika bangunan masih berguncang hebat.",
    immediateSteps: [
      "Berlutut rendah di lantai, berlindung di bawah meja yang kokoh, dan berpegangan erat pada kaki meja sampai guncangan berhenti.",
      "Jika tidak ada meja, merunduk di dekat dinding bagian dalam ruangan, jauh dari jendela kaca, cermin, lemari tinggi, dan lampu gantung.",
      "Apabila berada di luar ruangan, menjauh ke area terbuka yang bebas dari tiang listrik, pohon tinggi, baliho, dan bangunan bertingkat.",
      "Jika sedang di dalam kendaraan, menepi perlahan di tempat terbuka (jauh dari jembatan dan kabel listrik) dan tetap di dalam mobil sampai guncangan reda.",
      "Setelah guncangan berhenti, keluar melalui tangga darurat secara tertib. Jangan gunakan lift.",
    ],
    firstAidSteps: [
      "Periksa diri dan orang di sekitar dari luka akibat pecahan kaca atau tertimpa benda jatuh sebelum bergerak jauh.",
      "Jika ada luka berdarah ringan, tekan lembut luka memakai kain bersih atau kasa selama beberapa menit hingga perdarahan melambat.",
      "Bila mencium bau gas atau melihat kabel listrik putus, segera keluar dari bangunan dan matikan sakelar utama listrik hanya jika posisi aman.",
      "Waspadai gempa susulan dengan tetap berada di titik kumpul terbuka dan gunakan alas kaki untuk melindungi telapak kaki dari puing.",
    ],
    avoidList: [
      "Jangan menggunakan lift saat atau sesudah gempa terjadi.",
      "Jangan berdiri tepat di bawah kusen pintu bangunan tua atau di dekat tembok pagar luar.",
      "Jangan menyalakan korek api atau lilin di dalam ruangan sebelum yakin tidak ada kebocoran gas.",
      "Jangan kembali masuk ke rumah yang dindingnya retak parah sebelum diperiksa petugas atau orang dewasa yang paham struktur.",
    ],
    seekHelpSigns: [
      "Sesak napas akibat debu reruntuhan atau tertimpa benda berat di dada dan perut.",
      "Perdarahan yang tidak berhenti setelah ditekan kain bersih selama 10 menit.",
      "Pusing hebat, muntah, atau kehilangan kesadaran setelah kepala terbentur.",
    ],
  },
  {
    id: "tsunami",
    title: "Tsunami & Pesisir",
    shortLabel: "Tsunami",
    summary:
      "Jika gempa terasa kuat atau lama di wilayah pesisir, segera mengungsi ke dataran tinggi tanpa menunggu sirine atau pengumuman resmi.",
    immediateSteps: [
      "Kenali tiga tanda alam utama: gempa bumi kuat atau berlangsung lebih dari 20 detik, air laut surut mendadak jauh dari bibir pantai, atau terdengar suara gemuruh keras dari arah laut.",
      "Segera bergerak menjauhi pantai menuju bukit, dataran tinggi, atau gedung evakuasi vertikal yang kokoh (minimal lantai 3 ke atas).",
      "Berjalan atau berlari dengan tenang mengikuti rambu jalur evakuasi. Tinggalkan barang bawaan berat yang memperlambat langkah.",
      "Bantu anak kecil, lansia, dan penyandang disabilitas bergerak lebih dulu ke tempat aman.",
      "Tetap bertahan di dataran tinggi karena gelombang tsunami sering datang dalam beberapa rangkaian, dan gelombang berikutnya bisa lebih besar.",
    ],
    firstAidSteps: [
      "Jika seseorang sempat terseret arus, periksa jalan napas dan respons kesadaran di tempat yang sudah benar-benar aman dan tinggi.",
      "Lepaskan pakaian yang basah kuyup dan dinginkan risiko hipotermia dengan selimut, handuk kering, atau jaket.",
      "Bersihkan luka gores akibat karang atau puing dengan air bersih matang atau air mineral kemasan jika tersedia, lalu tutup dengan kain bersih.",
    ],
    avoidList: [
      "Jangan pergi ke pantai untuk melihat air laut yang surut atau mengambil ikan yang terdampar.",
      "Jangan menggunakan kendaraan pribadi di jalan sempit dekat pantai jika berisiko macet; berjalan kaki lebih cepat mencapai titik tinggi.",
      "Jangan turun kembali ke kawasan pesisir sebelum ada pernyataan resmi aman dari otoritas setempat (BPBD/BMKG).",
    ],
    seekHelpSigns: [
      "Korban tersedak air laut, batuk terus-menerus, napas berbunyi, atau tampak kebiruan di bibir.",
      "Menggigil hebat tak terkendali, bicara melantur, atau sangat lemas akibat kedinginan.",
      "Luka dalam atau robek lebar yang terkontaminasi lumpur dan air laut.",
    ],
  },
  {
    id: "flood",
    title: "Banjir & Banjir Bandang",
    shortLabel: "Banjir",
    summary:
      "Utamakan evakuasi ke tempat lebih tinggi dan hindari kontak dengan arus air deras maupun instalasi listrik yang terendam.",
    immediateSteps: [
      "Matikan aliran listrik dari MCB/sekering utama dan tutup katup tabung gas sebelum air masuk ke dalam rumah, hanya jika tangan dan lantai sekitar panel masih kering.",
      "Pindahkan anak, lansia, obat-obatan rutin, dan dokumen penting ke lantai atas atau titik evakuasi yang lebih tinggi.",
      "Jika air naik cepat atau terdengar gemuruh dari arah hulu sungai (tanda banjir bandang), segera tinggalkan rumah menuju dataran tinggi.",
      "Gunakan alas kaki tertutup (sepatu bot atau sandal bertali) agar kaki terlindungi dari benda tajam dan kabel tersembunyi.",
    ],
    firstAidSteps: [
      "Segera ganti pakaian basah setelah tiba di posko atau tempat aman untuk menjaga suhu tubuh anak tetap hangat.",
      "Cuci kulit yang terkena air banjir memakai sabun dan air bersih untuk mencegah infeksi kulit dan diare.",
      "Pastikan anak hanya minum air kemasan tersegel atau air yang sudah direbus mendidih penuh.",
    ],
    avoidList: [
      "Jangan berjalan, berenang, atau menerobos arus banjir yang bergerak cepat; air setinggi betis yang mengalir deras sudah mampu menjatuhkan orang dewasa.",
      "Jangan menyentuh peralatan listrik, tiang lampu jalan, atau kabel yang terjatuh di sekitar genangan air.",
      "Jangan membiarkan anak bermain di selokan, gorong-gorong, atau pinggir sungai selama banjir berlangsung.",
    ],
    seekHelpSigns: [
      "Anak mengalami demam tinggi, muntah berulang, atau diare cair terus-menerus setelah terpapar banjir.",
      "Kulit pucat, bibir dingin, atau menggigil berat pada bayi dan anak kecil.",
      "Luka terbuka yang bengkak, memerah, atau bernanah setelah kontak dengan air kotor.",
    ],
  },
  {
    id: "landslide",
    title: "Tanah Longsor",
    shortLabel: "Longsor",
    summary:
      "Waspadai tanda retakan tanah saat hujan deras berkepanjangan dan segera evakuasi menyamping menjauhi jalur luncuran.",
    immediateSteps: [
      "Kenali tanda bahaya di lereng: muncul retakan baru di tanah atau dinding rumah, pintu/jendela mendadak macet, air sumur atau mata air tiba-tiba keruh, serta suara gemuruh atau pohon berderak.",
      "Segera tinggalkan rumah di bawah tebing atau di tepi lereng ketika hujan deras turun berjam-jam.",
      "Saat material longsor mulai bergerak, lari menyamping (tegak lurus) menjauhi jalur aliran tanah dan batu, bukan lari searah turunan lembah.",
      "Jika tidak sempat menjauh, lindungi kepala dan bagian belakang leher dengan kedua tangan atau tas.",
    ],
    firstAidSteps: [
      "Pindahkan korban ke tanah datar yang jauh dari tebing sebelum memeriksa luka.",
      "Bersihkan lumpur atau tanah dari area mulut dan hidung korban secara hati-hati agar jalur napas terbuka.",
      "Jika ada dugaan cedera leher, punggung, atau tulang belakang karena tertimbun, jangan mengangkat korban dengan cara menekuk tubuhnya; tunggu bantuan tim SAR jika kondisi lokasi stabil.",
    ],
    avoidList: [
      "Jangan mendekati area bekas longsor untuk mencari barang karena longsor susulan sering terjadi beberapa menit hingga jam kemudian.",
      "Jangan berteduh di bawah tebing curam atau di dalam bangunan yang sudah miring.",
      "Jangan memindahkan korban yang tertimbun setengah badan dengan menarik paksa secara tiba-tiba bila tidak mengancam nyawa langsung.",
    ],
    seekHelpSigns: [
      "Korban sulit bernapas karena menghirup debu/lumpur atau dadanya sempat tertekan material tanah.",
      "Nyeri hebat di leher, punggung, atau anggota gerak tidak bisa digerakkan.",
      "Ada anggota keluarga yang masih belum ditemukan atau terjebak di dalam bangunan.",
    ],
  },
  {
    id: "fire",
    title: "Kebakaran & Asap Tebal",
    shortLabel: "Kebakaran",
    summary:
      "Udara bersih dan lebih dingin berada di dekat lantai. Merangkaklah keluar dengan tenang dan jangan pernah kembali ke dalam ruangan yang terbakar.",
    immediateSteps: [
      "Teriak memberi tahu penghuni lain dan segera keluar menuju titik kumpul terbuka di luar bangunan.",
      "Jika ruangan dipenuhi asap, merangkak rendah dengan posisi kepala sekitar 30 hingga 50 cm di atas lantai untuk menghindari asap panas beracun.",
      "Tutup hidung dan mulut menggunakan kain, baju, atau handuk yang dibasahi air.",
      "Sebelum membuka pintu tertutup, sentuh gagang atau daun pintu dengan punggung tangan. Jika terasa panas, jangan dibuka; cari jendela atau jalur keluar lain dan tutup celah bawah pintu dengan kain basah.",
      "Apabila pakaian terbakar, terapkan langkah Berhenti, Jatuhkan Diri, dan Berguling (Stop, Drop, Roll) sambil menutupi wajah dengan kedua tangan.",
    ],
    firstAidSteps: [
      "Untuk luka bakar ringan hingga sedang, dinginkan area luka dengan air bersih mengalir suhu ruang selama 10 sampai 20 menit.",
      "Lepaskan perlahan perhiasan, jam tangan, atau pakaian yang tidak menempel pada kulit di sekitar luka bakar sebelum area tersebut membengkak.",
      "Tutup luka bakar secara longgar menggunakan kain bersih yang tidak berserat atau plastik bersih.",
    ],
    avoidList: [
      "Jangan mengoleskan pasta gigi, mentega, minyak goreng, kecap, atau es batu langsung ke luka bakar karena memperparah kerusakan jaringan.",
      "Jangan memecahkan lepuhan kulit yang terbentuk pada luka bakar.",
      "Jangan berlari saat pakaian terbakar karena angin membuat api membesar.",
      "Jangan kembali masuk ke bangunan untuk menyelamatkan barang berharga atau dokumen.",
    ],
    seekHelpSigns: [
      "Suara serak, batuk berjelaga hitam, bulu hidung terbakar, atau sesak napas setelah menghirup asap.",
      "Luka bakar mengenai wajah, tangan, kaki, alat kelamin, atau ukurannya lebih lebar dari telapak tangan korban.",
      "Kulit tampak putih pucat, hangus, atau mati rasa (tanda luka bakar derajat dalam).",
    ],
  },
  {
    id: "first-aid",
    title: "Pertolongan Pertama Fisik Dasar",
    shortLabel: "P3K Awal",
    summary:
      "Langkah penanganan awal yang aman untuk cedera umum di lokasi bencana atau posko sementara sebelum tenaga medis tiba.",
    immediateSteps: [
      "Pastikan lokasi sekitar aman bagi penolong dan korban sebelum mendekat (aman diri, aman lingkungan, aman korban).",
      "Cuci tangan atau gunakan sarung tangan bersih / kantong plastik bersih sebagai pelindung bila membantu luka terbuka.",
      "Utamakan memeriksa tiga hal utama: kesadaran korban, kelancaran jalan napas, dan ada tidaknya perdarahan hebat.",
      "Beri minum air bersih hanya jika korban dalam keadaan sadar penuh, tidak muntah, dan tidak cedera perut berat.",
    ],
    firstAidSteps: [
      "Luka berdarah: tekan langsung area luka dengan kain bersih secara mantap. Jika darah menembus kain pertama, tambahkan kain baru di atasnya tanpa melepas kain pertama.",
      "Keseleo atau dugaan patah tulang: istirahatkan bagian tubuh yang nyeri pada posisi nyaman saat ditemukan, beri penyangga sementara (bantal/kardus/kain), dan jangan diurut.",
      "Pingsan akibat kelelahan atau panas: baringkan di tempat teduh dan sejuk, longgarkan kerah atau ikat pinggang, dan angkat kedua kaki sedikit lebih tinggi sekitar 20 sampai 30 cm jika tidak ada cedera kepala/leher.",
      "Dehidrasi ringan pada anak: berikan air putih bersih atau oralit sedikit demi sedikit tetapi sering.",
    ],
    avoidList: [
      "Jangan memijat atau menarik bagian tubuh yang dicurigai patah tulang.",
      "Jangan mencabut benda tajam yang menancap dalam pada tubuh; cukup stabilkan posisinya dan segera cari pertolongan medis.",
      "Jangan memaksa korban yang setengah sadar atau pingsan untuk minum air.",
    ],
    seekHelpSigns: [
      "Korban tidak merespons saat dipanggil atau ditepuk bahunya dengan lembut.",
      "Napas tampak sangat cepat, tersengal, atau berhenti.",
      "Anak tampak sangat lemas, mata cekung, dan tidak buang air kecil lebih dari 6 jam.",
    ],
  },
];

export const PFA_PRINCIPLES: PfaPrinciple[] = [
  {
    step: 1,
    code: "LIHAT",
    title: "Amati Keselamatan dan Kebutuhan Mendesak",
    description:
      "Pastikan diri sendiri dan anak berada di zona aman terlebih dahulu sebelum membicarakan perasaan atau kronologi kejadian.",
    practicalActions: [
      "Periksa apakah ada bahaya fisik terdekat, luka yang belum tertangani, atau anak yang terpisah dari orang tua.",
      "Penuhi kebutuhan dasar terlebih dahulu: air minum, pakaian kering, selimut, dan tempat duduk yang tenang.",
      "Amati reaksi stres berat seperti membeku diam, menangis panik, gemetar hebat, atau kebingungan arah.",
    ],
  },
  {
    step: 2,
    code: "DENGARKAN",
    title: "Hadir Tenang Tanpa Memaksa Bercerita",
    description:
      "Mendengarkan dengan sabar jauh lebih menenangkan daripada memberi banyak nasihat atau meminta anak mengulang detail peristiwa yang menakutkan.",
    practicalActions: [
      "Sejajarkan posisi tubuh dengan tinggi mata anak agar ia merasa aman dan tidak terintimidasi.",
      "Gunakan kalimat pendek yang lembut: 'Kamu aman sekarang, aku di sini menemanimu.'",
      "Ajak melakukan latihan napas tenang atau grounding 5-4-3-2-1 jika tubuh terasa gemetar atau dada sesak.",
      "Biarkan anak memilih untuk bercerita, menggambar, atau diam sejenak tanpa desakan.",
    ],
  },
  {
    step: 3,
    code: "HUBUNGKAN",
    title: "Sambungkan ke Keluarga dan Layanan Nyata",
    description:
      "Pemulihan awal berjalan lebih kuat saat penyintas terhubung kembali dengan keluarga, orang dewasa tepercaya, atau posko layanan resmi.",
    practicalActions: [
      "Bantu anak menghubungi orang tua, wali, atau guru pendamping menggunakan informasi di Kartu Keselamatan Keluarga.",
      "Arahkan ke petugas posko, relawan terlatih, atau layanan kesehatan jiwa Healing119 (119 ekstensi 8) jika reaksi stres berlanjut.",
      "Hindari menjanjikan hal yang belum pasti; jelaskan langkah konkret berikutnya dengan jujur dan ramah anak.",
    ],
  },
];

export const PSYCHOLOGICAL_SCENARIOS: PsychologicalScenario[] = [
  {
    id: "panic-hyperventilation",
    title: "Serangan Panik, Jantung Berdebar, dan Napas Cepat",
    situation:
      "Tubuh bereaksi otomatis terhadap ancaman sehingga napas menjadi pendek, tangan dingin atau kesemutan, dan pikiran terasa berpacu.",
    forSelf: [
      "Tempelkan kedua telapak kaki rata ke lantai atau tanah. Rasakan pijakan yang menopang tubuhmu.",
      "Gunakan alat Latihan Napas 4-4-6 di halaman ini: tarik napas 4 detik, tahan 4 detik, hembuskan perlahan 6 detik.",
      "Ucapkan dalam hati secara perlahan: 'Guncangan sudah berhenti. Saat ini aku berada di tempat yang aman.'",
    ],
    forChildOrPeer: [
      "Bicara dengan suara pelan dan ritme lambat; anak sering meniru ketenangan nada suara pendampingnya.",
      "Ajak anak meniup telapak tangan atau meniup imajinasi baling-baling kertas perlahan untuk memanjangkan hembusan napas.",
      "Jangan katakan 'Jangan takut' atau 'Jangan menangis'; katakan 'Wajar kamu kaget, ayo kita tarik napas pelan bersama.'",
    ],
    culturalNoteAceh:
      "Dalam semangat Meuseuraya, kita tidak harus memikul rasa takut sendirian; duduk bersama keluarga atau warga gampong di posko membantu hati kembali tenang.",
    culturalNoteKalimantan:
      "Filosofi Handep mengingatkan bahwa rasa takut sesaat adalah wajar; di bawah atap Rumah Betang kita saling menopang dan menguatkan untuk bangkit kembali.",
  },
  {
    id: "freeze-shock",
    title: "Syok, Diam Membeku, atau Sulit Berbicara",
    situation:
      "Sebagian anak atau remaja justru tampak sangat diam, tatapannya kosong, atau sulit menjawab pertanyaan setelah peristiwa mengejutkan.",
    forSelf: [
      "Mulailah dengan gerakan kecil yang aman: goyangkan jari tangan perlahan, minum seteguk air putih, atau pegang benda bertekstur di sekitar.",
      "Gunakan panduan Grounding 5-4-3-2-1 untuk mengembalikan kesadaran ke momen saat ini.",
    ],
    forChildOrPeer: [
      "Jangan mengguncang bahu atau membentak agar anak merespons cepat.",
      "Berikan selimut hangat atau benda familiar (boneka, jaket, botol minum) agar ia memiliki jangkar rasa aman.",
      "Tawarkan pilihan sederhana yang mudah dijawab dengan anggukan, misalnya: 'Mau duduk di sebelah sini atau minum air dulu?'",
    ],
    culturalNoteAceh:
      "Pendekatan Peumulia Jamee dan kasih sayang keluarga di meunasah menjaga martabat anak dengan kesabaran tanpa paksaan.",
    culturalNoteKalimantan:
      "Kehangatan ruang keluarga di Rumah Betang dan tutur tenang sesepuh adat memberi ruang hening yang aman bagi anak hingga siap berbicara kembali.",
  },
  {
    id: "separated-child",
    title: "Anak Terpisah dari Orang Tua atau Takut Gelap di Pengungsian",
    situation:
      "Suasana tenda pengungsian yang ramai, gelap saat listrik padam, dan ketidakpastian membuat anak sangat cemas kehilangan pendamping.",
    forSelf: [
      "Jika kamu anak atau remaja dan terpisah dari keluarga, segera datangi petugas berseragam (BPBD, TNI/Polri, PMI, relawan posko) atau ibu-ibu pengelola posko.",
      "Tunjukkan catatan nama orang tua, alamat asal, dan nomor wali jika tersimpan di perangkat atau kertas saku.",
    ],
    forChildOrPeer: [
      "Catat identitas anak dan nama wali yang dicari, lalu laporkan langsung ke posko resmi / meja pendataan reunifikasi setempat.",
      "Tetapkan satu orang dewasa pendamping yang konsisten mendampingi anak di area yang terang dan aman sampai wali terverifikasi tiba.",
      "Beri rutinitas singkat sebelum tidur di posko, seperti doa bersama, cerita pendek yang menenangkan, atau latihan napas.",
    ],
    culturalNoteAceh:
      "Tradisi meuseuraya memastikan setiap anak di gampong dijaga bersama oleh komunitas sampai berkumpul lagi dengan orang tuanya.",
    culturalNoteKalimantan:
      "Semangat persaudaraan Betang memastikan setiap anak diperlakukan layaknya keluarga sendiri, dilindungi bersama oleh komunitas hingga bertemu orang tuanya.",
  },
  {
    id: "aftershock-insomnia",
    title: "Takut Tidur dan Terbayang Kejadian Terus-Menerus",
    situation:
      "Suara keras sedikit saja memicu rasa kaget berulang, sulit memejamkan mata, atau mimpi buruk beberapa hari setelah bencana.",
    forSelf: [
      "Kurangi membaca atau mendengar kabar simpang siur yang tidak berasal dari sumber resmi.",
      "Siapkan tas siaga dan alas kaki di dekat tempat tidur agar pikiran merasa lebih siap dan tidak perlu terus berjaga.",
      "Lakukan tiga siklus napas 4-4-6 sebelum beristirahat.",
    ],
    forChildOrPeer: [
      "Jelaskan dengan bahasa jujur sesuai usia bahwa reaksi kaget setelah bencana adalah cara tubuh melindungi diri, dan perlahan akan membaik.",
      "Libatkan anak dalam aktivitas rutin ringan di siang hari seperti membantu merapikan tempat tidur atau menggambar.",
      "Jika anak tidak mau makan, tampak sangat putus asa, atau membicarakan keinginan menyakiti diri, segera hubungi tenaga kesehatan atau Healing119 (119 ext 8).",
    ],
    culturalNoteAceh:
      "Sebagaimana pepatah Aceh 'Peugah hal nyang na, peubuet nyang baik', kejujuran yang menenangkan membantu anak memahami situasi tanpa ketakutan berlebih.",
    culturalNoteKalimantan:
      "Dalam ketenangan alam Borneo dan lingkaran kebersamaan, saling bercerita dengan nada tenang membantu mengurai beban pikiran di malam hari.",
  },
];

export const GROUNDING_STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: "Dilihat",
    prompt: "Sebutkan 5 benda di sekitarmu yang bisa kamu lihat dengan jelas.",
    example: "Misalnya: atap tenda, botol air, sepatu, pohon, atau tas.",
  },
  {
    count: 4,
    sense: "Disentuh",
    prompt: "Rasakan 4 benda yang sedang menyentuh kulit atau tanganmu.",
    example: "Misalnya: telapak kaki di lantai, kain baju, botol minum, atau tangan pendamping.",
  },
  {
    count: 3,
    sense: "Didengar",
    prompt: "Dengarkan 3 suara yang paling dekat maupun agak jauh saat ini.",
    example: "Misalnya: embusan angin, suara langkah kaki, atau suara napasmu sendiri.",
  },
  {
    count: 2,
    sense: "Dihirup",
    prompt: "Sadari 2 aroma atau kesegaran udara yang tercium pelan-pelan.",
    example: "Misalnya: udara luar, aroma tanah basah, atau aroma minyak kayu putih.",
  },
  {
    count: 1,
    sense: "Satu Hal Baik / Doa",
    prompt: "Ucapkan 1 kalimat penguat atau doa singkat untuk dirimu saat ini.",
    example: "Misalnya: 'Aku sudah melakukan langkah aman, dan aku tidak sendirian.'",
  },
];

export const GO_BAG_ITEMS: GoBagItem[] = [
  {
    id: "water",
    label: "Air minum kemasan (minimal 2 liter per orang)",
    category: "Kesehatan",
    note: "Prioritas utama untuk mencegah dehidrasi 24 sampai 72 jam pertama.",
  },
  {
    id: "food",
    label: "Makanan tahan lama siap santap (biskuit, kurma, makanan kaleng)",
    category: "Kesehatan",
    note: "Pilih yang tidak perlu dimasak dengan api atau listrik.",
  },
  {
    id: "first-aid-kit",
    label: "Kotak P3K dasar (kasa steril, plester, antiseptik, gunting kecil)",
    category: "Kesehatan",
    note: "Tambahkan obat rutin pribadi atau inhaler anak jika diperlukan.",
  },
  {
    id: "flashlight",
    label: "Senter LED dan baterai cadangan",
    category: "Keselamatan",
    note: "Lebih aman daripada lilin saat listrik padam dan ada risiko gas bocor.",
  },
  {
    id: "whistle",
    label: "Peluit darurat",
    category: "Keselamatan",
    note: "Menghemat tenaga untuk meminta pertolongan dibanding berteriak terus-menerus.",
  },
  {
    id: "mask",
    label: "Masker bersih dan kain penutup hidung",
    category: "Kesehatan",
    note: "Melindungi saluran napas dari debu reruntuhan, asap, dan abu vulkanik.",
  },
  {
    id: "clothes",
    label: "Pakaian ganti kering, selimut tipis, dan jas hujan",
    category: "Keselamatan",
    note: "Mencegah kedinginan pada anak dan lansia di malam hari.",
  },
  {
    id: "documents",
    label: "Salinan dokumen penting dalam plastik kedap air (KK, KTP, KIA, kartu BPJS)",
    category: "Dokumen & Komunikasi",
    note: "Mempermudah pendataan posko, bantuan medis, dan reunifikasi keluarga.",
  },
  {
    id: "emergency-notes",
    label: "Catatan tertulis nomor telepon keluarga dan golongan darah",
    category: "Dokumen & Komunikasi",
    note: "Tetap bisa dibaca saat baterai ponsel habis total.",
  },
  {
    id: "powerbank",
    label: "Powerbank terisi penuh dan uang tunai secukupnya",
    category: "Dokumen & Komunikasi",
    note: "Mesin ATM dan pembayaran digital sering tidak berfungsi saat listrik padam.",
  },
];

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    number: "112",
    dialHref: "tel:112",
    agency: "Layanan Darurat Nasional 112",
    scope: "Nasional (Pemda terintegrasi)",
    note: "Nomor darurat terpadu bebas pulsa untuk kondisi gawat darurat umum.",
  },
  {
    number: "117",
    dialHref: "tel:117",
    agency: "BNPB (Call Center Kebencanaan)",
    scope: "Nasional",
    note: "Informasi dan pelaporan kejadian bencana serta koordinasi posko.",
  },
  {
    number: "115",
    dialHref: "tel:115",
    agency: "BASARNAS (Pencarian & Pertolongan)",
    scope: "Nasional",
    note: "Evakuasi korban terjebak, longsor, banjir bandang, atau bencana perairan.",
  },
  {
    number: "119 (ekstensi 8)",
    dialHref: "tel:119",
    agency: "Kemenkes 119 & Healing119",
    scope: "Nasional (24 jam)",
    note: "Layanan ambulans gawat darurat (119) serta konseling kesehatan jiwa Healing119 (ekstensi 8).",
  },
  {
    number: "113",
    dialHref: "tel:113",
    agency: "Pemadam Kebakaran",
    scope: "Nasional / Daerah",
    note: "Penanganan kebakaran bangunan, penyelamatan terjepit, dan kebocoran gas.",
  },
  {
    number: "110",
    dialHref: "tel:110",
    agency: "Kepolisian RI",
    scope: "Nasional",
    note: "Keamanan darurat, pengaturan jalur evakuasi, dan pelaporan orang hilang.",
  },
];
