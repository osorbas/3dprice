"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Zap, Clock, TrendingUp, Box, Trash2 } from "lucide-react";

interface PaymentSummaryData {
  id: string; // Adicionado ID para permitir exclusão
  printName: string;
  materialCost: number;
  electricityCost: number;
  laborCost: number;
  extrasCost: number;
  baseCost: number;
  profitMargin: number;
  profitAmount: number;
  totalPrice: number;
}

interface PaymentSummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: PaymentSummaryData | null;
  onDelete: (id: string) => void; // Nova prop para apagar o cálculo
}

export const PaymentSummaryDialog = ({
  isOpen,
  onOpenChange,
  data,
  onDelete,
}: PaymentSummaryDialogProps) => {
  if (!data) return null;

  const handleDelete = () => {
    onDelete(data.id);
    onOpenChange(false); // Fecha o diálogo após a exclusão
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6 text-primary" />
            Resumo do Pagamento
          </DialogTitle>
          <DialogDescription>
            Aqui está o detalhamento do valor para <strong>{data.printName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Box className="h-4 w-4" /> Filamento
            </div>
            <div className="text-right font-medium">€{data.materialCost.toFixed(2)}</div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" /> Energia
            </div>
            <div className="text-right font-medium">€{data.electricityCost.toFixed(2)}</div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Mão de Obra
            </div>
            <div className="text-right font-medium">€{data.laborCost.toFixed(2)}</div>

            {data.extrasCost > 0 && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Box className="h-4 w-4" /> Extras
                </div>
                <div className="text-right font-medium">€{data.extrasCost.toFixed(2)}</div>
              </>
            )}

            <div className="col-span-2 my-1">
              <Separator />
            </div>

            <div className="font-semibold">Custo Base</div>
            <div className="text-right font-semibold">€{data.baseCost.toFixed(2)}</div>

            <div className="flex items-center gap-2 text-muted-foreground italic">
              <TrendingUp className="h-4 w-4" /> Lucro ({data.profitMargin}%)
            </div>
            <div className="text-right text-muted-foreground italic">€{data.profitAmount.toFixed(2)}</div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center mt-4">
            <span className="text-lg font-bold">Preço Final</span>
            <span className="text-2xl font-black text-primary">€{data.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-4">
          {/* Botão Fechar Resumo */}
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Fechar Resumo
          </Button>
          
          {/* Botão Apagar Registo */}
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Apagar Registo</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};