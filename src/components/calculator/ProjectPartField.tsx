"use client";
import React from "react";
import { useFormContext, useFieldArray, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, XCircle } from "lucide-react";

import { FilamentUsageField } from "./FilamentUsageField";
import { ExtraMaterialField } from "./ExtraMaterialField";

// Interfaces for props
import { Printer } from "@/hooks/use-printers";
import { Filament } from "@/hooks/use-filaments";
import { ExtraMaterial } from "@/hooks/use-extras";
import { ElectricityProfile } from "@/hooks/use-electricity-profiles";

interface ProjectPartFieldProps<TFieldValues extends FieldValues> {
  index: number;
  namePrefix: FieldPath<TFieldValues>;
  onRemove: (index: number) => void;
  printers: Printer[];
  filaments: Filament[];
  extraMaterials: ExtraMaterial[];
  electricityProfiles: ElectricityProfile[];
  defaultFilamentId: string | null;
  defaultElectricityProfileId: string | null;
  defaultProfitMargin: number;
}

export const ProjectPartField = <TFieldValues extends FieldValues>({
  index,
  namePrefix,
  onRemove,
  printers,
  filaments,
  extraMaterials,
  electricityProfiles,
  defaultFilamentId,
  defaultElectricityProfileId,
  defaultProfitMargin,
}: ProjectPartFieldProps<TFieldValues>) => {
  const { control, watch, setValue } = useFormContext<TFieldValues>();

  const { fields: filamentFields, append: appendFilament, remove: removeFilament } = useFieldArray({
    control,
    name: `${namePrefix}.${index}.filamentsUsed` as FieldPath<TFieldValues>,
  });

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control,
    name: `${namePrefix}.${index}.extras` as FieldPath<TFieldValues>,
  });

  const electricityProfileIdPath = `${namePrefix}.${index}.electricityProfileId` as FieldPath<TFieldValues>;
  const electricityCostPerHourPath = `${namePrefix}.${index}.electricityCostPerHour` as FieldPath<TFieldValues>;

  const watchedElectricityProfileId = watch(electricityProfileIdPath);

  React.useEffect(() => {
    const selectedProfile = electricityProfiles.find(p => p.id === watchedElectricityProfileId);
    if (selectedProfile) {
      setValue(electricityCostPerHourPath, selectedProfile.costPerHour as any);
    }
  }, [watchedElectricityProfileId, electricityProfiles, setValue, electricityCostPerHourPath]);

  return (
    <Card className="p-4 space-y-4 bg-background/50">
      <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
        <CardTitle className="text-lg">Parte {index + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-destructive"
        >
          <XCircle className="h-5 w-5" />
          <span className="sr-only">Remover Parte</span>
        </Button>
      </CardHeader>
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name={`${namePrefix}.${index}.partName` as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Parte *</FormLabel>
              <FormControl><Input placeholder="ex: Base da Estátua" {...field} /></FormControl>
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              onAdd={() => appendFilament({ filamentId: defaultFilamentId || "", filamentGrams: 0 })}
              showAdd={filamentIndex === filamentFields.length - 1}
              totalFields={filamentFields.length}
              namePrefix={`${namePrefix}.${index}.filamentsUsed`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel>Tempo de Impressão *</FormLabel>
        <div className="flex gap-2">
          <FormField
            control={control}
            name={`${namePrefix}.${index}.printTimeHours` as FieldPath<TFieldValues>}
            render={({ field }) => (
              <FormItem className="w-24">
                <div className="relative">
                  <FormControl><Input type="number" min="0" className="pr-6" {...field} /></FormControl>
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
                  <FormControl><Input type="number" min="0" max="59" className="pr-8" {...field} /></FormControl>
                  <span className="absolute right-2 top-2 text-xs text-muted-foreground">min</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`${namePrefix}.${index}.laborCostPerHour` as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Hora Mão de Obra (€/h)</FormLabel>
              <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormLabel>Tempo de Trabalho</FormLabel>
          <div className="flex gap-2">
            <FormField
              control={control}
              name={`${namePrefix}.${index}.laborTimeHours` as FieldPath<TFieldValues>}
              render={({ field }) => (
                <FormItem className="w-24">
                  <div className="relative">
                    <FormControl><Input type="number" min="0" className="pr-6" {...field} /></FormControl>
                    <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${namePrefix}.${index}.laborTimeMinutes` as FieldPath<TFieldValues>}
              render={({ field }) => (
                <FormItem className="w-24">
                  <div className="relative">
                    <FormControl><Input type="number" min="0" max="59" className="pr-8" {...field} /></FormControl>
                    <span className="absolute right-2 top-2 text-xs text-muted-foreground">min</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <FormLabel>Materiais Extras</FormLabel>
        {extraFields.map((field, extraIndex) => (
          <ExtraMaterialField
            key={field.id}
            index={extraIndex}
            namePrefix={`${namePrefix}.${index}.extras`}
            onRemove={() => removeExtra(extraIndex)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendExtra({ materialId: "", quantity: 0 })}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Material Extra
        </Button>
      </div>

      <Separator />

      <FormField
        control={control}
        name={`${namePrefix}.${index}.profitMargin` as FieldPath<TFieldValues>}
        render={({ field }) => (
          <FormItem className="w-44">
            <FormLabel>Margem de Lucro (%)</FormLabel>
            <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Card>
  );
};