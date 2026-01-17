"use client";
import { useState, useEffect } from "react";

export interface Filament {
  id: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  pricePerKg: number;
  weight: number;
  timestamp: number;
}

const LOCAL_STORAGE_KEY = "3d_filaments";
const EVENT_NAME = "3d_filaments_updated";

export function useFilaments() {
  const getStoredFilaments = (): Filament[] => {
    if (typeof window !== "undefined") {
      try {
        const storedFilaments = localStorage.getItem(LOCAL_STORAGE_KEY);
        return storedFilaments ? JSON.parse(storedFilaments) : [];
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

  const addFilament = (newFilament: Omit<Filament, "id" | "timestamp">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const updated = [{ ...newFilament, id, timestamp }, ...filaments];
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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    notifyUpdate();
  };

  return {
    filaments,
    addFilament,
    updateFilament,
    deleteFilament,
    clearFilaments,
    importFilaments,
  };
}