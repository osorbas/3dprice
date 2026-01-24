"use client";

import { useMemo } from "react";
import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { 
  format, 
  isAfter, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  min
} from "date-fns";
import { ptBR } from "date-fns/locale";

type Timeframe = "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "always";

export function useDashboardData(timeframe: Timeframe = "daily") {
  const { calculations, clearCalculations } = usePrintCalculations();

  const dashboardData = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    
    // Configuração do Histórico (Gráficos)
    let historyStartDate: Date;
    let numPeriods = 30;

    switch (timeframe) {
      case "daily":
        historyStartDate = subDays(today, 29);
        numPeriods = 30;
        break;
      case "weekly":
        historyStartDate = subWeeks(startOfWeek(today, { locale: ptBR }), 29);
        numPeriods = 30;
        break;
      case "biweekly":
        historyStartDate = subDays(today, 29 * 14);
        numPeriods = 30;
        break;
      case "monthly":
        historyStartDate = subMonths(startOfMonth(today), 11);
        numPeriods = 12;
        break;
      case "yearly":
        historyStartDate = subYears(startOfYear(today), 4);
        numPeriods = 5;
        break;
      case "always":
        // Se houver cálculos, usa a data do mais antigo. Caso contrário, usa 1 ano atrás como padrão.
        if (calculations.length > 0) {
          const oldestTimestamp = Math.min(...calculations.map(c => c.timestamp));
          historyStartDate = startOfMonth(new Date(oldestTimestamp));
        } else {
          historyStartDate = subMonths(startOfMonth(today), 11);
        }
        // No modo 'Sempre', agrupamos por mês para o gráfico não ficar sobrecarregado
        numPeriods = Math.max(12, Math.ceil((now.getTime() - historyStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1);
        break;
      default:
        historyStartDate = subDays(today, 29);
        numPeriods = 30;
    }

    // Filtrar cálculos para o gráfico (Histórico completo conforme o período definido)
    const historyCalculations = calculations.filter(calc =>
      isAfter(new Date(calc.timestamp), historyStartDate) || isSameDay(new Date(calc.timestamp), historyStartDate)
    );

    // Filtrar cálculos para os cartões de resumo (Período específico e atual)
    const summaryCalculations = calculations.filter(calc => {
      const calcDate = new Date(calc.timestamp);
      switch (timeframe) {
        case "daily": return isSameDay(calcDate, now);
        case "weekly": return isSameWeek(calcDate, now, { locale: ptBR });
        case "biweekly": return isAfter(calcDate, subDays(now, 14));
        case "monthly": return isSameMonth(calcDate, now);
        case "yearly": return isSameYear(calcDate, now);
        case "always": return true; // Inclui tudo
        default: return isSameDay(calcDate, now);
      }
    });

    // Totais para os cartões de resumo
    let totalRevenue = 0;
    let totalEstimatedProfit = 0;
    let totalPrintTimeHours = 0;
    let totalFilamentUsedGrams = 0;
    let totalMaterialCost = 0;
    let totalElectricityCost = 0;
    let totalLaborCost = 0;
    let totalExtraCost = 0;

    summaryCalculations.forEach((calc) => {
      const revenue = Number(calc.totalPrice) || 0;
      const matCost = Number(calc.materialCost) || 0;
      const elecCost = Number(calc.electricityCost) || 0;
      const labCost = Number(calc.laborCost) || 0;
      const extCost = Number(calc.extraCost) || 0;
      
      totalRevenue += revenue;
      totalMaterialCost += matCost;
      totalElectricityCost += elecCost;
      totalLaborCost += labCost;
      totalExtraCost += extCost;
      totalFilamentUsedGrams += Number(calc.filamentGrams) || 0;
      totalPrintTimeHours += Number(calc.printTimeHours) || 0;
      
      const baseCost = matCost + elecCost + labCost + extCost;
      totalEstimatedProfit += (revenue - baseCost);
    });

    const totalCosts = totalMaterialCost + totalElectricityCost + totalLaborCost + totalExtraCost;
    const averageProfitMargin = totalRevenue > 0 ? (totalEstimatedProfit / totalRevenue) * 100 : 0;

    // Gerar dados do gráfico
    const periodDataMap = new Map<string, { revenue: number; costs: number; calculations: number }>();
    let currentPeriodStart = historyStartDate;

    for (let i = 0; i < numPeriods; i++) {
      let periodKey = "";
      let nextPeriodStart: Date;

      // No modo 'Sempre', forçamos agrupamento mensal para clareza
      const effectiveTimeframe = timeframe === "always" ? "monthly" : timeframe;

      if (effectiveTimeframe === "daily") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 1);
      } else if (effectiveTimeframe === "weekly") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR }) + " - " + format(addDays(currentPeriodStart, 6), "dd/MM", { locale: ptBR });
        nextPeriodStart = addWeeks(currentPeriodStart, 1);
      } else if (effectiveTimeframe === "biweekly") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR }) + " - " + format(addDays(currentPeriodStart, 13), "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 14);
      } else if (effectiveTimeframe === "monthly") {
        periodKey = format(currentPeriodStart, "MM/yyyy", { locale: ptBR });
        nextPeriodStart = addMonths(currentPeriodStart, 1);
      } else if (effectiveTimeframe === "yearly") {
        periodKey = format(currentPeriodStart, "yyyy", { locale: ptBR });
        nextPeriodStart = addYears(currentPeriodStart, 1);
      } else {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 1);
      }

      periodDataMap.set(periodKey, { revenue: 0, costs: 0, calculations: 0 });
      currentPeriodStart = nextPeriodStart;
      
      // Se já passámos a data atual no loop, paramos (apenas para modo Sempre)
      if (timeframe === "always" && currentPeriodStart > now) break;
    }

    historyCalculations.forEach(calc => {
      const calcDate = new Date(calc.timestamp);
      let periodKey = "";
      const effectiveTimeframe = timeframe === "always" ? "monthly" : timeframe;

      if (effectiveTimeframe === "daily") {
        periodKey = format(startOfDay(calcDate), "dd/MM", { locale: ptBR });
      } else if (effectiveTimeframe === "weekly") {
        const sw = startOfWeek(calcDate, { locale: ptBR });
        periodKey = format(sw, "dd/MM", { locale: ptBR }) + " - " + format(addDays(sw, 6), "dd/MM", { locale: ptBR });
      } else if (effectiveTimeframe === "biweekly") {
        const diffWeeks = Math.floor((startOfWeek(calcDate, { locale: ptBR }).getTime() - historyStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biWeekOffset = Math.floor(diffWeeks / 2) * 2;
        const startOfBiWeek = addWeeks(historyStartDate, biWeekOffset);
        periodKey = format(startOfBiWeek, "dd/MM", { locale: ptBR }) + " - " + format(addDays(startOfBiWeek, 13), "dd/MM", { locale: ptBR });
      } else if (effectiveTimeframe === "monthly") {
        periodKey = format(startOfMonth(calcDate), "MM/yyyy", { locale: ptBR });
      } else if (effectiveTimeframe === "yearly") {
        periodKey = format(startOfYear(calcDate), "yyyy", { locale: ptBR });
      } else {
        periodKey = format(startOfDay(calcDate), "dd/MM", { locale: ptBR });
      }

      const entry = periodDataMap.get(periodKey);
      if (entry) {
        entry.revenue += Number(calc.totalPrice) || 0;
        entry.costs += (Number(calc.materialCost) || 0) + (Number(calc.electricityCost) || 0) + (Number(calc.laborCost) || 0) + (Number(calc.extraCost) || 0);
        entry.calculations += 1;
        periodDataMap.set(periodKey, entry);
      }
    });

    const revenueVsCostsData = Array.from(periodDataMap.entries()).map(([name, data]) => ({
      name,
      Receita: parseFloat(data.revenue.toFixed(2)),
      Custos: parseFloat(data.costs.toFixed(2)),
    }));

    const calculationsPerPeriodData = Array.from(periodDataMap.entries()).map(([name, data]) => ({
      name,
      "Cálculos": data.calculations,
    }));

    const costDistributionData = [
      { name: "Material", value: totalMaterialCost, percentage: totalCosts > 0 ? (totalMaterialCost / totalCosts) * 100 : 0 },
      { name: "Eletricidade", value: totalElectricityCost, percentage: totalCosts > 0 ? (totalElectricityCost / totalCosts) * 100 : 0 },
      { name: "Mão de Obra", value: totalLaborCost, percentage: totalCosts > 0 ? (totalLaborCost / totalCosts) * 100 : 0 },
      { name: "Extras", value: totalExtraCost, percentage: totalCosts > 0 ? (totalExtraCost / totalCosts) * 100 : 0 },
    ];

    return {
      totalCalculations: summaryCalculations.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      estimatedProfit: parseFloat(totalEstimatedProfit.toFixed(2)),
      averageProfitMargin: parseFloat(averageProfitMargin.toFixed(0)),
      totalPrintTimeHours: Math.floor(totalPrintTimeHours),
      totalPrintTimeMinutes: Math.round((totalPrintTimeHours - Math.floor(totalPrintTimeHours)) * 60),
      totalFilamentUsedKg: parseFloat((totalFilamentUsedGrams / 1000).toFixed(2)),
      totalFilamentUsedGrams: parseFloat(totalFilamentUsedGrams.toFixed(0)),
      totalCosts: parseFloat(totalCosts.toFixed(2)),
      revenueVsCostsData,
      costDistributionData,
      calculationsPerPeriodData,
    };
  }, [calculations, timeframe]);

  return { ...dashboardData, clearCalculations };
}