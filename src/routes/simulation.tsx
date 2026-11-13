import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Pause, RotateCcw, Zap, Siren, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Card, SevBadge, Stat } from "@/components/w/ui";
import { useSimState, setRunning, setSpeed, addSample, resetSim, interpret, fmtTime } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulation")({
  head: () => ({ meta: [{ title: "المحاكاة المباشرة — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "تشغيل عينات CBC تجريبية ومشاهدة تحليلها وتصنيفها." }, { property: "og:title", content: "المحاكاة المباشرة — وَثيق" }, { property: "og:description", content: "تشغيل عينات CBC تجريبية ومشاهدة تحليلها وتصنيفها." }] }),
  component: Sim,
});

function Sim() {
  const st = useSimState();
  const last = st.samples[0];
  const btn = "flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:border-primary/50";
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card title="لوحة التحكم بالمحاكاة">
        <button onClick={() => setRunning(!st.running)} className={cn("mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display text-lg font-bold", st.running ? "border border-destructive/40 bg-destructive/15 text-destructive" : "bg-gradient-to-l from-primary to-accent text-primary-foreground glow")}>{st.running ? <Pause /> : <Play />}{st.running ? "إيقاف المحاكاة" : "تشغيل المحاكاة"}</button>
        <div className="mb-2 text-xs text-muted-foreground">سرعة وصول العينات</div>
        <div className="mb-4 grid grid-cols-3 gap-2 text-sm">{[[4000, "بطيئة"], [2500, "عادية"], [1000, "سريعة"]].map(([ms, l]) => <button key={ms} onClick={() => setSpeed(ms as number)} className={cn("rounded-lg border py-2", st.speed === ms ? "border-primary/50 bg-primary/15" : "border-border text-muted-foreground")}>{l}</button>)}</div>
        <div className="grid gap-2">
          <button className={btn} onClick={() => addSample("normal")}><FlaskConical className="size-4 text-primary" /> حقن عينة طبيعية</button>
          <button className={btn} onClick={() => addSample("abnormal")}><Zap className="size-4 text-warning" /> حقن عينة غير طبيعية</button>
          <button className={cn(btn, "border-destructive/40 text-destructive")} onClick={() => addSample("critical")}><Siren className="size-4" /> حقن حالة حرجة</button>
          <button className={btn} onClick={() => { resetSim(); toast("تمت إعادة ضبط البيانات"); }}><RotateCcw className="size-4" /> إعادة الضبط</button>
        </div>
      </Card>
      <div className="grid gap-5 xl:col-span-2">
        <div className="grid gap-5 sm:grid-cols-3">
          <Stat label="العينات" value={st.samples.length} icon={FlaskConical} />
          <Stat label="حرجة نشطة" value={st.samples.filter((s) => s.severity === "critical" && s.status === "pending").length} icon={Siren} tone="destructive" />
          <Stat label="الحالة" value={<span className="text-xl">{st.running ? "قيد التشغيل" : "متوقفة"}</span>} icon={Play} tone={st.running ? "success" : "info"} />
        </div>
        {last && <Card title="آخر عينة تم تحليلها" action={<SevBadge s={last.severity} />} className={cn(last.severity === "critical" && "border-destructive/40 glow-danger")}>
          <div key={last.id} className="row-in">
            <div className="flex flex-wrap items-baseline gap-3"><span className="font-mono text-xl font-bold">{last.id}</span><span className="text-sm text-muted-foreground">{last.patient} • {last.ward} • {fmtTime(last.at)}</span><Link to="/samples/$id" params={{ id: last.id }} className="mr-auto text-sm text-primary">فتح التفاصيل</Link></div>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">{Object.entries(last.values).map(([k, v]) => { const f = last.flags.find((x) => x.key === k); return <div key={k} className={cn("rounded-lg border p-2 text-center", f?.critical ? "border-destructive/50 bg-destructive/10" : f ? "border-warning/40 bg-warning/10" : "border-border bg-muted/30")}><div className="font-mono text-[10px] text-muted-foreground">{k}</div><div className="font-display font-bold tabular-nums">{v}</div></div>; })}</div>
            <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm"><b>التحليل:</b> {interpret(last).detail}</div>
          </div>
        </Card>}
        <Card title="خط سير المعالجة"><div className="grid gap-1.5">{st.samples.slice(0, 8).map((s) => <div key={s.id} className="row-in flex items-center gap-3 text-sm"><span className="w-12 tabular-nums text-xs text-muted-foreground">{fmtTime(s.at)}</span><span className="font-mono">{s.id}</span><span className="text-xs text-muted-foreground">{s.device}</span><span className="flex-1 truncate text-xs">{interpret(s).title}</span><SevBadge s={s.severity} /></div>)}</div></Card>
      </div>
    </div>
  );
}
