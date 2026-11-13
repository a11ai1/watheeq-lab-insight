import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, SevBadge } from "@/components/w/ui";
import { useSim, fmtTime, flagReason, type Severity } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/samples/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [{ title: "سجل العينات — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "جميع عينات CBC مع البحث والتصفية." }, { property: "og:title", content: "سجل العينات — وَثيق" }, { property: "og:description", content: "جميع عينات CBC مع البحث والتصفية." }] }),
  component: SamplesList,
});

function SamplesList() {
  const { q: q0 } = Route.useSearch();
  const samples = useSim((s) => s.samples);
  const [q, setQ] = useState(q0 ?? "");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [st, setSt] = useState<"all" | "pending" | "reviewed">("all");
  const [ward, setWard] = useState("all");
  const wards = [...new Set(samples.map((s) => s.ward))];
  const list = samples.filter((s) => (sev === "all" || s.severity === sev) && (st === "all" || s.status === st) && (ward === "all" || s.ward === ward) && (!q || s.id.includes(q.toUpperCase()) || s.patient.includes(q)));
  const sel = "rounded-lg border border-border bg-muted px-3 py-2 text-sm";
  return (
    <Card title={`سجل العينات (${list.length})`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="رقم العينة أو المريض" className={cn(sel, "w-56")} />
        <select className={sel} value={sev} onChange={(e) => setSev(e.target.value as Severity | "all")}><option value="all">كل التصنيفات</option><option value="critical">حرجة</option><option value="abnormal">غير طبيعية</option><option value="normal">طبيعية</option></select>
        <select className={sel} value={st} onChange={(e) => setSt(e.target.value as "all")}><option value="all">كل الحالات</option><option value="pending">بانتظار المراجعة</option><option value="reviewed">تمت المراجعة</option></select>
        <select className={sel} value={ward} onChange={(e) => setWard(e.target.value)}><option value="all">كل الأقسام</option>{wards.map((w) => <option key={w}>{w}</option>)}</select>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-right text-xs text-muted-foreground"><th className="p-2">العينة</th><th className="p-2">المريض</th><th className="p-2">العمر/الجنس</th><th className="p-2">القسم</th><th className="p-2">الوقت</th><th className="p-2">الملاحظات</th><th className="p-2">التصنيف</th><th /></tr></thead>
        <tbody>{list.map((s) => <tr key={s.id} className="border-t border-border hover:bg-muted/30"><td className="p-2 font-mono">{s.id}</td><td className="p-2">{s.patient}</td><td className="p-2 text-muted-foreground">{s.age} • {s.sex}</td><td className="p-2">{s.ward}</td><td className="p-2 tabular-nums">{fmtTime(s.at)}</td><td className="max-w-64 truncate p-2 text-xs text-muted-foreground">{s.flags.map(flagReason).join("، ") || "—"}</td><td className="p-2"><SevBadge s={s.severity} /></td><td className="p-2"><Link to="/samples/$id" params={{ id: s.id }} className="text-xs text-primary">التفاصيل</Link></td></tr>)}</tbody></table>
        {!list.length && <p className="py-10 text-center text-muted-foreground">لا توجد نتائج مطابقة</p>}</div>
    </Card>
  );
}
