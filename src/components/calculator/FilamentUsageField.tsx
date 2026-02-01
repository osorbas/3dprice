"use client";
import React from "react";
import { useFormContext, useController, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFilaments } from "@/hooks/use-filaments";
import { useFilamentColors } from "@/hooks/use-filament-colors";
import { Plus, XCircle } from "lucide-react";

interface FilamentUsageFieldProps {
  index: number;
  onRemove?: (index: number) => void;
  onAdd?: () => void;
  showAdd?: boolean;
  totalFields: number;
  namePrefix: FieldPath<FieldValues>;
  disabled?: boolean;
}

export const FilamentUsageField = ({
  index,
  onRemove,
  onAdd,
  showAdd = false,
  totalFields,
  namePrefix,
  disabled = false,
}: FilamentUsageFieldProps) => {
  const { control, watch } = useFormContext<FieldValues>();
  const { filaments } = useFilaments();
  const { colors: predefinedColors } = useFilamentColors();
  
  const filamentIdName = `${namePrefix}.${index}.filamentId` as FieldPath<FieldValues>;
  const gramsName = `${namePrefix}.${index}.filamentGrams` as FieldPath<FieldValues>;

  const currentFilamentId = watch(filamentIdName);

  const getFilamentColorHex = (colorName: string | undefined): string | undefined => {
    if (!colorName) return undefined;
    const foundColor = predefinedColors.find(c => c.name.toLowerCase() === colorName.toLowerCase() || c.hex.toLowerCase() === colorName.toLowerCase());
    if (foundColor) return foundColor.hex;
    if (/^#[0-9A-F]{6}$/i.test(colorName)) return colorName;
    return undefined;
  };

  const selectedFilament = filaments.find(f => f.id === currentFilamentId);
  const selectedColorHex = selectedFilament ? getFilamentColorHex(selectedFilament.color) : undefined;

  return (
    <div className="flex gap-2 items-end">
      <FormField
        control={control}
        name={filamentIdName}
        render={({ field }) => (
          <FormItem className="w-[240px]">
            <FormLabel className={index > 0 ? "sr-only" : ""}>Filamento *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
              <FormControl>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {selectedColorHex && (
                      <div 
                        className="h-3 w-3 rounded-full border border-black/10 shadow-sm flex-shrink-0" 
                        style={{ backgroundColor: selectedColorHex }}
                      />
                    )}
                    <SelectValue placeholder="Tipo..." />
                  </div>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filaments.map((f) => {
                  const baseName = f.name && f.name.trim() !== "" ? f.name : `${f.brand} - ${f.type}`;
                  const colorHex = getFilamentColorHex(f.color);
                  return (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        {colorHex && (
                          <div 
                            className="h-3 w-3 rounded-full border border-black/10 shadow-sm flex-shrink-0" 
                            style={{ backgroundColor: colorHex }}
                          />
                        )}
                        <span>{baseName} {f.color ? `(${f.color})` : ""}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="flex gap-2 items-end">
        <FormField
          control={control}
          name={gramsName}
          render={({ field }) => (
            <FormItem className="w-24">
              <FormLabel className={index > 0 ? "sr-only" : ""}>Peso *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pr-6"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">g</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {showAdd && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {totalFields > 1 && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => onRemove(index)}
            disabled={disabled}
          >
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
};