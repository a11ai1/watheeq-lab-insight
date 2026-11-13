import { useSyncExternalStore } from "react";

export type Severity = "critical" | "abnormal" | "normal";
export type Key = "WBC" | "RBC" | "HGB" | "HCT" | "PLT" | "MCV" | "NEUT" | "LYMPH";
export type Vals = Record<Key, number>;
export type Param = { key: Key; name: string; unit: string; low: number; high: number; critLow?: number; critHigh?: number };
export const PARAMS: Param[] = [
  { key: "WBC", name: "كريات الدم البيضاء", unit: "×10³/µL", low: 4, high: 11, critLow: 2, critHigh: 30 },
  { key: "RBC", name: "كريات الدم الحمراء", unit: "×10⁶/µL", low: 4.2, high: 5.9 },
  { key: "HGB", name: "الهيموغلوبين", unit: "g/dL", low: 12, high: 17.5, critLow: 7, critHigh: 20 },
  { key: "HCT", name: "الهيماتوكريت", unit: "%", low: 36, high: 52, critLow: 20, critHigh: 60 },
  { key: "PLT", name: "الصفائح الدموية", unit: "×10³/µL", low: 150, high: 450, critLow: 50, critHigh: 1000 },
  { key: "MCV", name: "متوسط حجم الكرية", unit: "fL", low: 80, high: 100 },
  { key: "NEUT", name: "العدلات", unit: "%", low: 40, high: 75 },
  { key: "LYMPH", name: "اللمفاويات", unit: "%", low: 20, high: 45 },
];
export type Device = { id: string; name: string; model: string; status: "online" | "busy" | "maintenance" | "offline"; processed: number; qc: number; temp: number };
export type Review = { by: string; note: string; action: string; at: number };
export type Sample = {
  id: string; patient: string; age: number; sex: "ذكر" | "أنثى"; ward: string; device: string;
  at: number; values: Vals; severity: Severity; flags: Flag[]; status: "pending" | "reviewed"; review?: Review; tat: number;
};
export type Flag = { key: Key; dir: "low" | "high"; critical: boolean; value: number };

let seed = 20260513;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]!;
const NAMES = ["محمد العتيبي", "سارة القحطاني", "عبدالله الشهري", "نورة الدوسري", "خالد الغامدي", "ريم الزهراني", "فيصل المطيري", "هند الحربي", "سلطان العنزي", "لمى السبيعي", "تركي الشمري", "أمل الرشيدي", "ياسر البقمي", "جود العمري"];
const WARDS = ["الطوارئ", "العناية المركزة", "الباطنة", "الأطفال", "الجراحة", "العيادات"];
export const BASE = 1794600000000; // fixed base for deterministic SSR

export function evaluate(values: Vals) {
  const flags: Flag[] = [];
  for (const p of PARAMS) {
    const v = values[p.key];
    if (v < p.low || v > p.high) {
      const critical = (p.critLow !== undefined && v < p.critLow) || (p.critHigh !== undefined && v > p.critHigh);
      flags.push({ key: p.key, dir: v < p.low ? "low" : "high", critical, value: v });
    }
  }
  const severity: Severity = flags.some((f) => f.critical) ? "critical" : flags.length ? "abnormal" : "normal";
  return { flags, severity };
}

const r1 = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
function genValues(kind?: Severity): Vals {
  const k = kind ?? (rnd() < 0.14 ? "critical" : rnd() < 0.4 ? "abnormal" : "normal");
  const v: Vals = {
    WBC: r1(5 + rnd() * 5), RBC: r1(4.4 + rnd() * 1.2, 2), HGB: r1(12.8 + rnd() * 3.8), HCT: r1(38 + rnd() * 10),
    PLT: Math.round(180 + rnd() * 220), MCV: r1(82 + rnd() * 14), NEUT: r1(45 + rnd() * 25), LYMPH: r1(22 + rnd() * 18),
  };
  if (k === "abnormal") {
    const t = pick(["anemia", "leuko", "thromb", "micro"]);
    if (t === "anemia") { v.HGB = r1(9 + rnd() * 2.5); v.HCT = r1(29 + rnd() * 6); }
    if (t === "leuko") { v.WBC = r1(12 + rnd() * 8); v.NEUT = r1(78 + rnd() * 10); }
    if (t === "thromb") v.PLT = Math.round(90 + rnd() * 50);
    if (t === "micro") { v.MCV = r1(68 + rnd() * 10); v.HGB = r1(10 + rnd() * 1.8); }
  }
  if (k === "critical") {
    const t = pick(["hgb", "plt", "wbc", "wbcLow"]);
    if (t === "hgb") { v.HGB = r1(4.8 + rnd() * 1.9); v.HCT = r1(15 + rnd() * 5); v.RBC = r1(2 + rnd() * 0.8, 2); }
    if (t === "plt") v.PLT = Math.round(12 + rnd() * 30);
    if (t === "wbc") { v.WBC = r1(34 + rnd() * 40); v.LYMPH = r1(60 + rnd() * 20); v.NEUT = r1(15 + rnd() * 10); }
    if (t === "wbcLow") { v.WBC = r1(0.8 + rnd()); v.NEUT = r1(20 + rnd() * 10); }
  }
  return v;
}

let counter = 48210;
function makeSample(at: number, kind?: Severity): Sample {
  const values = genValues(kind);
  const { flags, severity } = evaluate(values);
  return {
    id: `WTQ-${counter++}`, patient: pick(NAMES), age: 4 + Math.floor(rnd() * 80), sex: rnd() > 0.5 ? "ذكر" : "أنثى",
    ward: severity === "critical" && rnd() > 0.4 ? pick(["الطوارئ", "العناية المركزة"]) : pick(WARDS),
    device: pick(["D1", "D2", "D3"]), at, values, severity, flags, status: "pending", tat: Math.round(18 + rnd() * 40),
  };
}

type State = {
  samples: Sample[]; running: boolean; speed: number; devices: Device[];
  hourly: { h: string; total: number; critical: number; abnormal: number }[];
  lastCritical?: string | undefined;
};

function init(): State {
  const samples: Sample[] = [];
  for (let i = 0; i < 64; i++) samples.push(makeSample(BASE - (64 - i) * 7 * 60000));
  samples.forEach((s, i) => { if (i < 46 && s.severity !== "critical") { s.status = "reviewed"; s.review = { by: "د. ليان", note: "تم التحقق", action: "اعتماد", at: s.at + 600000 }; } });
  const hourly = Array.from({ length: 12 }, (_, i) => ({ h: `${String((8 + i) % 24).padStart(2, "0")}:00`, total: 0, critical: 0, abnormal: 0 }));
  samples.forEach((s, i) => { const b = hourly[Math.min(11, Math.floor(i / 5.4))]!; b.total++; if (s.severity === "critical") b.critical++; if (s.severity === "abnormal") b.abnormal++; });
  return {
    samples: samples.reverse(), running: false, speed: 2500, hourly,
    devices: [
      { id: "D1", name: "محلل CBC — 01", model: "Sysmex XN-1000", status: "online", processed: 0, qc: 99.2, temp: 24.1 },
      { id: "D2", name: "محلل CBC — 02", model: "Mindray BC-6800", status: "online", processed: 0, qc: 98.7, temp: 23.6 },
      { id: "D3", name: "محلل CBC — 03", model: "Beckman DxH 900", status: "busy", processed: 0, qc: 97.9, temp: 25.0 },
      { id: "D4", name: "محلل احتياطي — 04", model: "Sysmex XN-550", status: "maintenance", processed: 0, qc: 92.4, temp: 22.8 },
    ],
  };
}

let state: State = init();
state.devices.forEach((d) => (d.processed = state.samples.filter((s) => s.device === d.id).length));
const subs = new Set<() => void>();
const critSubs = new Set<(s: Sample) => void>();
const set = (fn: (s: State) => State) => { state = fn(state); subs.forEach((f) => f()); };
let timer: ReturnType<typeof setInterval> | null = null;
let simClock = BASE;

export function addSample(kind?: Severity) {
  simClock = Math.max(simClock + 60000, Date.now() > BASE ? simClock + 60000 : simClock);
  const s = makeSample(simClock, kind);
  set((st) => {
    const hourly = st.hourly.slice();
    const last = { ...hourly[11]! };
    last.total++; if (s.severity === "critical") last.critical++; if (s.severity === "abnormal") last.abnormal++;
    hourly[11] = last;
    return {
      ...st, samples: [s, ...st.samples], hourly, lastCritical: s.severity === "critical" ? s.id : st.lastCritical,
      devices: st.devices.map((d) => (d.id === s.device ? { ...d, processed: d.processed + 1, status: "busy", temp: r1(d.temp + (rnd() - 0.5) * 0.4) } : d.status === "busy" ? { ...d, status: "online" } : d)),
    };
  });
  if (s.severity === "critical") critSubs.forEach((f) => f(s));
  return s;
}
export function setRunning(on: boolean) {
  if (timer) { clearInterval(timer); timer = null; }
  if (on) timer = setInterval(() => addSample(), state.speed);
  set((s) => ({ ...s, running: on }));
}
export function setSpeed(ms: number) { set((s) => ({ ...s, speed: ms })); if (state.running) setRunning(true); }
export function reviewSample(id: string, r: Omit<Review, "at">) {
  set((s) => ({ ...s, samples: s.samples.map((x) => (x.id === id ? { ...x, status: "reviewed", review: { ...r, at: Date.now() } } : x)) }));
}
export function setDeviceStatus(id: string, status: Device["status"]) {
  set((s) => ({ ...s, devices: s.devices.map((d) => (d.id === id ? { ...d, status } : d)) }));
}
export function resetSim() { setRunning(false); seed = 20260513; counter = 48210; simClock = BASE; state = init(); state.devices.forEach((d) => (d.processed = state.samples.filter((s) => s.device === d.id).length)); subs.forEach((f) => f()); }
export function onCritical(f: (s: Sample) => void) { critSubs.add(f); return () => { critSubs.delete(f); }; }

export function useSim<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => sel(state), () => sel(state));
}
export const useSimState = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => state);

export const SEV_AR: Record<Severity, string> = { critical: "حرجة", abnormal: "غير طبيعية", normal: "طبيعية" };
export const sevRank: Record<Severity, number> = { critical: 0, abnormal: 1, normal: 2 };
export const fmtTime = (t: number) => { const d = new Date(t + 3 * 3600000); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };
export const param = (k: Key) => PARAMS.find((p) => p.key === k)!;
export function flagReason(f: Flag) {
  const p = param(f.key);
  return `${p.name} ${f.dir === "low" ? "منخفض" : "مرتفع"}${f.critical ? " بشكل حرج" : ""}`;
}
export function interpret(s: Sample): { title: string; detail: string; recs: string[] } {
  const v = s.values; const out: string[] = []; const recs: string[] = [];
  if (v.HGB < 7) { out.push("فقر دم شديد يهدد الحياة"); recs.push("إبلاغ الطبيب المعالج فورًا خلال 15 دقيقة", "إعادة الفحص من نفس العينة للتأكد", "تقييم الحاجة لنقل دم"); }
  else if (v.HGB < 12) { out.push(v.MCV < 80 ? "فقر دم صغير الكريات (اشتباه نقص الحديد)" : "فقر دم"); recs.push("طلب مخزون الحديد (Ferritin)", "مراجعة لطاخة الدم"); }
  if (v.PLT < 50) { out.push("نقص صفائح حرج — خطر نزيف"); recs.push("فحص العينة بحثًا عن تكتل الصفائح (EDTA clumping)", "عدّ يدوي بالمجهر"); }
  else if (v.PLT < 150) { out.push("نقص صفائح خفيف إلى متوسط"); recs.push("متابعة العدّ بعد 24 ساعة"); }
  if (v.WBC > 30) { out.push("ارتفاع حاد في كريات الدم البيضاء مع غلبة لمفاوية — اشتباه اضطراب تكاثري"); recs.push("لطاخة دم محيطية عاجلة", "إحالة لأخصائي أمراض الدم"); }
  else if (v.WBC > 11) { out.push(v.NEUT > 75 ? "كثرة عدلات — نمط التهابي/عدوى بكتيرية" : "ارتفاع كريات بيضاء"); recs.push("ربط النتيجة بـ CRP والأعراض السريرية"); }
  if (v.WBC < 2) { out.push("نقص حاد في الكريات البيضاء — خطر عدوى"); recs.push("إبلاغ عاجل وعزل وقائي حسب البروتوكول"); }
  if (!out.length) return { title: "نتائج ضمن المجالات المرجعية", detail: "لا توجد أنماط غير معتادة. يُوصى بالاعتماد التلقائي.", recs: ["اعتماد تلقائي (Auto-verification)"] };
  return { title: out[0]!, detail: out.join(" • "), recs };
}
export function confidence(s: Sample) { return Math.round(86 + (((s.id.charCodeAt(8) || 0) * 7 + s.flags.length * 3) % 13)); }
