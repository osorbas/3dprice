"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Printer } from "@/hooks/use-printers";
import { Clock } from "lucide-react";

interface StartTimerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  printer: Printer | undefined;
  durationHours: number;
  onConfirm: () => void;
}

export const StartTimerDialog = ({
  isOpen,
  onOpenChange,
  printer,
  durationHours,
  onConfirm,
}: StartTimerDialogProps) => {
  if (!printer) return null;

  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours - hours) * 60);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Ativar Temporizador?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Desejas marcar a impressora <strong>{printer.name}</strong> como <strong>Ocupada</strong> por 
            {" "}{hours}h {minutes}min? Isto permitirá acompanhar o progresso no separador Farm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Agora não</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Sim, ativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};