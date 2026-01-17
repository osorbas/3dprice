"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface CostDistributionChartProps {
  data: { name: string; value: number; percentage: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  value,
}: any) => {
  // Não renderiza rótulo/seta se o valor for zero para evitar sobreposição no centro
  if (value === 0) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-[10px] sm:text-xs font-medium fill-foreground"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export const CostDistributionChart = ({ data }: CostDistributionChartProps) => {
  const hasData = data.some(item => item.value > 0);

  if (!hasData) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Distribuição de Custos</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Aguardando dados de custos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Distribuição de Custos</CardTitle>
        <p className="text-sm text-muted-foreground">Breakdown por categoria</p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 40, right: 50, bottom: 40, left: 50 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={(props: any) => props.value > 0} // Só mostra a linha se houver valor
                label={renderCustomizedLabel}
                outerRadius={65}
                innerRadius={45}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string, props: any) => [
                  `€${value.toFixed(2)}`, 
                  `${name} (${props.payload.percentage.toFixed(0)}%)`
                ]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};