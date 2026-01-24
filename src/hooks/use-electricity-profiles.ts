"use client";
import { useState, useEffect } from "react";

export interface ElectricityProfile {
  id: string;
  name?: string;
  costPerHour: number;
  description?: string;
  timestamp: number;
}

export type NewElectricityProfileData = Omit<ElectricityProfile, "id" | "timestamp" | "description"> & {
  description?: string;
  name?: string;
};

const LOCAL_STORAGE_KEY = "3d_electricity_profiles";
const EVENT_NAME = "3d_electricity_profiles_updated";

const predefinedElectricityProfiles: Omit<ElectricityProfile, "timestamp">[] = [
  { id: "default-normal", name: "Tarifa Normal (Padrão)", costPerHour: 0.15, description: "Custo médio da eletricidade durante o dia." },
  { id: "default-offpeak", name: "Tarifa Bi-Horária (Fora de Pico)", costPerHour: 0.10, description: "Custo da eletricidade em horas de vazio (noite/fim de semana)." },
  { id: "default-peak", name: "Tarifa Bi-Horária (Pico)", costPerHour: 0.25, description: "Custo da eletricidade em horas de ponta (dia útil)." },
  { id: "default-industrial", name: "Tarifa Industrial", costPerHour: 0.18, description: "Custo para uso industrial ou comercial." },
];

export function useElectricityProfiles() {
  const getStoredProfiles = (): ElectricityProfile[] => {
    if (typeof window !== "undefined") {
      try {
        const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedProfiles) {
          return JSON.parse(storedProfiles);
        } else {
          return predefinedElectricityProfiles.map(profile => ({ ...profile, timestamp: Date.now() }));
        }
      } catch (error) {
        console.error("Failed to parse electricity profiles from localStorage:", error);
        return predefinedElectricityProfiles.map(profile => ({ ...profile, timestamp: Date.now() }));
      }
    }
    return [];
  };

  const [electricityProfiles, setElectricityProfiles] = useState<ElectricityProfile[]>(getStoredProfiles());

  useEffect(() => {
    const handleUpdate = () => {
      setElectricityProfiles(getStoredProfiles());
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

  const addElectricityProfile = (newProfile: NewElectricityProfileData) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    
    const profileToAdd: ElectricityProfile = {
      ...newProfile,
      id,
      timestamp,
      name: newProfile.name || "Perfil Sem Nome",
      description: newProfile.description || undefined,
    };

    const updated = [profileToAdd, ...electricityProfiles];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const updateElectricityProfile = (id: string, updatedFields: Partial<Omit<ElectricityProfile, "id" | "timestamp">>) => {
    const updated = electricityProfiles.map((profile) => 
      profile.id === id ? { ...profile, ...updatedFields } : profile
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const deleteElectricityProfile = (id: string) => {
    const updated = electricityProfiles.filter((profile) => profile.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    notifyUpdate();
  };

  const clearElectricityProfiles = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    notifyUpdate();
  };

  const importElectricityProfiles = (data: ElectricityProfile[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    notifyUpdate();
  };

  return {
    electricityProfiles,
    addElectricityProfile,
    updateElectricityProfile,
    deleteElectricityProfile,
    clearElectricityProfiles,
    importElectricityProfiles,
  };
}