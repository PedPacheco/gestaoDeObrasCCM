"use client";
import { memo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface DailyPerformanceItem {
  date: string;
  executado: number;
  meta: number;
  percentual: number;
}

interface DailyPerformanceChartProps {
  data: DailyPerformanceItem[];
}

export const DailyPerformanceChart = memo(function DailyPerformanceChart({
  data,
}: DailyPerformanceChartProps) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Diária
        </h3>
        <p className="text-sm text-gray-500">
          Evolução do executado versus meta diária
        </p>
      </header>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="executado"
              name="Executado"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="meta"
              name="Meta"
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="6 6"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
