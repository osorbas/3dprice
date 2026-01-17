"use client";
import React from "react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { CalculationList } from "@/components/CalculationList";
import { PriceChart } from "@/components/PriceChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePrinters } from "@/hooks/use-printers"; // Import usePrinters hook

const CalculationHistoryPage = () => {
  const { calculations } = usePrintCalculations();
  const { printers } = usePrinters();
  const [selectedPrinterId, setSelectedPrinterId] = React.useState<string>("all"); // State for selected printer filter

  const filteredCalculations = React.useMemo(() => {
    if (selectedPrinterId === "all") {
      return calculations;
    }
    return calculations.filter(calc => calc.printerId === selectedPrinterId);
  }, [calculations, selectedPrinterId]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Cálculos</h1>
          <p className="text-muted-foreground">Veja todos os seus cálculos anteriores</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="printer-filter-select" className="sr-only">Filtrar por Impressora</Label>
          <Select
            value={selectedPrinterId}
            onValueChange={setSelectedPrinterId}
            disabled={printers.length === 0}
          >
            <SelectTrigger id="printer-filter-select" className="w-[200px]">
              <SelectValue placeholder="Filtrar por Impressora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Impressoras</SelectItem>
              {printers.length === 0 ? (
                <SelectItem value="no-printers" disabled>Nenhuma impressora registada</SelectItem>
              ) : (
                printers.map((printer) => (
                  <SelectItem key={printer.id} value={printer.id}>
                    {printer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PriceChart calculations={filteredCalculations} />
      <CalculationList calculations={filteredCalculations} />
    </div>
  );
};

export default CalculationHistoryPage;