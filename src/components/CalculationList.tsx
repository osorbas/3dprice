"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintCalculation } from "@/hooks/use-print-calculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2, Printer, Eye } from "lucide-react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditCalculationDialog } from "@/components/EditCalculationDialog";
import { CalculationDetailsDialog } from "@/components/CalculationDetailsDialog"; // Importado
import { usePrinters } from "@/hooks/use-printers";
import { exportCalculationToPDF } from "@/utils/pdf-export";

interface CalculationListProps {
  calculations: PrintCalculation[];
}

export const CalculationList = ({ calculations }: CalculationListProps) => {
  const { deleteCalculation } = usePrintCalculations();
  const { printers } = usePrinters();
  const [selectedCalculation, setSelectedCalculation] = React.useState<PrintCalculation | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

  const handleDeleteCalculation = (id: string) => {
    try {
      deleteCalculation(id);
      showSuccess("Cálculo excluído com sucesso!");
    } catch (error) {
      showError("Erro ao excluir cálculo.");
      console.error("Delete calculation error:", error);
    }
  };

  const handlePrint = (calc: PrintCalculation) => {
    const matCost = Number(calc.materialCost) || 0;
    const elecCost = Number(calc.electricityCost) || 0;
    const labCost = Number(calc.laborCost) || 0;
    const extCost = Number(calc.extraCost) || 0;
    const totPrice = Number(calc.totalPrice) || 0;
    const profMarg = Number(calc.profitMargin) || 0;

    const baseCost = matCost + elecCost + labCost + extCost;
    const profitAmount = totPrice - baseCost;

    exportCalculationToPDF({
      printName: calc.isProject ? (calc.projectName || "Projeto sem nome") : (calc.printName || "Impressão sem nome"),
      materialCost: matCost,
      electricityCost: elecCost,
      laborCost: labCost,
      extrasCost: extCost,
      baseCost: baseCost,
      profitMargin: profMarg,
      profitAmount: profitAmount,
      totalPrice: totPrice,
    });
  };

  const handleOpenDetails = (calc: PrintCalculation) => {
    setSelectedCalculation(calc);
    setIsDetailsDialogOpen(true);
  };

  if (calculations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Cálculos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Nenhum cálculo ainda. Comece a calcular!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Cálculos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Impressora</TableHead>
                  <TableHead>Material (€)</TableHead>
                  <TableHead>Tempo (h)</TableHead>
                  <TableHead>Eletricidade (€)</TableHead>
                  <TableHead>Mão de Obra (€)</TableHead>
                  <TableHead>Lucro (%)</TableHead>
                  <TableHead className="text-right">Preço Total (€)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => {
                  let printerDisplay = "N/A";

                  if (calc.isProject && calc.projectParts && calc.projectParts.length > 0) {
                    const uniquePrinterIds = new Set(calc.projectParts.map(part => part.printerId));
                    if (uniquePrinterIds.size > 1) {
                      printerDisplay = "Várias Impressoras";
                    } else if (uniquePrinterIds.size === 1) {
                      const singlePrinterId = Array.from(uniquePrinterIds)[0];
                      const printer = printers.find(p => p.id === singlePrinterId);
                      printerDisplay = printer ? printer.name : "N/A";
                    }
                  } else if (!calc.isProject && calc.printerId) {
                    const printer = printers.find(p => p.id === calc.printerId);
                    printerDisplay = printer ? printer.name : "N/A";
                  }

                  const matCost = Number(calc.materialCost) || 0;
                  const hours = Number(calc.printTimeHours) || 0;
                  const elecCost = Number(calc.electricityCost) || 0;
                  const labCost = Number(calc.laborCost) || 0;
                  const profMarg = Number(calc.profitMargin) || 0;
                  const totPrice = Number(calc.totalPrice) || 0;

                  return (
                    <TableRow key={calc.id}>
                      <TableCell>{format(new Date(calc.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>{calc.isProject ? calc.projectName : calc.printName || "N/A"}</TableCell>
                      <TableCell>{printerDisplay}</TableCell>
                      <TableCell>{matCost.toFixed(2)}</TableCell>
                      <TableCell>{hours.toFixed(1)}</TableCell>
                      <TableCell>{elecCost.toFixed(2)}</TableCell>
                      <TableCell>{labCost.toFixed(2)}</TableCell>
                      <TableCell>{profMarg.toFixed(0)}</TableCell>
                      <TableCell className="text-right font-semibold">{totPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenDetails(calc)}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Detalhes</span>
                          </Button>
                          
                          <EditCalculationDialog calculation={calc} />
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0"
                            onClick={() => handlePrint(calc)}
                            title="Imprimir Orçamento (PDF)"
                          >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Imprimir Orçamento</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Excluir Cálculo</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso removerá permanentemente o cálculo do histórico.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCalculation(calc.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <CalculationDetailsDialog 
        calculation={selectedCalculation} 
        isOpen={isDetailsDialogOpen} 
        onOpenChange={setIsDetailsDialogOpen} 
      />
    </>
  );
};