"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintCalculation } from "@/hooks/use-print-calculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditCalculationDialog } from "@/components/EditCalculationDialog";
import { usePrinters } from "@/hooks/use-printers"; // Importar usePrinters

interface CalculationListProps {
  calculations: PrintCalculation[];
}

export const CalculationList = ({ calculations }: CalculationListProps) => {
  const { deleteCalculation } = usePrintCalculations();
  const { printers } = usePrinters(); // Obter a lista de impressoras

  const handleDeleteCalculation = (id: string) => {
    try {
      deleteCalculation(id);
      showSuccess("Cálculo excluído com sucesso!");
    } catch (error) {
      showError("Erro ao excluir cálculo.");
      console.error("Delete calculation error:", error);
    }
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
                <TableHead>Impressora</TableHead> {/* Nova coluna para Impressora */}
                <TableHead>Material (€)</TableHead>
                <TableHead>Tempo (h)</TableHead>
                <TableHead>Eletricidade (€/h)</TableHead>
                <TableHead>Mão de Obra (€)</TableHead>
                <TableHead>Lucro (%)</TableHead>
                <TableHead className="text-right">Preço Total (€)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calc) => {
                const printer = printers.find(p => p.id === calc.printerId);
                const printerName = printer ? printer.name : "N/A"; // Encontrar o nome da impressora
                return (
                  <TableRow key={calc.id}>
                    <TableCell>{format(new Date(calc.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>{calc.isProject ? calc.projectName : calc.printName || "N/A"}</TableCell> {/* Ajustado para exibir o nome do projeto */}
                    <TableCell>{printerName}</TableCell> {/* Exibir o nome da impressora */}
                    <TableCell>{calc.materialCost.toFixed(2)}</TableCell>
                    <TableCell>{calc.printTimeHours.toFixed(1)}</TableCell>
                    <TableCell>{calc.electricityCost.toFixed(2)}</TableCell>
                    <TableCell>{calc.laborCost.toFixed(2)}</TableCell>
                    <TableCell>{calc.profitMargin.toFixed(0)}</TableCell>
                    <TableCell className="text-right font-semibold">{calc.totalPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditCalculationDialog calculation={calc} />
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
  );
};