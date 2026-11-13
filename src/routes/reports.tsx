import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, RadialBar, RadialBarChart } from "recharts";
import { Download } from "lucide-react";
import { Card, tip } from "@/components/w/ui";
import { useSimState, PARAMS, fmtTime, type Key } from "@/lib/sim";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "الإحصائيات والتقارير — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "رسوم ومؤشرات تفاعلية لأداء المختبر." }, { property: "og:title", content: "الإحصائيات والتقارير — وَثيق" }, { property: "og:description", content: "رسوم ومؤشرات تفاعلية لأداء المختبر." }] }),
  component: Reports,
});

function Reports() {
  const st = useSimState();
  const [metric, setMetric] = useState("HGB");
  const S = st.samples;
  const series = S.slice(0, 40).reverse().map((s) => ({ t: fmtTime(s.at), v: s.values[metric as Key] }));
  const p = PARAMS.find((x) => x.key === metric)!;
  const wards = [...new Set(S.map((s) => s.ward))].map((w) => { const x = S.filter((s) => s.ward === w); return { w, normal: x.filter((s) => s.severity === "normal").length, abnormal: x.filter((s) => s.severity === "abnormal").length, critical: x.filter((s) => s.severity === "critical").length }; });
  const tatB = [["<20", 0, 20], ["20-30", 20, 30], ["30-45", 30, 45], ["45-60", 45, 60]].map(([l, a, b]) => ({ l, n: S.filter((s) => s.tat >= (a as number) && s.tat < (b as number)).length }));
  const rad = st.devices.map((d, i) => ({ name: d.id, v: d.processed, fill: `var(--color-chart-${i + 1})` }));
  const exportCsv = () => {
    const rows = [["id", "patient", "ward", "severity", "status", ...PARAMS.map((p) => p.key)], ...S.map((s) => [s.id, s.patient, s.ward, s.severity, s.status, ...PARAMS.map((p) => s.values[p.key])])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })); a.download = "watheeq-report.csv"; a.click();
  };
  return (
    <div className="grid gap-5">
      <div className="flex justify-end"><button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm"><Download className="size-4" /> تصدير التقرير CSV</button></div>
      <Card title={`اتجاه ${p.name}`} action={<select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg border border-border bg-muted px-2 py-1 text-xs">{PARAMS.map((x) => <option key={x.key} value={x.key}>{x.key}</option>)}</select>}>
        <div className="h-64"><ResponsiveContainer><LineChart data={series}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="t" reversed tickLine={false} axisLine={false} /><YAxis orientation="right" width={34} tickLine={false} axisLine={false} /><Tooltip {...tip} />
          <Line dataKey={() => p.low} stroke="var(--color-success)" strokeDasharray="4 4" dot={false} name="الحد الأدنى" /><Line dataKey={() => p.high} stroke="var(--color-success)" strokeDasharray="4 4" dot={false} name="الحد الأعلى" />
          <Line dataKey="v" name={p.key} stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="التصنيف حسب القسم" className="xl:col-span-2"><div className="h-64"><ResponsiveContainer><BarChart data={wards}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="w" reversed tickLine={false} axisLine={false} /><YAxis orientation="right" width={28} tickLine={false} axisLine={false} /><Tooltip {...tip} /><Legend />
          <Bar dataKey="normal" stackId="a" name="طبيعية" fill="var(--color-chart-1)" /><Bar dataKey="abnormal" stackId="a" name="غير طبيعية" fill="var(--color-chart-2)" /><Bar dataKey="critical" stackId="a" name="حرجة" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="حمل الأجهزة"><div className="h-64"><ResponsiveContainer><RadialBarChart innerRadius="25%" outerRadius="100%" data={rad}><RadialBar dataKey="v" background={{ fill: "var(--color-muted)" }} cornerRadius={8} /><Legend /><Tooltip {...tip} /></RadialBarChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="توزيع زمن الإنجاز (دقيقة)"><div className="h-52"><ResponsiveContainer><BarChart data={tatB}><XAxis dataKey="l" reversed tickLine={false} axisLine={false} /><YAxis orientation="right" width={28} tickLine={false} axisLine={false} /><Tooltip {...tip} /><Bar dataKey="n" name="عينات" fill="var(--color-chart-3)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    </div>
  );
}
