"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface RevenueVsCostsChartProps {
  data: { name: string; Receita: number; Custos: number }[];
}

export const RevenueVsCostsChart = ({ data }: RevenueVsCostsChartProps) => {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Receita vs Custos</CardTitle>
        <p className="text-sm text-muted-foreground">Evolução dos valores por período</p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))"
                interval="preserveStartEnd" // Evita sobreposição pulando etiquetas se necessário
                minTickGap={30} // Espaço mínimo entre datas
              />
              <YAxis 
                stroke="hsl(var(--foreground))" 
                tickFormatter={(value) => `€${value.toFixed(0)}`} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => `€${value.toFixed(2)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Receita"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Custos"
                stroke="hsl(var(--destructive))"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};