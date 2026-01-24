"use client";
import React from "react";
import { useFormContext, useFieldArray, FieldPath, FieldValues, ArrayPath } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, XCircle, CheckCircle, Pencil } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { FilamentUsageField } from "./FilamentUsageField";

// Interfaces for props
import { Printer } from "@/hooks/use-printers";
import { Filament } from "@/hooks/use-filaments";
import { ElectricityProfile } from "@/hooks/use-electricity-profiles";

interface ProjectPartFieldProps<TFieldValues extends FieldValues> {
  index: number;
  namePrefix: FieldPath<TFieldValues>;
  onRemove: (index: number) => void;
  printers: Printer[];
  filaments: Filament[];
  electricityProfiles: ElectricityProfile[];
  defaultFilamentId: string | null;
  isConfirmed: boolean;
  onConfirmPart: (index: number, confirmed: boolean) => void;
  isAccordionOpen: boolean; // Nova prop
  setIsAccordionOpen: (open: boolean) => void; // Nova prop
}

// Definir o tipo de array path para projectParts
type ProjectPartsArrayPath<TFieldValues extends FieldValues> = ArrayPath<TFieldValues> & ('projectParts');

export const ProjectPartField = <TFieldValues extends FieldValues>({
  index,
  namePrefix,
  onRemove,
  printers,
  filaments,
  electricityProfiles,
  defaultFilamentId,
  isConfirmed,
  onConfirmPart,
  isAccordionOpen,
  setIsAccordionOpen,
}: ProjectPartFieldProps<TFieldValues>) => {
  const { control, watch, setValue, trigger, getValues } = useFormContext<TFieldValues>();

  // Corrigir a tipagem do useFieldArray
  const { fields: filamentFields, append: appendFilament, remove: removeFilament } = useFieldArray({
    control,
    name: `${namePrefix}.${index}.filamentsUsed` as ArrayPath<TFieldValues>,
  });

  const electricityProfileIdPath = `${namePrefix}.${index}.electricityProfileId` as FieldPath<TFieldValues>;
  const electricityCostPerHourPath = `${namePrefix}.${index}.electricityCostPerHour` as FieldPath<TFieldValues>;
  const partNamePath = `${namePrefix}.${index}.partName` as FieldPath<TFieldValues>;

  const watchedElectricityProfileId = watch(electricityProfileIdPath);
  const watchedPartName = watch(partNamePath);

  React.useEffect(() => {
    const selectedProfile = electricityProfiles.find(p => p.id === watchedElectricityProfileId);
    if (selectedProfile) {
      setValue(electricityCostPerHourPath, selectedProfile.costPerHour as any);
    }
  }, [watchedElectricityProfileId, electricityProfiles, setValue, electricityCostPerHourPath]);

  const handleConfirm = async () => {
    const fieldsToValidate: (FieldPath<TFieldValues>)[] = [
      partNamePath,
      `${namePrefix}.${index}.printerId` as FieldPath<TFieldValues>,
      `${namePrefix}.${index}.printTimeHours` as FieldPath<TFieldValues>,
      `${namePrefix}.${index}.printTimeMinutes` as FieldPath<TFieldValues>,
      electricityProfileIdPath,
      electricityCostPerHourPath,
    ];

    // Add filament fields to validation
    filamentFields.forEach((_, fIndex) => {
      fieldsToValidate.push(`${namePrefix}.${index}.filamentsUsed.${fIndex}.filamentId` as FieldPath<TFieldValues>);
      fieldsToValidate.push(`${namePrefix}.${index}.filamentsUsed.${fIndex}.filamentGrams` as FieldPath<TFieldValues>);
    });

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      onConfirmPart(index, true);
      setIsAccordionOpen(false); // Recolhe a parte após confirmar
    }
  };

  const handleEdit = () => {
    onConfirmPart(index, false);
    setIsAccordionOpen(true); // Expande a parte para edição
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={isAccordionOpen ? `part-${index}` : undefined} // Controla o estado de expansão
      onValueChange={(val) => setIsAccordionOpen(!!val)} // Atualiza o estado de expansão
    >
      <AccordionItem value={`part-${index}`} className="border rounded-lg bg-card px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 w-full pr-8">
            <span className="font-semibold text-lg truncate">
              {watchedPartName || `Parte ${index + 1}`}
            </span>
            {isConfirmed && (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4 space-y-4 bg-background/50 border-t -mx-4 -mb-4 rounded-b-lg relative">
            {/* Botão Remover Parte no canto superior direito */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="text-destructive absolute right-4 top-4 h-8 w-8 p-0"
            >
              <XCircle className="h-5 w-5" />
              <span className="sr-only">Remover Parte</span>
            </Button>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={control}
                name={partNamePath}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Parte *</FormLabel>
                    <FormControl><Input placeholder="ex: Base da Estátua" {...field} disabled={isConfirmed} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`${namePrefix}.${index}.printerId` as FieldPath<TFieldValues>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impressora *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isConfirmed}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>{printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={electricityProfileIdPath}
                render={({ field }) => (
                  <FormItem className="max-w-[240px]">
                    <FormLabel>Perfil Energia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isConfirmed}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Personalizado..." /></SelectTrigger></FormControl>
                      <SelectContent>{electricityProfiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border rounded-md p-3 bg-background/50">
              <FormLabel>Filamentos Usados</FormLabel>
              <div className="space-y-3">
                {filamentFields.map((field, filamentIndex) => (
                  <FilamentUsageField
                    key={field.id}
                    index={filamentIndex}
                    onRemove={() => removeFilament(filamentIndex)}
                    onAdd={() => appendFilament({ filamentId: defaultFilamentId || "", filamentGrams: 0 } as any)} // Corrigido: Adicionar 'as any' para o tipo de FieldArray
                    showAdd={filamentIndex === filamentFields.length - 1 && !isConfirmed}
                    totalFields={filamentFields.length}
                    namePrefix={`${namePrefix}.${index}.filamentsUsed`}
                    disabled={isConfirmed} // Adicionado
                  />
                ))}
                {!isConfirmed && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendFilament({ filamentId: defaultFilamentId || "", filamentGrams: 0 } as any)} // Corrigido: Adicionar 'as any'
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Filamento
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Tempo de Impressão *</FormLabel>
              <div className="flex items-end gap-2 justify-between">
                <div className="flex gap-2">
                  <FormField
                    control={control}
                    name={`${namePrefix}.${index}.printTimeHours` as FieldPath<TFieldValues>}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <div className="relative">
                          <FormControl><Input type="number" min="0" className="pr-6" {...field} disabled={isConfirmed} /></FormControl>
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`${namePrefix}.${index}.printTimeMinutes` as FieldPath<TFieldValues>}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <div className="relative">
                          <FormControl><Input type="number" min="0" max="59" className="pr-8" {...field} disabled={isConfirmed} /></FormControl>
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">min</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {isConfirmed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                    className="flex items-center gap-1 text-primary border-primary hover:bg-primary/5 hover:text-primary/80"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4" /> Confirmar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};