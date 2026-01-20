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
import { Receipt, Zap, Clock, TrendingUp, Box, Trash2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentSummaryData {
  id: string;
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
  onDelete: (id: string) => void;
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
    onOpenChange(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString("pt-PT");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Orçamento de Impressão 3D", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${date}`, 14, 30);
    doc.text(`Referência: ${data.printName}`, 14, 35);

    // Costs Table
    const tableData = [
      ["Descrição", "Valor (€)"],
      ["Custo de Filamento", data.materialCost.toFixed(2)],
      ["Custo de Energia", data.electricityCost.toFixed(2)],
      ["Mão de Obra", data.laborCost.toFixed(2)],
    ];

    if (data.extrasCost > 0) {
      tableData.push(["Custos Extras", data.extrasCost.toFixed(2)]);
    }

    autoTable(doc, {
      startY: 45,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] }, // Orange primary
    });

    // Summary Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Custo Base: €${data.baseCost.toFixed(2)}`, 14, finalY);
    doc.text(`Margem de Lucro (${data.profitMargin}%): €${data.profitAmount.toFixed(2)}`, 14, finalY + 7);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(249, 115, 22);
    doc.text(`Preço Final: €${data.totalPrice.toFixed(2)}`, 14, finalY + 18);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("3D Print Price Calculator - Gerado automaticamente", 14, doc.internal.pageSize.height - 10);

    doc.save(`Orcamento_${data.printName.replace(/\s+/g, "_")}.pdf`);
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

        <DialogFooter className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2 w-full">
            <Button 
              onClick={exportToPDF}
              variant="outline"
              className="flex-1 flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              Fechar
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleDelete} 
            className="w-full text-destructive hover:bg-destructive/5 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Apagar Registo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};