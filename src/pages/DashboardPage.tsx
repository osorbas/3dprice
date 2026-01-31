"use client";
import React, { useEffect } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { RevenueVsCostsChart } from "@/components/dashboard/RevenueVsCostsChart";
import { CostDistributionChart } from "@/components/dashboard/CostDistributionChart";
import { CalculationsPerDayChart } from "@/components/dashboard/CalculationsPerDayChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Euro, TrendingUp, Clock, Package, BarChart3, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Timeframe = "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "always";

const DashboardPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<Timeframe>("daily");
  const { 
    totalCalculations, 
    totalRevenue, 
    estimatedProfit, 
    averageProfitMargin, 
    totalPrintTimeHours, 
    totalPrintTimeMinutes, 
    totalFilamentUsedKg, 
    totalFilamentUsedGrams, 
    totalCosts, 
    revenueVsCostsData, 
    costDistributionData, 
    calculationsPerPeriodData,
    rawCalculations // Nova exportação do hook para verificar se há dados totais
  } = useDashboardData(selectedTimeframe);

  // Efeito para mudar automaticamente para "Sempre" se o período diário (padrão) estiver vazio após uma importação ou carga inicial
  useEffect(() => {
    if (selectedTimeframe === "daily" && totalCalculations === 0 && rawCalculations.length > 0) {
      setSelectedTimeframe("always");
    }
  }, [totalCalculations, rawCalculations.length, selectedTimeframe]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Estatísticas e análise de custos</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border p-2 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 px-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <Select value={selectedTimeframe} onValueChange={(value: Timeframe) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Selecionar Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário (30 dias)</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quinzenal</SelectItem>
              <SelectItem value="monthly">Mensal (12 meses)</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
              <SelectItem value="always">Sempre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {rawCalculations.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhum dado registado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Não existem orçamentos registados na aplicação. Começa a fazer novos cálculos!</p>
          </CardContent>
        </Card>
      ) : totalCalculations === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Período sem dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Não existem orçamentos neste período específico. Tenta o filtro "Sempre".</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <OverviewCard 
              title="Total de Cálculos" 
              value={totalCalculations.toString()} 
              description="Orçamentos realizados" 
              icon={Calculator} 
            />
            <OverviewCard 
              title="Receita Total" 
              value={`€${totalRevenue.toFixed(2)}`} 
              description="Valor total orçamentado" 
              icon={Euro} 
            />
            <OverviewCard 
              title="Lucro Estimado" 
              value={`€${estimatedProfit.toFixed(2)}`} 
              description={`Margem média: ${averageProfitMargin.toFixed(0)}%`} 
              icon={TrendingUp} 
            />
            <OverviewCard 
              title="Tempo Total" 
              value={`${totalPrintTimeHours}h ${totalPrintTimeMinutes}min`} 
              description="Horas de impressão" 
              icon={Clock} 
            />
            <OverviewCard 
              title="Filamento Usado" 
              value={`${totalFilamentUsedKg.toFixed(2)} kg`} 
              description={`${totalFilamentUsedGrams.toFixed(0)}g total`} 
              icon={Package} 
            />
            <OverviewCard 
              title="Custos Totais" 
              value={`€${totalCosts.toFixed(2)}`} 
              description="Materiais e despesas" 
              icon={BarChart3} 
            />
          </div>
          
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <CardTitle>Receita vs Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueVsCostsChart data={revenueVsCostsData} />
              </CardContent>
            </Card>
            <CostDistributionChart data={costDistributionData} />
          </div>
          
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Cálculos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculationsPerDayChart data={calculationsPerPeriodData} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;