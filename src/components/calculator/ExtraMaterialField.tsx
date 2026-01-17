"use client";
import React from "react";
import { useFormContext, useController, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useExtraMaterials } from "@/hooks/use-extras";
import { XCircle } from "lucide-react";

interface ExtraMaterialFieldProps<TFieldValues extends FieldValues> {
  index: number;
  namePrefix: FieldPath<TFieldValues>;
  onRemove: (index: number) => void;
}

export const ExtraMaterialField = ({
  index,
  namePrefix,
  onRemove,
}: ExtraMaterialFieldProps<FieldValues>) => {
  const { control } = useFormContext<FieldValues>();
  const { extraMaterials } = useExtraMaterials();
  const materialIdName = `${namePrefix}.${index}.materialId` as FieldPath<FieldValues>;
  const quantityName = `${namePrefix}.${index}.quantity` as FieldPath<FieldValues>;
  
  const { field: materialIdField } = useController({
    name: materialIdName,
    control,
    defaultValue: "",
  });
  
  const { field: quantityField } = useController({
    name: quantityName,
    control,
    defaultValue: 0,
  });

  const selectedMaterial = extraMaterials.find(
    (mat) => mat.id === materialIdField.value
  );

  return (
    <div className="flex items-end gap-2 border p-3 rounded-md bg-muted/20">
      <FormField
        control={control}
        name={materialIdName}
        render={({ field }) => (
          <FormItem className="flex-grow">
            <FormLabel>Material Extra</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um material" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {extraMaterials.length === 0 ? (
                  <SelectItem value="no-extras" disabled>
                    Nenhum material extra registado
                  </SelectItem>
                ) : (
                  extraMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} (€{material.costPerUnit.toFixed(2)}/{material.unit})
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
        name={quantityName}
        render={({ field }) => (
          <FormItem className="flex-grow">
            <FormLabel>Quantidade</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  type="number"
                  min="0" // Impedir valores negativos
                  step="0.01"
                  placeholder="0"
                  {...field}
                  className="pr-16" // Add padding to the right to make space for the unit
                />
              </FormControl>
              {selectedMaterial && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                  {selectedMaterial.unit}
                </div>
              )}
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