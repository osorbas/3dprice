"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * => z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePrinters, Printer } from "@/hooks/use-printers";
import { useFilaments, NewFilamentData } from "@/hooks/use-filaments";
import { showSuccess, showError } from "@/utils/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predefinedPrinters } from "@/components/AddPrinterDialog";
import { predefinedFilamentOptions } from "@/components/AddFilamentDialog";
import { ArrowRight, Check } from "lucide-react";

// Reusing form schemas from existing dialogs
const printerFieldsSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  powerConsumptionWatts: z.coerce.number().min(0, "O consumo de energia não pode ser negativo.").default(50),
  workingHours: z.coerce.number().min(0, "As horas de trabalho não podem ser negativas.").default(0),
});

const filamentFieldsSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço por kg deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(),
  weight: z.coerce.number().min(0.01, "O peso deve ser positivo."),
});

// Combined schema for the single form
const combinedFormSchema = z.object({
  printer: printerFieldsSchema.partial().optional(), // Make printer fields optional initially
  filament: filamentFieldsSchema.partial().optional(), // Make filament fields optional initially
});

type CombinedSetupFormValues = z.infer<typeof combinedFormSchema>;

interface FirstTimeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FirstTimeSetupDialog = ({ open, onOpenChange }: FirstTimeSetupDialogProps) => {
  const { addPrinter } = usePrinters();
  const { addFilament } = useFilaments();
  const [step, setStep] = useState(1); // 1: Add Printer, 2: Add Filament

  const form = useForm<CombinedSetupFormValues>({
    resolver: zodResolver(combinedFormSchema),
    defaultValues: {
      printer: {
        name: "", brand: "", model: "", powerConsumptionWatts: 50, workingHours: 0,
      },
      filament: {
        name: "", brand: "", type: "", color: "", pricePerKg: 0, purchasePrice: 0, weight: 1,
      },
    },
  });

  const [selectedPrinterBrand, setSelectedPrinterBrand] = useState<string | undefined>(undefined);
  const [selectedFilamentBrand, setSelectedFilamentBrand] = useState<string | undefined>(undefined);

  // Effect to reset model when printer brand changes
  useEffect(() => {
    if (selectedPrinterBrand !== form.getValues("printer.brand")) {
      form.setValue("printer.model", "");
    }
  }, [selectedPrinterBrand, form]);

  // Effect to reset type when filament brand changes
  useEffect(() => {
    if (selectedFilamentBrand !== form.getValues("filament.brand")) {
      form.setValue("filament.type", "");
    }
  }, [selectedFilamentBrand, form]);

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger("printer");
      if (isValid) {
        const printerValues = form.getValues("printer");
        if (printerValues) {
          try {
            addPrinter(printerValues as Omit<Printer, "id" | "status" | "timestamp">);
            showSuccess(`Impressora "${printerValues.name}" adicionada com sucesso!`);
            setStep(2);
          } catch (error) {
            showError("Erro ao adicionar impressora. Por favor, tente novamente.");
            console.error("Add printer error:", error);
          }
        }
      }
    } else if (step === 2) {
      const isValid = await form.trigger("filament");
      if (isValid) {
        const filamentValues = form.getValues("filament");
        if (filamentValues) {
          try {
            addFilament({ ...filamentValues, currentWeightGrams: (filamentValues.weight || 1) * 1000 } as NewFilamentData);
            showSuccess(`Filamento "${filamentValues.name || filamentValues.type}" adicionado com sucesso!`);
            if (typeof window !== "undefined") {
              localStorage.setItem("hasVisitedBefore", "true");
            }
            onOpenChange(false);
          } catch (error) {
            showError("Erro ao adicionar filamento. Por favor, tente novamente.");
            console.error("Add filament error:", error);
          }
        }
      }
    }
  };

  const uniquePrinterBrands = Array.from(new Set(predefinedPrinters.map((p) => p.brand))).sort();
  const printerModelsForSelectedBrand = selectedPrinterBrand
    ? predefinedPrinters
        .filter((p) => p.brand === selectedPrinterBrand)
        .map((p) => p.model)
        .sort()
    : [];

  const uniqueFilamentBrands = Array.from(new Set(predefinedFilamentOptions.map((f) => f.brand))).sort();
  const filamentTypesForSelectedBrand = selectedFilamentBrand
    ? Array.from(new Set(predefinedFilamentOptions.filter((f) => f.brand === selectedFilamentBrand).map((f) => f.type))).sort()
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao 3D Print Price Calculator!</DialogTitle>
          <DialogDescription>
            Para começar, por favor adicione uma impressora e um filamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="setup-form" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="grid gap-4 py-4">
            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold">1. Adicionar Impressora</h3>
                <FormField
                  control={form.control}
                  name="printer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Minha Ender 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="printer.brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedPrinterBrand(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniquePrinterBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="printer.model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedPrinterBrand || printerModelsForSelectedBrand.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {printerModelsForSelectedBrand.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="printer.powerConsumptionWatts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumo de Energia (Watts)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="50"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold">2. Adicionar Filamento</h3>
                <FormField
                  control={form.control}
                  name="filament.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="PLA Preto Prusament" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedFilamentBrand(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueFilamentBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedFilamentBrand || filamentTypesForSelectedBrand.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filamentTypesForSelectedBrand.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Preto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.pricePerKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço por Kg (€)</Label>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Compra por Kg (€) (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso da Bobina (kg)</Label>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </form>
        </Form>

        <DialogFooter className="pt-4">
          {step === 1 && (
            <Button type="submit" form="setup-form" className="flex items-center gap-2">
              Adicionar Impressora <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button type="submit" form="setup-form" className="flex items-center gap-2">
              Concluir Configuração <Check className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};