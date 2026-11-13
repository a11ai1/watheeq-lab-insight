import { createFileRoute, Link } from "@tanstack/react-router";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, CartesianGrid } from "recharts";
import { BrainCircuit } from "lucide-react";
import { Card, SevBadge, tip } from "@/components/w/ui";
import { useSim, interpret, confidence, PARAMS } from "@/lib/sim";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "التحليل الذكي — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "تفسير نتائج العينات واكتشاف القيم الحرجة والأنماط غير المعتادة." }, { property: "og:title", content: "التحليل الذكي — وَثيق" }, { property: "og:description", content: "تفسير نتائج العينات واكتشاف القيم الحرجة والأنماط غير المعتادة." }] }),
  component: Analysis,
});

function Analysis() {
  const samples = useSim((s) => s.samples);
  const flagged = samples.filter((s) => s.severity !== "normal").slice(0, 10);
  const patterns = new Map<string, number>();
  samples.forEach((s) => { if (s.severity !== "normal") { const t = interpret(s).title; patterns.set(t, (patterns.get(t) ?? 0) + 1); } });
  const radar = PARAMS.map((p) => ({ k: p.key, v: samples.filter((s) => s.flags.some((f) => f.key === p.key)).length }));
  const scatter = samples.map((s) => ({ x: s.values.HGB, y: s.values.PLT, z: s.values.WBC, sev: s.severity }));
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="الأنماط المكتشفة" className="xl:col-span-1">
          <div className="grid gap-2">{[...patterns.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => <div key={t} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"><span>{t}</span><span className="font-mono text-accent">{n}</span></div>)}</div>
        </Card>
        <Card title="بصمة الانحرافات حسب المؤشر"><div className="h-64"><ResponsiveContainer><RadarChart data={radar}><PolarGrid stroke="var(--color-border)" /><PolarAngleAxis dataKey="k" /><Radar dataKey="v" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.35} /><Tooltip {...tip} /></RadarChart></ResponsiveContainer></div></Card>
        <Card title="خريطة HGB × PLT (حجم = WBC)"><div className="h-64"><ResponsiveContainer><ScatterChart><CartesianGrid stroke="var(--color-border)" /><XAxis type="number" dataKey="x" name="HGB" reversed tickLine={false} /><YAxis type="number" dataKey="y" name="PLT" orientation="right" width={34} tickLine={false} /><ZAxis dataKey="z" range={[20, 200]} /><Tooltip {...tip} />
          <Scatter data={scatter.filter((d) => d.sev === "normal")} fill="var(--color-chart-1)" fillOpacity={0.6} /><Scatter data={scatter.filter((d) => d.sev === "abnormal")} fill="var(--color-chart-2)" /><Scatter data={scatter.filter((d) => d.sev === "critical")} fill="var(--color-chart-5)" /></ScatterChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="تفسيرات العينات غير الطبيعية">
        <div className="grid gap-3 lg:grid-cols-2">{flagged.map((s) => { const ai = interpret(s); return (
          <div key={s.id} className="row-in rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BrainCircuit className="size-4 text-accent" /><span className="font-mono text-sm">{s.id}</span><SevBadge s={s.severity} /></div><span className="text-xs text-muted-foreground">ثقة {confidence(s)}%</span></div>
            <div className="mt-2 font-semibold">{ai.title}</div><p className="text-xs text-muted-foreground">{ai.detail}</p>
            <div className="mt-2 flex items-center justify-between"><span className="text-xs text-primary">{ai.recs[0]}</span><Link to="/samples/$id" params={{ id: s.id }} className="text-xs text-primary underline">فتح العينة</Link></div>
          </div>); })}</div>
      </Card>
    </div>
  );
}
