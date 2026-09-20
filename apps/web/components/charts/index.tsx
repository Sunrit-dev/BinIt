"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#7F1D1D", "#3B82F6", "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4", "#EC4899", "#84CC16"];

export function CategoryDonut({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#0b1f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#ecf8f1" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SeverityBar({ data }: { data: Record<string, number> }) {
  const rows = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].filter((k) => data[k]).map((k) => ({ name: k, count: data[k] }));
  if (rows.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: "#a7c9b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#a7c9b8", fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#0b1f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#ecf8f1" }} />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {rows.map((r) => (
            <Cell key={r.name} fill={COLORS[["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(r.name) % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: { date: string; inflow: number; resolved: number }[] }) {
  if (data.length === 0) return null;
  const rows = data.map((d) => ({ ...d, label: new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: "#a7c9b8", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={{ fill: "#a7c9b8", fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#0b1f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#ecf8f1" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="inflow" name="Reports filed" stroke="#10B981" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export { COLORS };