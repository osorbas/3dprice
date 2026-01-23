"use client";
import { useState, useEffect } from "react";

export type PrinterStatus = "Pronta" | "Ocupada" | "Em Manutenção";

export interface Printer {
  id: string;
  name: string;
  brand: string;
  model: string;
  workingHours: number;
  status: PrinterStatus;
  timerStart?: number; // Timestamp de quando a impressão começou
  timerEnd?: number; // Timestamp de quando a impressão termina
  lastMaintenance?: number; // Timestamp da última manutenção
  timestamp: number;
}

const LOCAL_STORAGE_KEY = "3d_printers";
const EVENT_NAME = "3d_printers_updated";

export function usePrinters() {
  const getStoredPrinters = (): Printer[] => {
    if (typeof window !== "undefined") {
      try {
        const storedPrinters = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrinters) {
          const parsedPrinters: Printer[] = JSON.parse(storedPrinters);
          return parsedPrinters.map(printer => ({
            ...printer,
            workingHours: printer.workingHours ?? 0,
            status: printer.status ?? "Pronta",
          }));
        }
        return [];
      } catch (error) {
        console.error("Failed to parse printers from localStorage:", error);
        return [];
      }
    }
    return [];
  };

  const [printers, setPrinters] = useState<Printer[]>(getStoredPrinters());

  useEffect(() => {
    const handleUpdate = () => {
      setPrinters(getStoredPrinters());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Verificar temporizadores expirados
    const interval = setInterval(() => {
      const currentPrinters = getStoredPrinters();
      let changed = false;
      const now = Date.now();

      const updated = currentPrinters.map(p => {
        if (p.status === "Ocupada" && p.timerEnd && now >= p.timerEnd) {
          changed = true;
          return { ...p, status: "Pronta" as PrinterStatus, timerStart: undefined, timerEnd: undefined };
        }
        return p;
      });

      if (changed) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        setPrinters(updated);
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    }, 5000);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const notifyUpdate = () => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addPrinter = (newPrinter: Omit<Printer, "id" | "timestamp" | "status">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const updated = [{ ...newPrinter, id, timestamp, status: "Pronta" as PrinterStatus }, ...printers];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updatePrinter = (id: string, updatedFields: Partial<Omit<Printer, "id" | "timestamp">>) => {
    const updated = printers.map((printer) => 
      printer.id === id ? { ...printer, ...updatedFields } : printer
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
    setPrinters(updated);
  };

  const deletePrinter = (id: string) => {
    const updated = printers.filter((printer) => printer.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const clearPrinters = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    notifyUpdate();
  };

  return {
    printers,
    addPrinter,
    updatePrinter,
    deletePrinter,
    clearPrinters,
  };
}