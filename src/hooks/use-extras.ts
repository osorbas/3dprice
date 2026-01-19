"use client";
import { useState, useEffect } from "react";

export interface ExtraMaterial {
  id: string;
  name: string;
  description?: string;
  costPerUnit: number;
  purchasePrice?: number; // Novo campo: preço de compra por unidade
  unit: string;
  timestamp: number;
}

const LOCAL_STORAGE_KEY = "3d_extra_materials";
const EVENT_NAME = "3d_extra_materials_updated";

export function useExtraMaterials() {
  const getStoredMaterials = (): ExtraMaterial[] => {
    if (typeof window !== "undefined") {
      try {
        const storedMaterials = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedMaterials) {
          const parsedMaterials: ExtraMaterial[] = JSON.parse(storedMaterials);
          // Garante que 'purchasePrice' tenha um valor padrão para dados existentes
          return parsedMaterials.map(material => ({
            ...material,
            purchasePrice: material.purchasePrice ?? 0 // Valor padrão 0
          }));
        }
        return [];
      } catch (error) {
        console.error("Failed to parse extra materials from localStorage:", error);
        return [];
      }
    }
    return [];
  };

  const [extraMaterials, setExtraMaterials] = useState<ExtraMaterial[]>(getStoredMaterials());

  useEffect(() => {
    const handleUpdate = () => {
      setExtraMaterials(getStoredMaterials());
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

  const addExtraMaterial = (newMaterial: Omit<ExtraMaterial, "id" | "timestamp">) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const updated = [{ ...newMaterial, id, timestamp }, ...extraMaterials];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updateExtraMaterial = (id: string, updatedFields: Partial<Omit<ExtraMaterial, "id" | "timestamp">>) => {
    const updated = extraMaterials.map((material) => 
      material.id === id ? { ...material, ...updatedFields } : material
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const deleteExtraMaterial = (id: string) => {
    const updated = extraMaterials.filter((material) => material.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const clearExtraMaterials = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    notifyUpdate();
  };

  const importExtraMaterials = (data: ExtraMaterial[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.map(material => ({
      ...material,
      purchasePrice: material.purchasePrice ?? 0 // Garante que dados importados também tenham valor padrão
    }))));
    notifyUpdate();
  };

  return {
    extraMaterials,
    addExtraMaterial,
    updateExtraMaterial,
    deleteExtraMaterial,
    clearExtraMaterials,
    importExtraMaterials,
  };
}