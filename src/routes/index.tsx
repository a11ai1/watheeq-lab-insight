import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Siren, CheckCircle2, Timer, ArrowLeft } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Stat, Radial, SevBadge, tip } from "@/components/w/ui";
import { useSimState, flagReason, fmtTime, param } from "@/lib/sim";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "لوحة التحكم — وَثيق WATHEEQ LAB AI" },
    { name: "description", content: "لوحة مراقبة مختبر CBC الذكية: العينات والحالات الحرجة ومؤشرات الأداء لحظيًا." },
    { property: "og:title", content: "لوحة التحكم — وَثيق" },
    { property: "og:description", content: "مراقبة ذكية لنتائج CBC لحظيًا." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const st = useSimState();
  const S = st.samples;
  const crit = S.filter((s) => s.severity === "critical");
  const critPending = crit.filter((s) => s.status === "pending");
  const reviewed = S.filter((s) => s.status === "reviewed").length;
  const abn = S.filter((s) => s.severity === "abnormal").length;
  const avgTat = Math.round(S.reduce((a, s) => a + s.tat, 0) / S.length);
  const dist = [
    { name: "طبيعية", value: S.length - abn - crit.length, c: "var(--color-chart-1)" },
    { name: "غير طبيعية", value: abn, c: "var(--color-chart-2)" },
    { name: "حرجة", value: crit.length, c: "var(--color-chart-5)" },
  ];
  const wards = Object.entries(S.reduce<Record<string, number>>((a, s) => ((a[s.ward] = (a[s.ward] ?? 0) + 1), a), {})).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v);
  const recent = S.slice(0, 24).reverse().map((s) => ({ t: fmtTime(s.at), HGB: s.values.HGB, WBC: s.values.WBC }));
  const flagCounts = Object.entries(S.flatMap((s) => s.flags).reduce<Record<string, number>>((a, f) => ((a[f.key] = (a[f.key] ?? 0) + 1), a), {})).map(([k, v]) => ({ k, v }));
  const onTime = Math.round((S.filter((s) => s.tat <= 45).length / S.length) * 100);

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="إجمالي العينات اليوم" value={S.length} sub={`+${st.hourly[11]!.total} في الساعة الأخيرة`} icon={FlaskConical} />
        <Stat label="الحالات الحرجة" value={crit.length} sub={`${critPending.length} بانتظار المراجعة`} icon={Siren} tone="destructive" />
        <Stat label="العينات المكتملة" value={reviewed} sub={`${Math.round((reviewed / S.length) * 100)}% من الإجمالي`} icon={CheckCircle2} tone="success" />
        <Stat label="متوسط زمن الإنجاز" value={<>{avgTat}<span className="text-base text-muted-foreground"> دقيقة</span></>} sub="الهدف ≤ 45 دقيقة" icon={Timer} tone="accent" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="معدل معالجة العينات بالساعة" className="xl:col-span-2" action={<span className="text-xs text-muted-foreground">آخر 12 ساعة</span>}>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={st.hourly} barGap={2}>
              <defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-chart-1)" /><stop offset="1" stopColor="var(--color-chart-3)" stopOpacity={0.4} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="h" tickLine={false} axisLine={false} reversed /><YAxis orientation="right" tickLine={false} axisLine={false} width={28} />
              <Tooltip {...tip} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
              <Bar dataKey="total" name="الإجمالي" fill="url(#gb)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="abnormal" name="غير طبيعية" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="critical" name="حرجة" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card title="توزيع العينات حسب التصنيف">
          <div className="relative h-48">
            <ResponsiveContainer><PieChart><Pie data={dist} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none">{dist.map((d) => <Cell key={d.name} fill={d.c} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-2xl font-bold">{S.length}</div><div className="text-[11px] text-muted-foreground">عينة</div></div></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">{dist.map((d) => <div key={d.name}><div className="mx-auto mb-1 h-1 w-8 rounded" style={{ background: d.c }} /><div className="font-bold tabular-nums">{d.value}</div><div className="text-muted-foreground">{d.name}</div></div>)}</div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="border-destructive/30 xl:col-span-2" title={<span className="flex items-center gap-2"><span className="pulse-danger size-2.5 rounded-full bg-destructive" /> الحالات الحرجة — أولوية قصوى</span>} action={<Link to="/alerts" className="flex items-center gap-1 text-xs text-primary">عرض الكل <ArrowLeft className="size-3" /></Link>}>
          <div className="grid gap-2">
            {critPending.slice(0, 5).map((s) => { const f = s.flags.find((x) => x.critical)!; const p = param(f.key); return (
              <div key={s.id} className="row-in flex flex-wrap items-center gap-4 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
                <div className="w-28"><div className="font-mono text-sm font-semibold">{s.id}</div><div className="text-[11px] text-muted-foreground">{fmtTime(s.at)} • {s.ward}</div></div>
                <div className="w-28"><div className="font-display text-lg font-bold text-destructive tabular-nums">{f.value}</div><div className="text-[11px] text-muted-foreground">{p.key} ({p.unit})</div></div>
                <div className="min-w-40 flex-1 text-sm">{flagReason(f)}<div className="text-[11px] text-muted-foreground">المرجعي {p.low}–{p.high}</div></div>
                <Link to="/samples/$id" params={{ id: s.id }} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground glow-danger hover:brightness-110">مراجعة</Link>
              </div>); })}
            {!critPending.length && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد حالات حرجة معلّقة ✓</p>}
          </div>
        </Card>
        <Card title="مؤشرات الأداء">
          <div className="grid grid-cols-2 gap-4">
            <Radial value={(reviewed / S.length) * 100} label="نسبة الإنجاز" />
            <Radial value={onTime} label="ضمن زمن الإنجاز" color="var(--color-accent)" />
            <Radial value={crit.length ? ((crit.length - critPending.length) / crit.length) * 100 : 100} label="الحرجة المُبلّغ عنها" color="var(--color-destructive)" />
            <Radial value={st.devices.filter((d) => d.status !== "offline" && d.status !== "maintenance").length / st.devices.length * 100} label="جاهزية الأجهزة" color="var(--color-success)" />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="اتجاه HGB و WBC — آخر 24 عينة" className="xl:col-span-2">
          <div className="h-56"><ResponsiveContainer><AreaChart data={recent}>
            <defs>
              <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-chart-1)" stopOpacity={0.5} /><stop offset="1" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient>
              <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-chart-2)" stopOpacity={0.5} /><stop offset="1" stopColor="var(--color-chart-2)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="t" tickLine={false} axisLine={false} reversed /><YAxis orientation="right" tickLine={false} axisLine={false} width={28} /><Tooltip {...tip} />
            <Area type="monotone" dataKey="HGB" stroke="var(--color-chart-1)" fill="url(#a1)" strokeWidth={2} />
            <Area type="monotone" dataKey="WBC" stroke="var(--color-chart-2)" fill="url(#a2)" strokeWidth={2} />
          </AreaChart></ResponsiveContainer></div>
        </Card>
        <Card title="العينات حسب القسم">
          <div className="grid gap-3">{wards.map((w) => <div key={w.name}><div className="mb-1 flex justify-between text-xs"><span>{w.name}</span><span className="tabular-nums text-muted-foreground">{w.v}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-l from-primary to-accent transition-all duration-700" style={{ width: `${(w.v / wards[0]!.v) * 100}%` }} /></div></div>)}</div>
          <div className="mt-5 border-t border-border pt-4"><div className="mb-2 text-xs text-muted-foreground">أكثر المؤشرات خروجًا عن المرجعي</div><div className="flex flex-wrap gap-2">{flagCounts.sort((a, b) => b.v - a.v).map((f) => <span key={f.k} className="rounded-lg border border-border bg-muted/40 px-2 py-1 font-mono text-[11px]">{f.k} <b className="text-primary">{f.v}</b></span>)}</div></div>
        </Card>
      </div>

      <Card title="أحدث النتائج الواردة" action={<Link to="/live" className="text-xs text-primary">المراقبة المباشرة</Link>}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{S.slice(0, 8).map((s) => <Link key={s.id} to="/samples/$id" params={{ id: s.id }} className="row-in flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5 hover:border-primary/40"><div><div className="font-mono text-xs">{s.id}</div><div className="text-[11px] text-muted-foreground">{s.patient}</div></div><SevBadge s={s.severity} /></Link>)}</div>
      </Card>
    </div>
  );
}
