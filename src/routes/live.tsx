import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, SevBadge } from "@/components/w/ui";
import { useSim, sevRank, fmtTime, PARAMS, type Severity } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "المراقبة المباشرة — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "نتائج CBC الواردة لحظيًا مرتبة حسب الخطورة." }, { property: "og:title", content: "المراقبة المباشرة — وَثيق" }, { property: "og:description", content: "نتائج CBC الواردة لحظيًا مرتبة حسب الخطورة." }] }),
  component: Live,
});

function Live() {
  const samples = useSim((s) => s.samples);
  const running = useSim((s) => s.running);
  const [f, setF] = useState<Severity | "all">("all");
  const [sort, setSort] = useState<"sev" | "time">("sev");
  const list = samples.filter((s) => f === "all" || s.severity === f).slice().sort((a, b) => sort === "time" ? b.at - a.at : sevRank[a.severity] - sevRank[b.severity] || (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.at - a.at).slice(0, 40);
  return (
    <Card title={<span className="flex items-center gap-2"><span className={cn("size-2 rounded-full", running ? "animate-pulse bg-success" : "bg-muted-foreground")} />{running ? "البث المباشر نشط" : "البث متوقف — شغّل المحاكاة من الأعلى"}</span>}
      action={<div className="flex flex-wrap gap-2 text-xs">
        {(["all", "critical", "abnormal", "normal"] as const).map((k) => <button key={k} onClick={() => setF(k)} className={cn("rounded-lg border px-3 py-1.5", f === k ? "border-primary/50 bg-primary/15 text-foreground" : "border-border text-muted-foreground")}>{{ all: "الكل", critical: "حرجة", abnormal: "غير طبيعية", normal: "طبيعية" }[k]}</button>)}
        <select value={sort} onChange={(e) => setSort(e.target.value as "sev" | "time")} className="rounded-lg border border-border bg-muted px-2"><option value="sev">حسب الخطورة</option><option value="time">حسب الوقت</option></select>
      </div>}>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-right text-xs text-muted-foreground"><th className="p-2">العينة</th><th className="p-2">الوقت</th><th className="p-2">القسم</th>{PARAMS.slice(0, 5).map((p) => <th key={p.key} className="p-2 font-mono">{p.key}</th>)}<th className="p-2">التصنيف</th><th className="p-2">الحالة</th><th /></tr></thead>
        <tbody>{list.map((s) => <tr key={s.id} className={cn("row-in border-t border-border", s.severity === "critical" && s.status === "pending" && "bg-destructive/5")}>
          <td className="p-2 font-mono">{s.id}</td><td className="p-2 tabular-nums text-muted-foreground">{fmtTime(s.at)}</td><td className="p-2">{s.ward}</td>
          {PARAMS.slice(0, 5).map((p) => { const fl = s.flags.find((x) => x.key === p.key); return <td key={p.key} className={cn("p-2 tabular-nums", fl?.critical ? "font-bold text-destructive" : fl ? "text-warning" : "")}>{s.values[p.key]}{fl && (fl.dir === "low" ? " ↓" : " ↑")}</td>; })}
          <td className="p-2"><SevBadge s={s.severity} /></td><td className="p-2 text-xs">{s.status === "reviewed" ? <span className="text-success">تمت المراجعة</span> : <span className="text-muted-foreground">بانتظار</span>}</td>
          <td className="p-2"><Link to="/samples/$id" params={{ id: s.id }} className="text-xs text-primary">فتح</Link></td></tr>)}</tbody>
      </table></div>
    </Card>
  );
}
