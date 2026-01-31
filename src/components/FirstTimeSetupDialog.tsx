"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments, NewFilamentData } from "@/hooks/use-filaments";
import { useFilamentBrands } from "@/hooks/use-filament-brands";
import { showSuccess, showError } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { predefinedPrinters } from "@/components/AddPrinterDialog";
import { ArrowRight, Check } from "lucide-react";

const printerFieldsSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  powerConsumptionWatts: z.coerce.number().min(0).default(50),
  workingHours: z.coerce.number().min(0).default(0),
});

const filamentFieldsSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço por kg deve ser positivo."),
  purchasePrice: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0.01).default(1),
});

const combinedFormSchema = z.object({
  printer: printerFieldsSchema,
  filament: filamentFieldsSchema,
});

type CombinedSetupFormValues = z.infer<typeof combinedFormSchema>;

interface FirstTimeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FirstTimeSetupDialog = ({ open, onOpenChange }: FirstTimeSetupDialogProps) => {
  const { addPrinter } = usePrinters();
  const { addFilament } = useFilaments();
  const { brands } = useFilamentBrands();
  const [step, setStep] = useState(1);

  const form = useForm<CombinedSetupFormValues>({
    resolver: zodResolver(combinedFormSchema),
    defaultValues: {
      printer: { name: "", brand: "", model: "", powerConsumptionWatts: 50, workingHours: 0 },
      filament: { name: "", brand: "", type: "", color: "", pricePerKg: 0, purchasePrice: 0, weight: 1 },
    },
  });

  const selectedPrinterBrand = form.watch("printer.brand");
  const selectedFilamentBrand = form.watch("filament.brand");

  const printerBrands = useMemo(() => 
    Array.from(new Set(predefinedPrinters.map((p) => p.brand))).sort()
  , []);

  const printerModels = useMemo(() => 
    predefinedPrinters
      .filter((p) => p.brand === selectedPrinterBrand)
      .map((p) => p.model)
      .sort()
  , [selectedPrinterBrand]);

  const filamentBrands = useMemo(() => 
    brands.map(b => b.name)
  , [brands]);

  const filamentTypes = useMemo(() => 
    brands.find(b => b.name === selectedFilamentBrand)?.types || []
  , [selectedFilamentBrand, brands]);

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger("printer");
      if (isValid) {
        try {
          const printerValues = form.getValues("printer");
          addPrinter(printerValues as any);
          showSuccess(`Impressora "${printerValues.name}" adicionada!`);
          setStep(2);
        } catch (error) {
          showError("Erro ao adicionar impressora.");
        }
      }
    } else {
      const isValid = await form.trigger("filament");
      if (isValid) {
        try {
          const filamentValues = form.getValues("filament");
          addFilament({ 
            ...filamentValues, 
            currentWeightGrams: (filamentValues.weight || 1) * 1000 
          } as NewFilamentData);
          showSuccess("Configuração concluída!");
          localStorage.setItem("hasVisitedBefore", "true");
          onOpenChange(false);
        } catch (error) {
          showError("Erro ao adicionar filamento.");
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração Inicial</DialogTitle>
          <DialogDescription>
            Vamos configurar a tua primeira impressora e filamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="setup-form" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4 py-4">
            {step === 1 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. A tua Impressora</h3>
                <FormField
                  control={form.control}
                  name="printer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl><Input placeholder="Ex: Minha P1S" {...field} /></FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {printerBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPrinterBrand}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {printerModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. O teu Filamento</h3>
                <FormField
                  control={form.control}
                  name="filament.brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filamentBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedFilamentBrand}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filamentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filament.pricePerKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço por Kg (€)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>

        <DialogFooter>
          <Button type="submit" form="setup-form" className="w-full gap-2">
            {step === 1 ? (
              <>Próximo <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Concluir <Check className="h-4 w-4" /></>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};