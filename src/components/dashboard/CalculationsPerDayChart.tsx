"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface CalculationsPerDayChartProps {
  data: { name: string; Cálculos: number }[];
}

export const CalculationsPerDayChart = ({ data }: CalculationsPerDayChartProps) => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cálculos por Período</CardTitle>
        <p className="text-sm text-muted-foreground">Número de orçamentos realizados</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="Cálculos" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};