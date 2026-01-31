"use client";
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PrintCalculation, ExtraUsageDetail } from "@/hooks/use-print-calculations";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { Package, Box, Zap, Clock, Printer, Layers } from "lucide-react";
import { usePrinters } from "@/hooks/use-printers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalculationDetailsDialogProps {
  calculation: PrintCalculation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalculationDetailsDialog = ({ calculation, isOpen, onOpenChange }: CalculationDetailsDialogProps) => {
  const { filaments } = useFilaments();
  const { extraMaterials } = useExtraMaterials();
  const { printers } = usePrinters();

  if (!calculation) return null;

  const renderFilamentDetails = (filamentsUsed: PrintCalculation['filaments']) => {
    if (!filamentsUsed || filamentsUsed.length === 0) {
      return <p className="text-sm text-muted-foreground italic">Nenhum filamento registado.</p>;
    }

    return (
      <div className="space-y-2">
        {filamentsUsed.map((usage, index) => {
          const filament = filaments.find(f => f.id === usage.filamentId);
          const name = filament ? (filament.name || `${filament.brand} ${filament.type}`) : "Filamento Desconhecido";
          const costPerGram = filament ? filament.pricePerKg / 1000 : 0;
          const cost = usage.grams * costPerGram;

          return (
            <div key={index} className="flex justify-between text-sm border-b border-dashed pb-1 last:border-b-0">
              <span className="font-medium truncate">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{usage.grams.toFixed(2)} g</span>
                <span className="font-semibold">€{cost.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExtraDetails = (extrasUsed: ExtraUsageDetail[] | undefined) => {
    if (!extrasUsed || extrasUsed.length === 0) {
      return <p className="text-sm text-muted-foreground italic">Nenhum material extra registado.</p>;
    }

    return (
      <div className="space-y-2">
        {extrasUsed.map((usage, index) => {
          const material = extraMaterials.find(m => m.id === usage.materialId);
          const name = material ? material.name : "Material Desconhecido";
          const unit = material ? material.unit : "unidade";
          const cost = usage.cost; // Cost is now guaranteed to be on ExtraUsageDetail

          return (
            <div key={index} className="flex justify-between text-sm border-b border-dashed pb-1 last:border-b-0">
              <span className="font-medium truncate">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{usage.quantity.toFixed(2)} {unit}</span>
                <span className="font-semibold">€{cost.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPartDetails = (parts: PrintCalculation['projectParts']) => {
    if (!parts || parts.length === 0) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" /> Detalhes das Partes ({parts.length})
        </h3>
        {parts.map((part, index) => {
          const printer = printers.find(p => p.id === part.printerId);
          const hours = part.printTimeHours;
          const minutes = Math.round((hours - Math.floor(hours)) * 60);
          const displayTime = `${Math.floor(hours)}h ${minutes}m`;

          return (
            <div key={index} className="border p-4 rounded-lg bg-muted/20 space-y-3">
              <h4 className="font-bold text-base">{part.partName}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Printer className="h-4 w-4" /> {printer?.name || "N/A"}</div>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {displayTime}</div>
                <div className="flex items-center gap-1"><Zap className="h-4 w-4" /> Energia: €{part.electricityCost.toFixed(2)}</div>
                <div className="flex items-center gap-1"><Package className="h-4 w-4" /> Material: €{part.materialCost.toFixed(2)}</div>
              </div>
              <Separator className="my-2" />
              <h5 className="text-sm font-medium">Filamentos da Parte:</h5>
              {renderFilamentDetails(part.filaments)}
            </div>
          );
        })}
      </div>
    );
  };

  const isProject = !!calculation.isProject;
  const title = isProject ? (calculation.projectName || "Projeto") : (calculation.printName || "Cálculo");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            Detalhes completos do registo de {isProject ? "projeto" : "cálculo"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Detalhes Gerais */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">{format(new Date(calculation.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Preço Total</p>
              <p className="font-bold text-lg text-primary">€{calculation.totalPrice.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          {/* Filamentos Usados */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" /> Filamentos Usados
            </h3>
            {renderFilamentDetails(calculation.filaments)}
          </div>

          {/* Materiais Extras */}
          {calculation.extraCost > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Box className="h-5 w-5" /> Materiais Extras
                </h3>
                {renderExtraDetails(calculation.extras)}
              </div>
            </>
          )}

          {/* Detalhes do Projeto (se for projeto) */}
          {isProject && calculation.projectParts && (
            <>
              <Separator />
              {renderPartDetails(calculation.projectParts)}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};