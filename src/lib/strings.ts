// All kid-facing UI copy in Bahasa Indonesia. Centralized — see specs §17.
export const strings = {
  appName: "LabMatematika",
  tagline: "Latih, uji, kuasai.",

  // Navigation / sections
  beranda: "Beranda",
  petaKeahlian: "Peta Keahlian",
  penguasaan: "Penguasaan",
  progres: "Progres",
  misiHarian: "Misi harian",

  // Modes (§3)
  diagnostik: "Diagnostik",
  latihanTerarah: "Latihan Terarah",
  ujian: "Ujian Kenaikan Level",

  // Mastery bands (§5)
  belumDikuasai: "Belum dikuasai",
  sedangDilatih: "Sedang dilatih",
  dikuasai: "Dikuasai",

  // Quiz
  soalDari: (n: number, total = 10) => `Soal ${n} dari ${total}`,
  benar: "Benar!",
  belumTepat: "Belum tepat",
  yangBenar: (x: number) => `Yang benar ${x}`,
  lihatCaranya: "Lihat caranya",
  hapus: "Hapus",
  cekJawaban: "Cek Jawaban",

  // Exam (§3.3, §10.3, §10.4)
  tanpaBantuan: "Tanpa bantuan. Semangat!",
  lulus: "LULUS!",
  hampir: "Hampir!",
  naikLevel: (n: number) => `Kamu naik ke Level ${n}!`,
  rankBaru: (r: string) => `Rank baru: ${r}`,
  sertifikat: (op: string, lvl: number) => `Sertifikat ${op} Level ${lvl}`,
  perluDikuatkan: (skill: string) => `Perlu dikuatkan: ${skill}`,
  ujianTerkunci: "Ujian (butuh semua ≥70%)",

  // Targets / missions
  targetHariIni: (skill: string) => `Targetmu hari ini: ${skill}`,
  latih: (skill: string) => `Latih '${skill}'`,
  cobaUjianLagi: "Coba ujian lagi nanti",

  // Stats
  runtutanHari: (n: number) => `Runtutan ${n} hari`,

  // Buttons
  ulangi: "Ulangi",
  lanjut: "Lanjut",
  mulaiLatihan: "Latihan Terarah",

  // Mascot (§17)
  mascot: {
    greet: (nama: string) => `Halo, ${nama}! Siap latihan?`,
    masteryUp: "Keren, penguasaanmu naik!",
    encourage: ["Hampir benar — fokus ke satuannya ya.", "Gak apa-apa, coba lagi ya!"],
    cheer: ["Hebat!", "Keren banget!"],
    examPass: "Kamu LULUS! Bangga banget! 🎉",
  },
} as const;

export type Strings = typeof strings;
