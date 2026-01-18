"use client";
import React from "react";
import { useFormContext, useController, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFilaments } from "@/hooks/use-filaments";
import { XCircle } from "lucide-react";

interface FilamentFieldProps<TFieldValues extends FieldValues> {
  index: number;
  namePrefix: FieldPath<TFieldValues>;
  onRemove: (index: number) => void;
}

export const FilamentField = ({
  index,
  namePrefix,
  onRemove,
}: FilamentFieldProps<FieldValues>) => {
  const { control } = useFormContext<FieldValues>();
  const { filaments } = useFilaments();
  const filamentIdName = `${namePrefix}.${index}.filamentId` as FieldPath<FieldValues>;
  const gramsName = `${namePrefix}.${index}.grams` as FieldPath<FieldValues>;
  
  const { field: filamentIdField } = useController({
    name: filamentIdName,
    control,
    defaultValue: "",
  });
  
  const { field: gramsField } = useController({
    name: gramsName,
    control,
    defaultValue: 0,
  });

  const selectedFilament = filaments.find(
    (fil) => fil.id === filamentIdField.value
  );

  return (
    <div className="flex items-end gap-2 border p-3 rounded-md bg-muted/20">
      <FormField
        control={control}
        name={filamentIdName}
        render={({ field }) => (
          <FormItem className="flex-grow">
            <FormLabel>Filamento</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um filamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filaments.length === 0 ? (
                  <SelectItem value="no-filaments" disabled>
                    Nenhum filamento registado
                  </SelectItem>
                ) : (
                  filaments.map((filament) => (
                    <SelectItem key={filament.id} value={filament.id}>
                      {filament.name} (€{(filament.pricePerKg / 1000).toFixed(2)}/g)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name={gramsName}
        render={({ field }) => (
          <FormItem className="w-24">
            <FormLabel>Peso</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  {...field}
                  className="pr-6"
                />
              </FormControl>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                g
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
      >
        <XCircle className="h-5 w-5 text-destructive" />
      </Button>
    </div>
  );
};