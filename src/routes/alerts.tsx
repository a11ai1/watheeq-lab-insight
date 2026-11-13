import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Siren, PhoneCall, CheckCircle2 } from "lucide-react";
import { Card, Stat } from "@/components/w/ui";
import { useSim, flagReason, fmtTime, param, reviewSample } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "مركز التنبيهات — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "الحالات الحرجة وإجراءات الأخصائي." }, { property: "og:title", content: "مركز التنبيهات — وَثيق" }, { property: "og:description", content: "الحالات الحرجة وإجراءات الأخصائي." }] }),
  component: Alerts,
});

function Alerts() {
  const samples = useSim((s) => s.samples);
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");
  const crit = samples.filter((s) => s.severity === "critical");
  const list = crit.filter((s) => s.status === tab);
  const act = (id: string, action: string) => { reviewSample(id, { by: "د. ليان الحارثي", action, note: "" }); toast.success(`${action} — ${id}`); };
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Stat label="تنبيهات نشطة" value={crit.filter((s) => s.status === "pending").length} icon={Siren} tone="destructive" />
        <Stat label="تم الإبلاغ والمعالجة" value={crit.filter((s) => s.status === "reviewed").length} icon={CheckCircle2} tone="success" />
        <Stat label="إجمالي الحرجة اليوم" value={crit.length} icon={PhoneCall} tone="accent" />
      </div>
      <Card title="التنبيهات الحرجة" action={<div className="flex gap-2 text-xs">{(["pending", "reviewed"] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={cn("rounded-lg border px-3 py-1.5", tab === k ? "border-primary/50 bg-primary/15" : "border-border text-muted-foreground")}>{k === "pending" ? "نشطة" : "مُعالجة"}</button>)}</div>}>
        <div className="grid gap-3">{list.map((s) => (
          <div key={s.id} className={cn("row-in flex flex-wrap items-center gap-4 rounded-xl border p-4", tab === "pending" ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20")}>
            <span className={cn("grid size-10 place-items-center rounded-xl", tab === "pending" ? "pulse-danger bg-destructive/20 text-destructive" : "bg-success/15 text-success")}><Siren className="size-5" /></span>
            <div className="min-w-48 flex-1"><div className="flex gap-2"><span className="font-mono font-semibold">{s.id}</span><span className="text-xs text-muted-foreground">{s.patient} • {s.ward} • {fmtTime(s.at)}</span></div>
              <div className="mt-1 text-sm">{s.flags.filter((f) => f.critical).map((f) => <span key={f.key} className="ml-3">{flagReason(f)}: <b className="text-destructive">{f.value}</b> <span className="text-xs text-muted-foreground">{param(f.key).unit}</span></span>)}</div>
              {s.review && <div className="mt-1 text-xs text-success">{s.review.action} • {s.review.by}</div>}</div>
            {tab === "pending" && <div className="flex flex-wrap gap-2"><button onClick={() => act(s.id, "إبلاغ الطبيب المعالج")} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">إبلاغ الطبيب</button><button onClick={() => act(s.id, "طلب إعادة الفحص")} className="rounded-lg border border-border px-3 py-1.5 text-xs">إعادة الفحص</button></div>}
            <Link to="/samples/$id" params={{ id: s.id }} className="text-xs text-primary">التفاصيل</Link>
          </div>))}
          {!list.length && <p className="py-10 text-center text-muted-foreground">لا توجد تنبيهات</p>}</div>
      </Card>
    </div>
  );
}
