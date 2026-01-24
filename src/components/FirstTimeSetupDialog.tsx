"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePrinters, Printer } from "@/hooks/use-printers";
import { useFilaments, NewFilamentData } from "@/hooks/use-filaments";
import { showSuccess, showError } from "@/utils/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predefinedPrinters } from "@/components/AddPrinterDialog";
import { predefinedFilamentOptions } from "@/components/AddFilamentDialog";
import { ArrowRight, Check } from "lucide-react";

// Reusing form schemas from existing dialogs
const printerFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  powerConsumptionWatts: z.coerce.number().min(0, "O consumo de energia não pode ser negativo.").default(50),
  workingHours: z.coerce.number().min(0, "As horas de trabalho não podem ser negativas.").default(0),
});

const filamentFormSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço por kg deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(),
  weight: z.coerce.number().min(0.01, "O peso deve ser positivo."),
});

// Explicitly define the types for the forms
type FirstTimePrinterFormValues = z.infer<typeof printerFormSchema>;
type FirstTimeFilamentFormValues = z.infer<typeof filamentFormSchema>;

interface FirstTimeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FirstTimeSetupDialog = ({ open, onOpenChange }: FirstTimeSetupDialogProps) => {
  const { addPrinter } = usePrinters();
  const { addFilament } = useFilaments();
  const [step, setStep] = useState(1); // 1: Add Printer, 2: Add Filament

  const printerForm = useForm<FirstTimePrinterFormValues>({
    resolver: zodResolver(printerFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      powerConsumptionWatts: 50,
      workingHours: 0,
    },
  });

  const filamentForm = useForm<FirstTimeFilamentFormValues>({
    resolver: zodResolver(filamentFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      type: "",
      color: "",
      pricePerKg: 0,
      purchasePrice: 0,
      weight: 1,
    },
  });

  const [selectedPrinterBrand, setSelectedPrinterBrand] = useState<string | undefined>(undefined);
  const [selectedFilamentBrand, setSelectedFilamentBrand] = useState<string | undefined>(undefined);

  // Effect to reset model when printer brand changes
  useEffect(() => {
    if (selectedPrinterBrand !== printerForm.getValues("brand")) {
      printerForm.setValue("model", "");
    }
  }, [selectedPrinterBrand, printerForm]);

  // Effect to reset type when filament brand changes
  useEffect(() => {
    if (selectedFilamentBrand !== filamentForm.getValues("brand")) {
      filamentForm.setValue("type", "");
    }
  }, [selectedFilamentBrand, filamentForm]);

  const handleAddPrinter = (values: FirstTimePrinterFormValues) => {
    try {
      addPrinter(values as Omit<Printer, "id" | "status" | "timestamp">);
      showSuccess(`Impressora "${values.name}" adicionada com sucesso!`);
      setStep(2); // Move to next step
    } catch (error) {
      showError("Erro ao adicionar impressora. Por favor, tente novamente.");
      console.error("Add printer error:", error);
    }
  };

  const handleAddFilament = (values: FirstTimeFilamentFormValues) => {
    try {
      addFilament({ ...values, currentWeightGrams: values.weight * 1000 } as NewFilamentData);
      showSuccess(`Filamento "${values.name || values.type}" adicionado com sucesso!`);
      if (typeof window !== "undefined") {
        localStorage.setItem("hasVisitedBefore", "true");
      }
      onOpenChange(false); // Close dialog
    } catch (error) {
      showError("Erro ao adicionar filamento. Por favor, tente novamente.");
      console.error("Add filament error:", error);
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

        {step === 1 && (
          <Form {...printerForm}>
            <form id="printer-form" onSubmit={printerForm.handleSubmit(handleAddPrinter)} className="grid gap-4 py-4">
              <h3 className="text-lg font-semibold">1. Adicionar Impressora</h3>
              <FormField
                control={printerForm.control}
                name="name"
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
                control={printerForm.control}
                name="brand"
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
                control={printerForm.control}
                name="model"
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
                control={printerForm.control}
                name="powerConsumptionWatts"
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
            </form>
          </Form>
        )}

        {step === 2 && (
          <Form {...filamentForm}>
            <form id="filament-form" onSubmit={filamentForm.handleSubmit(handleAddFilament)} className="grid gap-4 py-4">
              <h3 className="text-lg font-semibold">2. Adicionar Filamento</h3>
              <FormField
                control={filamentForm.control}
                name="name"
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
                control={filamentForm.control}
                name="brand"
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
                control={filamentForm.control}
                name="type"
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
                control={filamentForm.control}
                name="color"
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
                control={filamentForm.control}
                name="pricePerKg"
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
                control={filamentForm.control}
                name="purchasePrice" // Novo campo
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
                        value={field.value === 0 ? "" : field.value} // Exibe vazio se for 0
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
                control={filamentForm.control}
                name="weight"
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
            </form>
          </Form>
        )}

        <DialogFooter className="pt-4">
          {step === 1 && (
            <Button type="submit" form="printer-form" className="flex items-center gap-2">
              Adicionar Impressora <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button type="submit" form="filament-form" className="flex items-center gap-2">
              Concluir Configuração <Check className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>