"use client";
import { useState, useEffect, useCallback } from "react";

export interface BrandConfig {
  name: string;
  types: string[];
}

const LOCAL_STORAGE_KEY = "3d_filament_brands_config";
const EVENT_NAME = "3d_filament_brands_updated";

const INITIAL_BRANDS: BrandConfig[] = [
  { name: "Genérico", types: ["PLA", "PETG", "ABS", "ASA", "TPU"] },
  { name: "Prusament", types: ["PLA", "PETG", "ASAB", "PVB", "PC Blend"] },
  { name: "ESUN", types: ["PLA+", "PETG", "ABS", "TPU", "Nylon"] },
  { name: "Polymaker", types: ["PolyLite PLA", "PolyTerra PLA", "PolyMax PLA", "PolyLite PETG"] },
  { name: "Bambu Lab", types: ["PLA Basic", "PLA Matte", "PETG Basic", "ABS", "ASA", "TPU 95A"] },
  { name: "Sunlu", types: ["PLA", "PLA+", "PETG", "ABS", "SILK"] },
  { name: "Lotactree", types: ["PLA", "PETG"] },
  { name: "Filament 3D", types: ["PLA", "PETG"] },
];

export function useFilamentBrands() {
  const getStoredConfig = useCallback((): BrandConfig[] => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return INITIAL_BRANDS;
    }
    return INITIAL_BRANDS;
  }, []);

  const [brands, setBrands] = useState<BrandConfig[]>(getStoredConfig());

  useEffect(() => {
    const handleUpdate = () => setBrands(getStoredConfig());
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [getStoredConfig]);

  const saveConfig = (newConfig: BrandConfig[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addBrand = (name: string) => {
    if (brands.some(b => b.name === name)) return;
    const newConfig = [...brands, { name, types: ["PLA"] }].sort((a, b) => a.name.localeCompare(b.name));
    saveConfig(newConfig);
  };

  const updateBrand = (oldName: string, newName: string, types: string[]) => {
    const newConfig = brands.map(b => 
      b.name === oldName ? { name: newName, types: Array.from(new Set(types)) } : b
    );
    saveConfig(newConfig);
  };

  const removeBrand = (name: string) => {
    const newConfig = brands.filter(b => b.name !== name);
    saveConfig(newConfig);
  };

  return { brands, addBrand, updateBrand, removeBrand };
}