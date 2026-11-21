"use client";

import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { DashboardStats } from "@/types";

const BRAND = "#0f766e";
// Donut chart-এর রং (পাশাপাশি আলাদা করে চেনা যায়)
const PIE_COLORS = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#64748b"];
// এর বেশি অসুখ থাকলে বাকিগুলো "Others"-এ জমা হয়
const MAX_SLICES = 7;
const AXIS_TICK = { fontSize: 12, fill: "#475569" };

// "2026-11-20" -> "20 Nov" (timezone বদলে যাওয়ার ঝামেলা এড়াতে UTC ধরে)
function parseDay(date: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDay(date: string): string {
  const parsed = parseDay(date);
  return parsed ? parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : date;
}

function formatDayLong(date: string): string {
  const parsed = parseDay(date);
  return parsed
    ? parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : date;
}

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    // min-w-0: grid-এর ভেতরে chart যেন পাতার চেয়ে চওড়া হয়ে না যায়
    <section className={cn("min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-card", className)}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NoData({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm text-slate-500">{message}</p>;
}

// ---------- ১) সময় অনুযায়ী visit (area chart) ----------
const VisitsTrendChart = memo(function VisitsTrendChart({ data }: { data: DashboardStats["patientsByDay"] }) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);
  if (total === 0) return <NoData message="No visits recorded in the last 30 days." />;

  return (
    <div role="img" aria-label={`Area chart of daily patient visits over the last 30 days. Total ${total} visits.`}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
              <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={28} tick={AXIS_TICK} tickLine={false} />
          <YAxis allowDecimals={false} width={36} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={(label) => formatDayLong(String(label))} />
          <Area
            type="monotone"
            dataKey="count"
            name="Visits"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#visitsFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

// ---------- ২) প্রতি ডাক্তারের রোগী (আড়াআড়ি bar chart) ----------
const PatientsPerDoctorChart = memo(function PatientsPerDoctorChart({
  data,
}: {
  data: DashboardStats["patientsPerDoctor"];
}) {
  const rows = useMemo(() => data.map((item) => ({ ...item, label: shorten(item.name, 18) })), [data]);
  const summary = useMemo(() => rows.map((row) => `${row.name} ${row.count}`).join(", "), [rows]);

  if (rows.length === 0) return <NoData message="No patients assigned to doctors yet." />;

  // ডাক্তার বেশি হলে chart লম্বা হয়
  const height = Math.max(200, rows.length * 38 + 24);

  return (
    <div role="img" aria-label={`Bar chart of patients per doctor: ${summary}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} />
          <YAxis type="category" dataKey="label" width={120} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            labelFormatter={(_label, payload) => String(payload?.[0]?.payload?.name ?? "")}
          />
          <Bar dataKey="count" name="Patients" fill={BRAND} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// ---------- ৩) অসুখ অনুযায়ী ভাগ (donut chart) ----------
const ConditionsChart = memo(function ConditionsChart({ data }: { data: DashboardStats["conditions"] }) {
  const { slices, total } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const head = sorted.slice(0, MAX_SLICES);
    const restCount = sorted.slice(MAX_SLICES).reduce((sum, item) => sum + item.count, 0);
    const list = restCount > 0 ? [...head, { condition: "Others", count: restCount }] : head;
    return { slices: list, total: list.reduce((sum, item) => sum + item.count, 0) };
  }, [data]);

  if (total === 0) return <NoData message="No patient conditions recorded yet." />;

  const summary = slices.map((slice) => `${slice.condition} ${slice.count}`).join(", ");

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        role="img"
        aria-label={`Donut chart of patients by condition: ${summary}`}
        className="h-48 w-48 shrink-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="condition"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {slices.map((slice, index) => (
                <Cell key={slice.condition} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* chart-এর পাশে লেখা তালিকা: রং না দেখতে পেলেও সংখ্যা পড়া যায় */}
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((slice, index) => (
          <li key={slice.condition} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="truncate">{slice.condition}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {slice.count} ({Math.round((slice.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

function DashboardChartsInner({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Visits over time" description="Patient visits per day, last 30 days" className="lg:col-span-2">
        <VisitsTrendChart data={stats.patientsByDay} />
      </ChartCard>

      <ChartCard title="Patients per doctor" description="Top 10 doctors by number of patients">
        <PatientsPerDoctorChart data={stats.patientsPerDoctor} />
      </ChartCard>

      <ChartCard title="Patients by condition" description="Share of patients for each condition">
        <ConditionsChart data={stats.conditions} />
      </ChartCard>
    </div>
  );
}

// memo: data না বদলালে chart আবার আঁকা হয় না
export const DashboardCharts = memo(DashboardChartsInner);
