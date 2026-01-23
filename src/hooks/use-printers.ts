"use client";
import { useState, useEffect, useCallback } from "react";

export type PrinterStatus = "Pronta" | "Ocupada" | "Em Manutenção";

export interface Printer {
  id: string;
  name: string;
  brand: string;
  model: string;
  workingHours: number; // Agora tratado como "Horas Base/Iniciais"
  status: PrinterStatus;
  timerStart?: number;
  timerEnd?: number;
  lastMaintenance?: number;
  timestamp: number;
}

const PRINTERS_KEY = "3d_printers";
const CALCS_KEY = "print_calculations";
const EVENT_NAME = "3d_printers_updated";
const CALCS_EVENT = "print_calculations_updated";

export function usePrinters() {
  const getCalculatedPrinters = useCallback((): Printer[] => {
    if (typeof window === "undefined") return [];

    try {
      // 1. Obter impressoras e cálculos
      const storedPrinters = localStorage.getItem(PRINTERS_KEY);
      const storedCalcs = localStorage.getItem(CALCS_KEY);
      
      const printers: Printer[] = storedPrinters ? JSON.parse(storedPrinters) : [];
      const calculations: any[] = storedCalcs ? JSON.parse(storedCalcs) : [];

      // 2. Mapear horas do histórico por impressora
      const historyHoursMap: Record<string, number> = {};
      
      calculations.forEach(calc => {
        if (calc.isProject && calc.projectParts) {
          calc.projectParts.forEach((part: any) => {
            if (part.printerId) {
              historyHoursMap[part.printerId] = (historyHoursMap[part.printerId] || 0) + (Number(part.printTimeHours) || 0);
            }
          });
        } else if (calc.printerId) {
          historyHoursMap[calc.printerId] = (historyHoursMap[calc.printerId] || 0) + (Number(calc.printTimeHours) || 0);
        }
      });

      // 3. Retornar impressoras com o Uso Total (Base + Histórico)
      return printers.map(p => ({
        ...p,
        status: p.status ?? "Pronta",
        // O valor exibido é a soma das horas base (manuais) + as horas encontradas no histórico
        workingHours: (p.workingHours || 0) + (historyHoursMap[p.id] || 0)
      }));
    } catch (error) {
      console.error("Erro ao calcular horas das impressoras:", error);
      return [];
    }
  }, []);

  const [printers, setPrinters] = useState<Printer[]>(getCalculatedPrinters());

  useEffect(() => {
    const handleUpdate = () => {
      setPrinters(getCalculatedPrinters());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener(CALCS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const interval = setInterval(() => {
      const currentPrinters = getCalculatedPrinters();
      let changed = false;
      const now = Date.now();

      // Verificar temporizadores (Apenas altera estado, pois as horas já estão no histórico)
      const rawPrinters: Printer[] = JSON.parse(localStorage.getItem(PRINTERS_KEY) || "[]");
      const updated = rawPrinters.map(p => {
        if (p.status === "Ocupada" && p.timerEnd && now >= p.timerEnd) {
          changed = true;
          return { 
            ...p, 
            status: "Pronta" as PrinterStatus, 
            timerStart: undefined, 
            timerEnd: undefined 
          };
        }
        return p;
      });

      if (changed) {
        localStorage.setItem(PRINTERS_KEY, JSON.stringify(updated));
        setPrinters(getCalculatedPrinters());
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    }, 5000);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener(CALCS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [getCalculatedPrinters]);

  const notifyUpdate = () => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addPrinter = (newPrinter: Omit<Printer, "id" | "status" | "timestamp">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const stored = JSON.parse(localStorage.getItem(PRINTERS_KEY) || "[]");
    const updated = [{ ...newPrinter, id, timestamp, status: "Pronta" as PrinterStatus }, ...stored];
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(updated));
    notifyUpdate();
    setPrinters(getCalculatedPrinters());
  };

  const updatePrinter = (id: string, updatedFields: Partial<Omit<Printer, "id" | "timestamp">>) => {
    const stored: Printer[] = JSON.parse(localStorage.getItem(PRINTERS_KEY) || "[]");
    const updated = stored.map((printer) => 
      printer.id === id ? { ...printer, ...updatedFields } : printer
    );
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(updated));
    notifyUpdate();
    setPrinters(getCalculatedPrinters());
  };

  const deletePrinter = (id: string) => {
    const stored: Printer[] = JSON.parse(localStorage.getItem(PRINTERS_KEY) || "[]");
    const updated = stored.filter((printer) => printer.id !== id);
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(updated));
    notifyUpdate();
    setPrinters(getCalculatedPrinters());
  };

  const clearPrinters = () => {
    localStorage.removeItem(PRINTERS_KEY);
    notifyUpdate();
    setPrinters([]);
  };

  const importPrinters = (data: Printer[]) => {
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(data));
    notifyUpdate();
    setPrinters(getCalculatedPrinters());
  };

  return {
    printers,
    addPrinter,
    updatePrinter,
    deletePrinter,
    clearPrinters,
    importPrinters,
  };
}