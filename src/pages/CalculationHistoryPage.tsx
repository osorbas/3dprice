"use client";
import React from "react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { CalculationList } from "@/components/CalculationList";
import { PriceChart } from "@/components/PriceChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePrinters } from "@/hooks/use-printers"; // Import usePrinters hook
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CalculationHistoryPage = () => {
  const { calculations } = usePrintCalculations();
  const { printers } = usePrinters();
  const [selectedPrinterId, setSelectedPrinterId] = React.useState<string>("all"); // State for selected printer filter
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10; // 10 items per page

  const filteredCalculations = React.useMemo(() => {
    if (selectedPrinterId === "all") {
      return calculations;
    }
    return calculations.filter(calc => calc.printerId === selectedPrinterId);
  }, [calculations, selectedPrinterId]);

  const totalPages = Math.ceil(filteredCalculations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCalculations = filteredCalculations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
            onValueChange={(value) => {
              setSelectedPrinterId(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
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
      <CalculationList calculations={currentCalculations} />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                isActive={currentPage > 1}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={() => handlePageChange(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                isActive={currentPage < totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default CalculationHistoryPage;