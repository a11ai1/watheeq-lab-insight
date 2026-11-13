import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { Card, SevBadge, Radial, tip } from "@/components/w/ui";
import { useSim, PARAMS, interpret, confidence, reviewSample, fmtTime } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/samples/$id")({
  head: ({ params }) => ({ meta: [{ title: `العينة ${params.id} — وَثيق` }, { name: "description", content: "تفاصيل نتيجة CBC والتفسير الذكي ومراجعة الأخصائي." }, { property: "og:title", content: `العينة ${params.id} — وَثيق` }, { property: "og:description", content: "تفاصيل نتيجة CBC." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const s = useSim((st) => st.samples.find((x) => x.id === id));
  const [action, setAction] = useState("اعتماد النتيجة");
  const [note, setNote] = useState("");
  if (!s) return <Card><p className="py-10 text-center text-muted-foreground">العينة غير موجودة. <Link to="/samples" className="text-primary">العودة للسجل</Link></p></Card>;
  const ai = interpret(s);
  const chart = PARAMS.map((p) => ({ k: p.key, pct: Math.round(((s.values[p.key] - p.low) / (p.high - p.low)) * 100), f: s.flags.find((f) => f.key === p.key) }));
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/samples" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" /> السجل</Link>
        <h2 className="font-mono text-2xl font-bold">{s.id}</h2><SevBadge s={s.severity} />
        <span className="text-sm text-muted-foreground">{s.patient} • {s.age} سنة • {s.sex} • {s.ward} • {fmtTime(s.at)} • جهاز {s.device}</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="جدول التحاليل والمجالات المرجعية" className="xl:col-span-2">
          <table className="w-full text-sm"><thead><tr className="text-right text-xs text-muted-foreground"><th className="p-2">التحليل</th><th className="p-2">النتيجة</th><th className="p-2">الوحدة</th><th className="p-2">المرجعي</th><th className="p-2">الحد الحرج</th><th className="p-2 w-40">الموضع</th></tr></thead>
            <tbody>{PARAMS.map((p) => { const v = s.values[p.key]; const f = s.flags.find((x) => x.key === p.key); const pos = Math.max(0, Math.min(100, ((v - p.low) / (p.high - p.low)) * 60 + 20)); return (
              <tr key={p.key} className={cn("border-t border-border", f?.critical && "bg-destructive/10")}><td className="p-2"><div className="font-mono font-semibold">{p.key}</div><div className="text-[11px] text-muted-foreground">{p.name}</div></td>
                <td className={cn("p-2 font-display text-base font-bold tabular-nums", f?.critical ? "text-destructive" : f ? "text-warning" : "")}>{v} {f && (f.dir === "low" ? "↓" : "↑")}</td><td className="p-2 text-xs text-muted-foreground">{p.unit}</td><td className="p-2 tabular-nums">{p.low}–{p.high}</td><td className="p-2 text-xs tabular-nums text-muted-foreground">{p.critLow !== undefined ? `<${p.critLow} / >${p.critHigh}` : "—"}</td>
                <td className="p-2"><div className="relative h-2 rounded-full bg-muted"><div className="absolute inset-y-0 right-[20%] left-[20%] rounded-full bg-success/30" /><div className={cn("absolute top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rounded-full", f?.critical ? "bg-destructive" : f ? "bg-warning" : "bg-primary")} style={{ right: `${pos}%` }} /></div></td></tr>); })}</tbody></table>
        </Card>
        <Card title={<span className="flex items-center gap-2"><BrainCircuit className="size-4 text-accent" /> التفسير الذكي</span>}>
          <div className="flex items-center gap-4"><Radial value={confidence(s)} label="ثقة النموذج" color="var(--color-accent)" size={90} /><div><div className="font-display font-semibold">{ai.title}</div><p className="mt-1 text-xs text-muted-foreground">{ai.detail}</p></div></div>
          <div className="mt-4 text-xs text-muted-foreground">التوصيات المخبرية للتحقق</div>
          <ul className="mt-2 grid gap-2 text-sm">{ai.recs.map((r) => <li key={r} className="flex gap-2 rounded-lg bg-muted/40 px-3 py-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{r}</li>)}</ul>
          <p className="mt-3 text-[10px] text-muted-foreground">أداة مساعدة لاتخاذ القرار — القرار النهائي للأخصائي.</p>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="الانحراف عن المجال المرجعي (%)">
          <div className="h-64"><ResponsiveContainer><BarChart data={chart}><XAxis dataKey="k" tickLine={false} axisLine={false} reversed /><YAxis orientation="right" tickLine={false} axisLine={false} width={34} /><Tooltip {...tip} /><ReferenceLine y={0} stroke="var(--color-success)" strokeDasharray="4 4" /><ReferenceLine y={100} stroke="var(--color-success)" strokeDasharray="4 4" />
            <Bar dataKey="pct" name="الموضع من المرجعي" radius={[6, 6, 6, 6]}>{chart.map((c) => <Cell key={c.k} fill={c.f?.critical ? "var(--color-chart-5)" : c.f ? "var(--color-chart-2)" : "var(--color-chart-1)"} />)}</Bar></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="توثيق مراجعة الأخصائي">
          {s.status === "reviewed" && s.review ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm"><div className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="size-4" /> تمت المراجعة — {s.review.action}</div><div className="mt-2 text-muted-foreground">بواسطة {s.review.by} • {fmtTime(s.review.at)}</div>{s.review.note && <p className="mt-2">{s.review.note}</p>}</div>
          ) : (
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); reviewSample(s.id, { by: "د. ليان الحارثي", action, note }); toast.success(`تم توثيق مراجعة ${s.id}`); }}>
              <div className="grid grid-cols-2 gap-2">{["اعتماد النتيجة", "إبلاغ الطبيب المعالج", "طلب إعادة الفحص", "طلب عينة جديدة"].map((a) => <button type="button" key={a} onClick={() => setAction(a)} className={cn("rounded-lg border px-3 py-2 text-sm", action === a ? "border-primary/60 bg-primary/15" : "border-border text-muted-foreground")}>{a}</button>)}</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="ملاحظات الأخصائي (مثال: تم إبلاغ د. أحمد هاتفيًا الساعة 10:42)" className="rounded-lg border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary" />
              <button className="rounded-lg bg-gradient-to-l from-primary to-accent py-2.5 text-sm font-semibold text-primary-foreground glow">توثيق المراجعة</button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
