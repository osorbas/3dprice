"use client";
import { useState, useEffect } from "react";

export interface FilamentUsage {
  filamentId: string;
  grams: number;
}

export interface ExtraUsageDetail {
  materialId: string;
  quantity: number;
  cost: number;
}

export interface ProjectPartDetail {
  partName: string;
  printerId: string;
  materialCost: number;
  printTimeHours: number;
  electricityCost: number;
  // Removidos: laborCost, extraCost, profitMargin do nível da parte
  totalPrice: number;
  filamentGrams: number; // Total grams for this part
  filamentId: string;    // Main filament for this part (or first if multiple)
  filaments?: FilamentUsage[]; // Detailed filament usage for this part
  extras?: { materialId: string; quantity: number; cost: number }[]; // Detailed extra usage for this part
}

export interface PrintCalculation {
  id: string;
  materialCost: number; // Total for single print or sum for project
  printTimeHours: number; // Total for single print or sum for project
  electricityCost: number; // Total for single print or sum for project
  laborCost: number; // Total for single print or sum for project
  extraCost: number; // Total for single print or sum for project
  profitMargin: number; // For single print, or average/overall for project
  totalPrice: number; // Total for single print or sum for project
  filamentGrams: number; // Total for single print or sum for project
  filamentId: string;    // Main filament for single print, or empty/first for project
  filaments?: FilamentUsage[]; // Detailed for single print, or sum for project
  extras?: ExtraUsageDetail[]; // Added detailed extras
  timestamp: number;
  printName?: string; // Name for single print
  printerId?: string; // Printer for single print

  // New fields for project
  isProject?: boolean;
  projectName?: string;
  projectParts?: ProjectPartDetail[];
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
          extras: calc.extras ?? [], // Added default for extras
          isProject: calc.isProject ?? false,
          projectName: calc.projectName ?? "",
          projectParts: calc.projectParts ?? [],
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