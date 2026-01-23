"use client";
import { useState, useEffect } from "react";

export interface Filament {
  id: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  pricePerKg: number;
  purchasePrice?: number;
  weight: number; // Peso padrão da bobina (ex: 1kg)
  currentWeightGrams: number; // Stock real restante em gramas
  timestamp: number;
}

const LOCAL_STORAGE_KEY = "3d_filaments";
const EVENT_NAME = "3d_filaments_updated";

export function useFilaments() {
  const getStoredFilaments = (): Filament[] => {
    if (typeof window !== "undefined") {
      try {
        const storedFilaments = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedFilaments) {
          const parsedFilaments: Filament[] = JSON.parse(storedFilaments);
          return parsedFilaments.map(filament => ({
            ...filament,
            purchasePrice: filament.purchasePrice ?? 0,
            currentWeightGrams: filament.currentWeightGrams ?? (filament.weight * 1000)
          }));
        }
        return [];
      } catch (error) {
        console.error("Failed to parse filaments from localStorage:", error);
        return [];
      }
    }
    return [];
  };

  const [filaments, setFilaments] = useState<Filament[]>(getStoredFilaments());

  useEffect(() => {
    const handleUpdate = () => {
      setFilaments(getStoredFilaments());
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

  const addFilament = (newFilament: Omit<Filament, "id" | "timestamp" | "currentWeightGrams"> & { currentWeightGrams?: number }) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const grams = newFilament.currentWeightGrams ?? (newFilament.weight * 1000);
    const updated = [{ ...newFilament, id, timestamp, currentWeightGrams: grams }, ...filaments];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updateFilament = (id: string, updatedFields: Partial<Omit<Filament, "id" | "timestamp">>) => {
    const updated = filaments.map((filament) => 
      filament.id === id ? { ...filament, ...updatedFields } : filament
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const subtractStock = (id: string, grams: number) => {
    const isEnabled = localStorage.getItem("manage_filament_stock") === "true";
    if (!isEnabled) return;

    const updated = filaments.map((f) => {
      if (f.id === id) {
        return { ...f, currentWeightGrams: Math.max(0, f.currentWeightGrams - grams) };
      }
      return f;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const addStock = (id: string, grams: number) => {
    const updated = filaments.map((f) => {
      if (f.id === id) {
        return { ...f, currentWeightGrams: f.currentWeightGrams + grams };
      }
      return f;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const deleteFilament = (id: string) => {
    const updated = filaments.filter((filament) => filament.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const clearFilaments = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    notifyUpdate();
  };

  const importFilaments = (data: Filament[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.map(filament => ({
      ...filament,
      purchasePrice: filament.purchasePrice ?? 0,
      currentWeightGrams: filament.currentWeightGrams ?? (filament.weight * 1000)
    }))));
    notifyUpdate();
  };

  return {
    filaments,
    addFilament,
    updateFilament,
    subtractStock,
    addStock,
    deleteFilament,
    clearFilaments,
    importFilaments,
  };
}