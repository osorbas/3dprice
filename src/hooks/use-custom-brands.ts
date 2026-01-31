"use client";
import { useState, useEffect } from "react";

const LOCAL_STORAGE_KEY = "3d_custom_filament_brands";
const EVENT_NAME = "3d_custom_brands_updated";

export function useCustomBrands() {
  const getStoredBrands = (): string[] => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  const [customBrands, setCustomBrands] = useState<string[]>(getStoredBrands());

  useEffect(() => {
    const handleUpdate = () => setCustomBrands(getStoredBrands());
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addBrand = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = getStoredBrands();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed].sort();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  };

  const removeBrand = (name: string) => {
    const updated = getStoredBrands().filter(b => b !== name);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  return { customBrands, addBrand, removeBrand };
}