"use client";
import { useState, useEffect } from "react";

export interface Printer {
  id: string;
  name: string;
  brand: string;
  model: string;
  timestamp: number;
}

const LOCAL_STORAGE_KEY = "3d_printers";
const EVENT_NAME = "3d_printers_updated";

export function usePrinters() {
  const getStoredPrinters = (): Printer[] => {
    if (typeof window !== "undefined") {
      try {
        const storedPrinters = localStorage.getItem(LOCAL_STORAGE_KEY);
        return storedPrinters ? JSON.parse(storedPrinters) : [];
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
    window.addEventListener('storage', handleUpdate); // Sincroniza entre abas

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const notifyUpdate = () => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addPrinter = (newPrinter: Omit<Printer, "id" | "timestamp">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const updated = [{ ...newPrinter, id, timestamp }, ...printers];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updatePrinter = (id: string, updatedFields: Partial<Omit<Printer, "id" | "timestamp">>) => {
    const updated = printers.map((printer) => 
      printer.id === id ? { ...printer, ...updatedFields } : printer
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
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

  const importPrinters = (data: Printer[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    notifyUpdate();
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