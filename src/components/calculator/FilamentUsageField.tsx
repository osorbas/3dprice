"use client";
import React from "react";
import { useFormContext, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFilaments } from "@/hooks/use-filaments";
import { Plus, XCircle } from "lucide-react";

interface FilamentUsageFieldProps {
  index: number;
  onRemove?: (index: number) => void;
  onAdd?: () => void;
  showAdd?: boolean;
  totalFields: number; // Nova prop para saber o total
}

export const FilamentUsageField = ({
  index,
  onRemove,
  onAdd,
  showAdd = false,
  totalFields,
}: FilamentUsageFieldProps) => {
  const { control } = useFormContext<FieldValues>();
  const { filaments } = useFilaments();
  
  const filamentIdName = `filamentsUsed.${index}.filamentId` as FieldPath<FieldValues>;
  const gramsName = `filamentsUsed.${index}.filamentGrams` as FieldPath<FieldValues>;

  return (
    <div className="flex gap-2 items-end">
      <FormField
        control={control}
        name={filamentIdName}
        render={({ field }) => (
          <FormItem className="w-[240px]">
            <FormLabel className={index > 0 ? "sr-only" : ""}>Filamento *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filaments.map((f) => {
                  const baseName = f.name && f.name.trim() !== "" ? f.name : `${f.brand} - ${f.type}`;
                  return (
                    <SelectItem key={f.id} value={f.id}>
                      {baseName} {f.color ? `(${f.color})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="flex gap-2 items-center">
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
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Mostra o botão de apagar se houver mais de um filamento no total */}
        {totalFields > 1 && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => onRemove(index)}
          >
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
};