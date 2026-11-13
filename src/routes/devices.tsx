import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Thermometer, Gauge } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Card, Radial } from "@/components/w/ui";
import { useSimState, setDeviceStatus, type Device } from "@/lib/sim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "أجهزة المختبر — وَثيق WATHEEQ LAB AI" }, { name: "description", content: "حالة أجهزة تحليل CBC الافتراضية ونشاطها." }, { property: "og:title", content: "أجهزة المختبر — وَثيق" }, { property: "og:description", content: "حالة أجهزة تحليل CBC الافتراضية ونشاطها." }] }),
  component: Devices,
});
const ST: Record<Device["status"], [string, string]> = { online: ["متصل", "text-success bg-success/15"], busy: ["يعالج", "text-primary bg-primary/15"], maintenance: ["صيانة", "text-warning bg-warning/15"], offline: ["غير متصل", "text-destructive bg-destructive/15"] };

function Devices() {
  const st = useSimState();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {st.devices.map((d) => { const act = st.samples.filter((s) => s.device === d.id).slice(0, 20).reverse().map((s, i) => ({ i, v: s.tat })); return (
        <Card key={d.id} title={<span className="flex items-center gap-2"><Cpu className="size-4 text-primary" />{d.name}</span>} action={<span className={cn("rounded-full px-2.5 py-0.5 text-xs", ST[d.status][1])}>{ST[d.status][0]}</span>}>
          <div className="flex items-center gap-5">
            <Radial value={d.qc} label="ضبط الجودة QC" color={d.qc > 95 ? "var(--color-success)" : "var(--color-warning)"} size={96} />
            <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs text-muted-foreground">الطراز</div><div className="font-mono text-xs">{d.model}</div></div>
              <div className="rounded-lg bg-muted/40 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Gauge className="size-3" />العينات</div><div className="font-display text-xl font-bold tabular-nums">{d.processed}</div></div>
              <div className="rounded-lg bg-muted/40 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Thermometer className="size-3" />الحرارة</div><div className="tabular-nums">{d.temp}°C</div></div>
              <div className="h-16 rounded-lg bg-muted/40 p-1"><ResponsiveContainer><AreaChart data={act}><Area dataKey="v" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs">{(["online", "maintenance", "offline"] as const).map((s) => <button key={s} onClick={() => { setDeviceStatus(d.id, s); toast(`${d.name}: ${ST[s][0]}`); }} className={cn("rounded-lg border px-3 py-1.5", d.status === s ? "border-primary/50 bg-primary/15" : "border-border text-muted-foreground")}>{ST[s][0]}</button>)}</div>
        </Card>); })}
    </div>
  );
}
