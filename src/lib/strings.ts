// All kid-facing UI copy in Bahasa Indonesia. Centralized — see specs §16.
// Functions interpolate runtime values; plain strings are static labels.

export const strings = {
  appName: "LabMatematika",
  tagline: "Belajar berhitung jadi seru!",

  // Navigation / sections
  beranda: "Beranda",
  pilihOperasi: "Pilih operasi",
  pilihLevel: "Pilih level",
  progres: "Progres",
  toko: "Toko",
  albumStiker: "Album Stiker",
  lencana: "Lencana",
  misiHarian: "Misi harian",

  // Modes (§4)
  modeLatihan: "Latihan",
  modeTantangan: "Tantangan",
  modeCampur: "Latihan Campur",

  // Quiz (§10.3, §10.4)
  soalDari: (n: number, total = 10) => `Soal ${n} dari ${total}`,
  benar: "Benar!",
  belumTepat: "Belum tepat",
  yangBenar: (x: number) => `Yang benar ${x}`,
  lihatCaranya: "Lihat caranya",
  hapus: "Hapus",

  // Result (§10.5)
  hebat: "Hebat!",
  ayoCobaLagi: "Ayo coba lagi!",
  benarDari: (n: number, total = 10) => `${n} dari ${total} benar`,
  levelTerbuka: (n: number) => `Level ${n} terbuka!`,
  koinPlus: (n: number) => `+${n} koin`,
  lencanaBaru: (name: string) => `Lencana baru: "${name}"`,
  ulangi: "Ulangi",
  lanjut: "Lanjut",

  // Stats
  runtutanHari: (n: number) => `Runtutan ${n} hari`,
  koin: "Koin",
  perluLatihan: (skill: string) => `Perlu latihan: ${skill}`,

  // Mascot lines (§16) — picked at random where multiple given
  mascot: {
    greet: (nama: string) => `Halo, ${nama}! 👋`,
    siapLatihan: "Siap latihan hari ini?",
    cheer: ["Hebat!", "Keren banget!", "Wah, kamu hebat hari ini!"],
    encourage: ["Gak apa-apa, coba lagi ya!", "Hampir benar, semangat!"],
    lanjut: "Yuk lanjut latihan!",
  },

  // Sub-skill labels for "Perlu latihan"
  subSkill: {
    carrying: "menyimpan",
    borrowing: "meminjam",
  },
} as const;

export type Strings = typeof strings;
