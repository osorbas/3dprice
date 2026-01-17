"use client";

import { useMemo } from "react";
import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { format, subDays, isAfter, startOfDay, startOfWeek, startOfMonth, startOfYear, addDays, addWeeks, addMonths, addYears, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";

type Timeframe = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

export function useDashboardData(timeframe: Timeframe = "daily") {
  const { calculations, clearCalculations } = usePrintCalculations();

  const dashboardData = useMemo(() => {
    const today = startOfDay(new Date());
    let startDate: Date;
    let endPeriodDate = today;
    let numPeriods = 30;

    switch (timeframe) {
      case "daily":
        startDate = subDays(today, 29);
        numPeriods = 30;
        break;
      case "weekly":
        startDate = subDays(today, 29 * 7);
        startDate = startOfWeek(startDate, { locale: ptBR });
        numPeriods = 30;
        break;
      case "biweekly":
        startDate = subDays(today, 29 * 14);
        startDate = startOfWeek(startDate, { locale: ptBR });
        numPeriods = 30;
        break;
      case "monthly":
        startDate = subMonths(today, 11);
        startDate = startOfMonth(startDate);
        numPeriods = 12;
        break;
      case "yearly":
        startDate = subYears(today, 4);
        startDate = startOfYear(startDate);
        numPeriods = 5;
        break;
      default:
        startDate = subDays(today, 29);
        numPeriods = 30;
    }

    const filteredCalculations = calculations.filter(calc =>
      isAfter(new Date(calc.timestamp), startDate) || format(new Date(calc.timestamp), 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
    );

    const totalCalculations = calculations.length;
    let totalRevenue = 0;
    let totalEstimatedProfit = 0;
    let totalPrintTimeHours = 0;
    let totalFilamentUsedGrams = 0;
    let totalMaterialCost = 0;
    let totalElectricityCost = 0;
    let totalLaborCost = 0;
    let totalExtraCost = 0;

    calculations.forEach((calc) => {
      totalRevenue += calc.totalPrice;
      const baseCost = calc.materialCost + calc.electricityCost + calc.laborCost + (calc.extraCost || 0);
      totalEstimatedProfit += (calc.totalPrice - baseCost);
      totalPrintTimeHours += calc.printTimeHours;
      totalFilamentUsedGrams += calc.filamentGrams;
      totalMaterialCost += calc.materialCost;
      totalElectricityCost += calc.electricityCost;
      totalLaborCost += calc.laborCost;
      totalExtraCost += (calc.extraCost || 0);
    });

    const totalCosts = totalMaterialCost + totalElectricityCost + totalLaborCost + totalExtraCost;
    const averageProfitMargin = totalRevenue > 0 ? (totalEstimatedProfit / totalRevenue) * 100 : 0;

    const periodDataMap = new Map<string, { revenue: number; costs: number; calculations: number }>();

    let currentPeriodStart = startDate;
    for (let i = 0; i < numPeriods; i++) {
      let periodKey = "";
      let nextPeriodStart: Date;

      if (timeframe === "daily") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 1);
      } else if (timeframe === "weekly") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR }) + " - " + format(addDays(currentPeriodStart, 6), "dd/MM", { locale: ptBR });
        nextPeriodStart = addWeeks(currentPeriodStart, 1);
      } else if (timeframe === "biweekly") {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR }) + " - " + format(addDays(currentPeriodStart, 13), "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 14);
      } else if (timeframe === "monthly") {
        periodKey = format(currentPeriodStart, "MM/yyyy", { locale: ptBR });
        nextPeriodStart = addMonths(currentPeriodStart, 1);
      } else if (timeframe === "yearly") {
        periodKey = format(currentPeriodStart, "yyyy", { locale: ptBR });
        nextPeriodStart = addYears(currentPeriodStart, 1);
      } else {
        periodKey = format(currentPeriodStart, "dd/MM", { locale: ptBR });
        nextPeriodStart = addDays(currentPeriodStart, 1);
      }

      periodDataMap.set(periodKey, { revenue: 0, costs: 0, calculations: 0 });
      currentPeriodStart = nextPeriodStart;
    }

    filteredCalculations.forEach(calc => {
      const calcDate = new Date(calc.timestamp);
      let periodKey = "";

      if (timeframe === "daily") {
        periodKey = format(startOfDay(calcDate), "dd/MM", { locale: ptBR });
      } else if (timeframe === "weekly") {
        periodKey = format(startOfWeek(calcDate, { locale: ptBR }), "dd/MM", { locale: ptBR }) + " - " + format(addDays(startOfWeek(calcDate, { locale: ptBR }), 6), "dd/MM", { locale: ptBR });
      } else if (timeframe === "biweekly") {
        const diffWeeks = Math.floor((startOfWeek(calcDate, { locale: ptBR }).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const biWeekOffset = Math.floor(diffWeeks / 2) * 2;
        const startOfBiWeek = addWeeks(startDate, biWeekOffset);
        periodKey = format(startOfBiWeek, "dd/MM", { locale: ptBR }) + " - " + format(addDays(startOfBiWeek, 13), "dd/MM", { locale: ptBR });
      } else if (timeframe === "monthly") {
        periodKey = format(startOfMonth(calcDate), "MM/yyyy", { locale: ptBR });
      } else if (timeframe === "yearly") {
        periodKey = format(startOfYear(calcDate), "yyyy", { locale: ptBR });
      } else {
        periodKey = format(startOfDay(calcDate), "dd/MM", { locale: ptBR });
      }

      const entry = periodDataMap.get(periodKey) || { revenue: 0, costs: 0, calculations: 0 };
      entry.revenue += calc.totalPrice;
      entry.costs += (calc.materialCost + calc.electricityCost + calc.laborCost + (calc.extraCost || 0));
      entry.calculations += 1;
      periodDataMap.set(periodKey, entry);
    });

    const revenueVsCostsData = Array.from(periodDataMap.entries()).map(([date, data]) => ({
      name: date,
      Receita: parseFloat(data.revenue.toFixed(2)),
      Custos: parseFloat(data.costs.toFixed(2)),
    }));

    const calculationsPerPeriodData = Array.from(periodDataMap.entries()).map(([date, data]) => ({
      name: date,
      "Cálculos": data.calculations,
    }));

    const costDistributionData = [];
    if (totalCosts > 0) {
      costDistributionData.push(
        { name: "Material", value: parseFloat(totalMaterialCost.toFixed(2)), percentage: (totalMaterialCost / totalCosts) * 100 },
        { name: "Eletricidade", value: parseFloat(totalElectricityCost.toFixed(2)), percentage: (totalElectricityCost / totalCosts) * 100 },
        { name: "Mão de Obra", value: parseFloat(totalLaborCost.toFixed(2)), percentage: (totalLaborCost / totalCosts) * 100 },
        { name: "Extras", value: parseFloat(totalExtraCost.toFixed(2)), percentage: (totalExtraCost / totalCosts) * 100 },
      );
    } else {
      costDistributionData.push(
        { name: "Material", value: 0, percentage: 0 },
        { name: "Eletricidade", value: 0, percentage: 0 },
        { name: "Mão de Obra", value: 0, percentage: 0 },
        { name: "Extras", value: 0, percentage: 0 },
      );
    }

    return {
      totalCalculations,
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