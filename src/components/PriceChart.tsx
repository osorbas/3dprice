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
import { PrintCalculation } from "@/hooks/use-print-calculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PriceChartProps {
  calculations: PrintCalculation[];
}

export const PriceChart = ({ calculations }: PriceChartProps) => {
  // Limit to the last 10 calculations for better readability in the chart
  const chartData = calculations.slice(0, 10).reverse().map((calc) => ({
    name: format(new Date(calc.timestamp), "dd/MM HH:mm", { locale: ptBR }),
    "Preço Total": calc.totalPrice,
    "Custo Base": calc.materialCost + (calc.printTimeHours * calc.electricityCost) + calc.laborCost,
  }));

  if (calculations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gráfico de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Nenhum dado para exibir no gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gráfico de Preços (Últimos 10 Cálculos)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Preço Total"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Custo Base"
                stroke="hsl(var(--secondary))"
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