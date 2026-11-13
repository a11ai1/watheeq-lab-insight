import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Activity, BrainCircuit, FlaskConical, BellRing, Cpu, BarChart3, PlayCircle, Search, Pause, Play, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { onCritical, setRunning, useSim, flagReason, fmtTime, type Severity, SEV_AR, BASE } from "@/lib/sim";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 48 48" className="size-10 shrink-0 drop-shadow-[0_0_10px_var(--color-primary)]">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--color-primary)" /><stop offset="1" stopColor="var(--color-accent)" /></linearGradient></defs>
        <path d="M24 3 42 13.5v21L24 45 6 34.5v-21z" fill="none" stroke="url(#lg)" strokeWidth="2.5" />
        <path d="M24 12c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="url(#lg)" opacity=".9" />
        <path d="m20 27 3 3 5-6" fill="none" stroke="var(--color-background)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-xl font-bold text-gradient">وَثيق</div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">WATHEEQ LAB AI</div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/live", label: "المراقبة المباشرة", icon: Activity },
  { to: "/analysis", label: "التحليل الذكي", icon: BrainCircuit },
  { to: "/samples", label: "تفاصيل العينات", icon: FlaskConical },
  { to: "/alerts", label: "مركز التنبيهات", icon: BellRing },
  { to: "/devices", label: "أجهزة المختبر", icon: Cpu },
  { to: "/reports", label: "الإحصائيات والتقارير", icon: BarChart3 },
  { to: "/simulation", label: "المحاكاة المباشرة", icon: PlayCircle },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pending = useSim((s) => s.samples.filter((x) => x.severity === "critical" && x.status === "pending").length);
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar p-5 backdrop-blur-xl lg:flex">
      <Logo />
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all", active ? "bg-gradient-to-l from-primary/20 to-accent/10 text-foreground glow border border-primary/30" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")}>
              <n.icon className={cn("size-[18px]", active && "text-primary")} />
              <span className="flex-1">{n.label}</span>
              {n.to === "/alerts" && pending > 0 && <span className="rounded-full bg-destructive px-2 text-[11px] font-bold text-destructive-foreground">{pending}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="glass p-4 text-xs">
        <div className="flex items-center gap-2 text-success"><ShieldCheck className="size-4" /> النظام يعمل بكفاءة</div>
        <p className="mt-2 text-muted-foreground">بيانات اصطناعية لأغراض العرض — MEDATHON 2026</p>
      </div>
    </aside>
  );
}

export function Topbar() {
  const running = useSim((s) => s.running);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const title = [...NAV].reverse().find((n) => (n.to === "/" ? path === "/" : path.startsWith(n.to)))?.label ?? "";
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-border bg-background/60 px-6 py-4 backdrop-blur-xl">
      <div className="lg:hidden"><Logo compact /></div>
      <div>
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="text-xs text-muted-foreground">مختبر الدم المركزي • {fmtTime(BASE)} • تحديث لحظي</p>
      </div>
      <form className="mr-auto flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate({ to: "/samples", search: { q: q.trim() } }); }}>
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم العينة أو اسم المريض" className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </form>
      <button onClick={() => setRunning(!running)} className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all", running ? "border border-destructive/40 bg-destructive/15 text-destructive" : "bg-gradient-to-l from-primary to-accent text-primary-foreground glow hover:brightness-110")}>
        {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        {running ? "إيقاف المحاكاة" : "تشغيل المحاكاة"}
        {running && <span className="size-2 animate-pulse rounded-full bg-destructive" />}
      </button>
      <div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">ل</div><div className="hidden text-xs sm:block"><div className="font-semibold">د. ليان الحارثي</div><div className="text-muted-foreground">أخصائية مختبر</div></div></div>
    </header>
  );
}

export function MobileNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
      {NAV.map((n) => <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-muted-foreground" activeProps={{ className: "bg-primary/20 text-foreground" }}>{n.label}</Link>)}
    </nav>
  );
}

export function CriticalWatcher() {
  const navigate = useNavigate();
  useEffect(() => onCritical((s) => {
    toast.error(`نتيجة حرجة — ${s.id}`, {
      description: `${s.flags.filter((f) => f.critical).map(flagReason).join("، ")} • ${s.ward}`,
      action: { label: "مراجعة", onClick: () => navigate({ to: "/samples/$id", params: { id: s.id } }) },
      duration: 7000,
    });
  }), [navigate]);
  return null;
}

export function Card({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass p-5", className)}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-display text-sm font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; sub?: ReactNode; icon: React.ComponentType<{ className?: string }>; tone?: "primary" | "accent" | "destructive" | "success" | "info" }) {
  const t = { primary: "text-primary bg-primary/15", accent: "text-accent bg-accent/15", destructive: "text-destructive bg-destructive/15", success: "text-success bg-success/15", info: "text-info bg-info/15" }[tone];
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className={cn("absolute -top-10 -left-10 size-28 rounded-full opacity-30 blur-2xl", t.split(" ")[1])} />
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl", t)}><Icon className="size-[18px]" /></span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Radial({ value, label, color = "var(--color-primary)", size = 110 }: { value: number; label: string; color?: string; size?: number }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: "stroke-dashoffset .8s", filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" transform="rotate(90 50 50)" className="fill-foreground font-display text-[18px] font-bold">{Math.round(value)}%</text>
      </svg>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function SevBadge({ s }: { s: Severity }) {
  const c = { critical: "bg-destructive/15 text-destructive border-destructive/40", abnormal: "bg-warning/15 text-warning border-warning/40", normal: "bg-success/15 text-success border-success/40" }[s];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", c)}><span className={cn("size-1.5 rounded-full bg-current", s === "critical" && "animate-pulse")} />{SEV_AR[s]}</span>;
}

export const tip = { contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }, labelStyle: { color: "var(--color-muted-foreground)" } };
