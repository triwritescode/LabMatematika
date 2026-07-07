// Worked explanations (Bahasa Indonesia). Each returns the *method* as short
// steps computed from the actual numbers — never just the answer.

type Explainer = (a: number, b: number) => string[];

function digits(n: number): number[] {
  // least-significant first
  return String(n).split('').reverse().map(Number);
}

const PLACE = ['Satuan', 'Puluhan', 'Ratusan', 'Ribuan', 'Puluh ribuan'];

function addColumnSteps(a: number, b: number): string[] {
  const da = digits(a);
  const db = digits(b);
  const steps: string[] = ['Susun ke bawah, jumlahkan dari satuan.'];
  let carry = 0;
  for (let i = 0; i < Math.max(da.length, db.length); i++) {
    const x = da[i] ?? 0;
    const y = db[i] ?? 0;
    const sum = x + y + carry;
    const carryNote = carry ? ` + ${carry} (simpanan)` : '';
    if (sum >= 10) {
      steps.push(
        `${PLACE[i]}: ${x} + ${y}${carryNote} = ${sum}. Tulis ${sum % 10}, simpan 1.`
      );
      carry = 1;
    } else {
      steps.push(`${PLACE[i]}: ${x} + ${y}${carryNote} = ${sum}. Tulis ${sum}.`);
      carry = 0;
    }
  }
  if (carry) steps.push('Turunkan simpanan terakhir: tulis 1 di depan.');
  steps.push(`Hasil: ${a} + ${b} = ${a + b}.`);
  return steps;
}

function subColumnSteps(a: number, b: number): string[] {
  const da = digits(a);
  const db = digits(b);
  const steps: string[] = ['Susun ke bawah, kurangkan dari satuan.'];
  let borrow = 0;
  for (let i = 0; i < da.length; i++) {
    let x = da[i] - borrow;
    const y = db[i] ?? 0;
    const borrowNote = borrow ? ` (sudah dipinjam 1, sisa ${x})` : '';
    if (x < y) {
      steps.push(
        `${PLACE[i]}: ${da[i]}${borrowNote} kurang dari ${y}. Pinjam 1 dari ${PLACE[i + 1]?.toLowerCase() ?? 'depan'}: ${x + 10} − ${y} = ${x + 10 - y}.`
      );
      borrow = 1;
    } else {
      steps.push(`${PLACE[i]}: ${da[i]}${borrowNote} − ${y} = ${x - y}.`);
      borrow = 0;
    }
  }
  steps.push(`Hasil: ${a} − ${b} = ${a - b}.`);
  return steps;
}

function divChunkSteps(a: number, b: number): string[] {
  const q = a / b;
  const steps: string[] = [`Cari: ${b} dikali berapa supaya jadi ${a}?`];
  let remaining = a;
  const qd = digits(q);
  for (let i = qd.length - 1; i >= 0; i--) {
    const part = qd[i] * 10 ** i;
    if (part === 0) continue;
    const chunk = b * part;
    remaining -= chunk;
    steps.push(
      `${b} × ${part} = ${chunk}. Sisa ${remaining === 0 ? 'habis' : remaining}.`
    );
  }
  steps.push(`Jadi ${a} ÷ ${b} = ${q}.`);
  return steps;
}

const explainers: Record<string, Explainer> = {
  'add.within10': (a, b) => {
    const [big, small] = a >= b ? [a, b] : [b, a];
    const counts = Array.from({ length: small }, (_, i) => big + i + 1).join(', ');
    return [
      `Mulai dari angka besar: ${big}.`,
      `Hitung maju ${small} langkah: ${counts}.`,
      `Jadi ${a} + ${b} = ${a + b}.`,
    ];
  },
  'add.bridge10': (a, b) => {
    const [big, small] = a >= b ? [a, b] : [b, a];
    const toTen = 10 - big;
    const rest = small - toTen;
    return [
      `Genapkan ke 10 dulu: pecah ${small} menjadi ${toTen} dan ${rest}.`,
      `${big} + ${toTen} = 10.`,
      `10 + ${rest} = ${10 + rest}.`,
      `Jadi ${a} + ${b} = ${a + b}.`,
    ];
  },
  'add.doubles': (a, b) => {
    const base = Math.min(a, b);
    const other = Math.max(a, b);
    if (a === b) {
      return [
        `${a} + ${b} adalah dobel.`,
        `Ingat dobel ${a}: ${a} + ${a} = ${a + b}.`,
      ];
    }
    return [
      `${a} + ${b} adalah dekat-dobel.`,
      `Pakai dobel ${base}: ${base} + ${base} = ${base + base}.`,
      `Tambah selisih ${other - base}: ${base + base} + ${other - base} = ${a + b}.`,
      `Jadi ${a} + ${b} = ${a + b}.`,
    ];
  },
  'add.tens': (a, b) => [
    `Hitung puluhannya saja: ${a / 10} puluhan + ${b / 10} puluhan = ${(a + b) / 10} puluhan.`,
    `${(a + b) / 10} puluhan = ${a + b}.`,
    `Jadi ${a} + ${b} = ${a + b}.`,
  ],
  'add.compensate': (a, b) => {
    // round the addend nearer a ten up to that ten, then subtract the extra
    const [near, other] = a % 10 >= b % 10 ? [a, b] : [b, a];
    const up = Math.round(near / 10) * 10;
    const extra = up - near;
    return [
      `Genapkan ${near} ke ${up} (tambah ${extra}).`,
      `${up} + ${other} = ${up + other}.`,
      `Kembalikan ${extra}: ${up + other} − ${extra} = ${a + b}.`,
      `Jadi ${a} + ${b} = ${a + b}.`,
    ];
  },
  'add.column.nocarry': addColumnSteps,
  'add.column.carry': addColumnSteps,
  'sub.within10': (a, b) => {
    const counts = Array.from({ length: b }, (_, i) => a - i - 1).join(', ');
    return [
      `Mulai dari ${a}, hitung mundur ${b} langkah: ${counts}.`,
      `Jadi ${a} − ${b} = ${a - b}.`,
    ];
  },
  'sub.bridge10': (a, b) => {
    const toTen = a - 10;
    const rest = b - toTen;
    return [
      `Turun ke 10 dulu: pecah ${b} menjadi ${toTen} dan ${rest}.`,
      `${a} − ${toTen} = 10.`,
      `10 − ${rest} = ${10 - rest}.`,
      `Jadi ${a} − ${b} = ${a - b}.`,
    ];
  },
  'sub.column.noborrow': subColumnSteps,
  'sub.column.borrow': subColumnSteps,
  'sub.borrow.zero': subColumnSteps,
  'mul.concept': (a, b) => [
    `${a} × ${b} artinya ${b} dijumlahkan sebanyak ${a} kali.`,
    `${Array.from({ length: a }, () => b).join(' + ')} = ${a * b}.`,
    `Jadi ${a} × ${b} = ${a * b}.`,
  ],
  'mul.table': (a, b) => {
    if (a <= 5)
      return [
        `${a} × ${b} = ${Array.from({ length: a }, () => b).join(' + ')} = ${a * b}.`,
      ];
    return [
      `Pecah lewat 5: ${a} × ${b} = (5 × ${b}) + (${a - 5} × ${b}).`,
      `5 × ${b} = ${5 * b}, dan ${a - 5} × ${b} = ${(a - 5) * b}.`,
      `${5 * b} + ${(a - 5) * b} = ${a * b}. Jadi ${a} × ${b} = ${a * b}.`,
    ];
  },
  'mul.column.1d': (a, b) => {
    const da = digits(a);
    const steps: string[] = [`Kalikan ${b} dengan tiap angka dari ${a}, mulai satuan.`];
    let carry = 0;
    for (let i = 0; i < da.length; i++) {
      const prod = da[i] * b + carry;
      const carryNote = carry ? ` + ${carry} (simpanan)` : '';
      const isLast = i === da.length - 1;
      if (!isLast && prod >= 10) {
        steps.push(
          `${PLACE[i]}: ${da[i]} × ${b}${carryNote} = ${prod}. Tulis ${prod % 10}, simpan ${Math.floor(prod / 10)}.`
        );
        carry = Math.floor(prod / 10);
      } else {
        steps.push(`${PLACE[i]}: ${da[i]} × ${b}${carryNote} = ${prod}. Tulis ${prod}.`);
        carry = 0;
      }
    }
    steps.push(`Hasil: ${a} × ${b} = ${a * b}.`);
    return steps;
  },
  'mul.column.2d': (a, b) => {
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    return [
      `Pecah ${b} menjadi ${tens} dan ${ones}.`,
      `${a} × ${tens} = ${a * tens}.`,
      `${a} × ${ones} = ${a * ones}.`,
      `Jumlahkan: ${a * tens} + ${a * ones} = ${a * b}.`,
      `Jadi ${a} × ${b} = ${a * b}.`,
    ];
  },
  'div.facts': (a, b) => [
    `Ingat kebalikan perkalian: ${b} × berapa = ${a}?`,
    `${b} × ${a / b} = ${a}.`,
    `Jadi ${a} ÷ ${b} = ${a / b}.`,
  ],
  'div.short': divChunkSteps,
  'div.long': divChunkSteps,
};

export function explain(explainId: string, a: number, b: number): string[] {
  const fn = explainers[explainId];
  if (!fn) return [];
  return fn(a, b);
}
