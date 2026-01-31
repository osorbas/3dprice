"use client";
import { useState, useEffect, useCallback } from "react";

export interface FilamentColor {
  name: string;
  hex: string;
}

const LOCAL_STORAGE_KEY = "3d_filament_colors";
const EVENT_NAME = "3d_filament_colors_updated";

const INITIAL_COLORS: FilamentColor[] = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Vermelho", hex: "#FF0000" },
  { name: "Azul", hex: "#0000FF" },
  { name: "Verde", hex: "#008000" },
  { name: "Amarelo", hex: "#FFFF00" },
  { name: "Cinza", hex: "#808080" },
  { name: "Laranja", hex: "#FFA500" },
  { name: "Roxo", hex: "#800080" },
];

export function useFilamentColors() {
  const getStoredColors = useCallback((): FilamentColor[] => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return INITIAL_COLORS;
    }
    return INITIAL_COLORS;
  }, []);

  const [colors, setColors] = useState<FilamentColor[]>(getStoredColors());

  useEffect(() => {
    const handleUpdate = () => setColors(getStoredColors());
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [getStoredColors]);

  const saveColors = (newColors: FilamentColor[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newColors));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  };

  const addColor = (name: string, hex: string) => {
    const trimmedName = name.trim();
    const upperHex = hex.toUpperCase();
    if (!trimmedName || !/^#[0-9A-F]{6}$/i.test(upperHex)) return;
    
    if (colors.some(c => c.name === trimmedName || c.hex === upperHex)) return;

    const newColors = [...colors, { name: trimmedName, hex: upperHex }].sort((a, b) => a.name.localeCompare(b.name));
    saveColors(newColors);
  };

  const removeColor = (hex: string) => {
    const newColors = colors.filter(c => c.hex !== hex);
    saveColors(newColors);
  };

  return { colors, addColor, removeColor };
}