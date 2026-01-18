"use client";
import { useState, useEffect } from "react";

export interface FilamentUsage {
  filamentId: string;
  grams: number;
}

export interface PrintCalculation {
  id: string;
  materialCost: number;
  printTimeHours: number;
  electricityCost: number;
  laborCost: number;
  extraCost: number;
  profitMargin: number;
  totalPrice: number;
  filamentGrams: number; // Mantido para compatibilidade (total)
  filamentId: string;    // Mantido para compatibilidade (primeiro filamento)
  filaments?: FilamentUsage[]; // Nova lista detalhada
  timestamp: number;
  printName?: string;
  printerId?: string;
}

const LOCAL_STORAGE_KEY = "print_calculations";
const EVENT_NAME = "print_calculations_updated";

export function usePrintCalculations() {
  const getStoredCalculations = (): PrintCalculation[] => {
    if (typeof window !== "undefined") {
      const storedCalculations = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedCalculations) {
        const parsedCalculations: PrintCalculation[] = JSON.parse(storedCalculations);
        return parsedCalculations.map(calc => ({
          ...calc,
          filamentGrams: calc.filamentGrams ?? 0,
          filamentId: calc.filamentId ?? "",
          printName: calc.printName ?? "",
          printerId: calc.printerId ?? "",
          extraCost: calc.extraCost ?? 0,
          filaments: calc.filaments ?? [{ filamentId: calc.filamentId || "", grams: calc.filamentGrams || 0 }],
        }));
      }
    }
    return [];
  };

  const [calculations, setCalculations] = useState<PrintCalculation[]>(getStoredCalculations());

  useEffect(() => {
    const handleUpdate = () => {
      setCalculations(getStoredCalculations());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const notifyUpdate = () => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addCalculation = (newCalculation: Omit<PrintCalculation, "id" | "timestamp">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const updated = [{ ...newCalculation, id, timestamp }, ...calculations];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updateCalculation = (id: string, updatedFields: Partial<Omit<PrintCalculation, "id">>) => {
    const updated = calculations.map((calc) => 
      calc.id === id ? { ...calc, ...updatedFields } : calc
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const deleteCalculation = (id: string) => {
    const updated = calculations.filter((calc) => calc.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const clearCalculations = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    notifyUpdate();
  };

  const importCalculations = (data: PrintCalculation[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    notifyUpdate();
  };

  return {
    calculations,
    addCalculation,
    updateCalculation,
    deleteCalculation,
    clearCalculations,
    importCalculations,
  };
}