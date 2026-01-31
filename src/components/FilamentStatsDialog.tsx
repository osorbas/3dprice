"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Filament } from "@/hooks/use-filaments";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { Package, TrendingUp, Clock, Euro, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilamentStatsDialogProps {
  filament: Filament;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FilamentStatsDialog = ({ filament, isOpen, onOpenChange }: FilamentStatsDialogProps) => {
  const { calculations } = usePrintCalculations();
  const manageStockEnabled = typeof window !== "undefined" ? localStorage.getItem("manage_filament_stock") === "true" : false;

  const stats = React.useMemo(() => {
    let totalGramsUsed = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalPrintTimeHours = 0;

    calculations.forEach(calc => {
      const filamentUsages = calc.filaments || (calc.filamentId ? [{ filamentId: calc.filamentId, grams: calc.filamentGrams }] : []);
      
      filamentUsages.forEach(usage => {
        if (usage.filamentId === filament.id) {
          totalGramsUsed += usage.grams;
          
          // Estimativa de custo e receita para este filamento específico no cálculo
          const costPerGram = filament.pricePerKg / 1000;
          const purchaseCostPerGram = (filament.purchasePrice ?? 0) / 1000;
          
          const materialCostForUsage = usage.grams * costPerGram;
          const materialPurchaseCostForUsage = usage.grams * purchaseCostPerGram;

          // Simplificação: assumimos que a margem de lucro do cálculo se aplica proporcionalmente ao custo do material
          // Isso é uma estimativa, pois o lucro real é calculado sobre o custo base total (incluindo eletricidade, mão de obra, etc.)
          
          // Para obter a receita e o custo de forma mais precisa, precisaríamos de mais detalhes do cálculo original,
          // mas para estatísticas de uso, vamos usar o custo de venda como proxy de receita por grama.
          
          totalRevenue += materialCostForUsage; // Usamos o preço de venda do material como 'receita'
          totalCost += materialPurchaseCostForUsage; // Usamos o preço de compra como 'custo'
          
          // O tempo de impressão é mais difícil de atribuir a um filamento específico em impressões multi-material ou projetos.
          // Vamos ignorar o tempo de impressão por filamento para evitar imprecisão, a menos que seja um cálculo de filamento único.
          if (!calc.isProject && calc.filamentId === filament.id) {
             totalPrintTimeHours += calc.printTimeHours;
          }
        }
      });
    });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : null;

    return {
      totalGramsUsed: parseFloat(totalGramsUsed.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      profitMargin: profitMargin,
      totalPrintTimeHours: parseFloat(totalPrintTimeHours.toFixed(1)),
    };
  }, [calculations, filament]);

  const currentGrams = filament.currentWeightGrams;
  const totalCapacityGrams = filament.weight * 1000;
  const stockPercent = Math.min(100, Math.max(0, (currentGrams / totalCapacityGrams) * 100));
  const isCritical = manageStockEnabled && stockPercent <= 10;

  const profitColorClass = stats.profitMargin === null ? "text-muted-foreground" : stats.profitMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Estatísticas de {filament.name || filament.type}
          </DialogTitle>
          <DialogDescription>
            Análise de uso e rentabilidade do filamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Stock Atual */}
            <div className="space-y-1 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Stock Atual</span>
                {isCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
              <p className={cn("text-2xl font-bold", isCritical && "text-red-600")}>
                {currentGrams >= 1000 ? `${(currentGrams / 1000).toFixed(2)} kg` : `${currentGrams.toFixed(0)} g`}
              </p>
              <p className="text-xs text-muted-foreground">
                {manageStockEnabled ? `Capacidade: ${filament.weight.toFixed(2)} kg` : "Gestão de stock desativada"}
              </p>
            </div>

            {/* Uso Total */}
            <div className="space-y-1 p-3 border rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Uso Total (Histórico)</span>
              <p className="text-2xl font-bold text-primary">
                {stats.totalGramsUsed >= 1000 ? `${(stats.totalGramsUsed / 1000).toFixed(2)} kg` : `${stats.totalGramsUsed.toFixed(0)} g`}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.totalGramsUsed > 0 ? `Média por cálculo: ${(stats.totalGramsUsed / calculations.length).toFixed(0)}g` : "Nenhum uso registado"}
              </p>
            </div>
          </div>

          <Separator />

          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Rentabilidade Estimada (Uso)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Receita Estimada</span>
              <p className="font-bold text-lg">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Custo de Compra</span>
              <p className="font-bold text-lg">€{stats.totalCost.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Lucro Estimado</span>
              <p className={cn("font-bold text-lg", profitColorClass)}>€{stats.profit.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Margem Média</span>
              <p className={cn("font-bold text-lg", profitColorClass)}>
                {stats.profitMargin !== null ? `${stats.profitMargin.toFixed(0)}%` : 'N/A'}
              </p>
            </div>
          </div>
          
          {stats.totalPrintTimeHours > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tempo de Impressão (Filamento Único):</span>
                <span className="font-semibold">{stats.totalPrintTimeHours.toFixed(1)} horas</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};