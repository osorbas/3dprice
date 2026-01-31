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
import { ArrowRight, Check, Plus, Separator } from "lucide-react";

const printerFieldsSchema = z.object({
  name: z.string().optional(), // Tornar opcional
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
  const { brands, addBrand, updateBrand } = useFilamentBrands();
  const [step, setStep] = useState(1);

  // Estados para criação de novos itens
  const [isAddingNewBrand, setIsAddingNewBrand] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState("");
  
  const [isAddingNewType, setIsAddingNewType] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");

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

  const filamentBrands = useMemo(() => 
    brands.map(b => b.name).sort()
  , [brands]);

  const filamentTypes = useMemo(() => 
    brands.find(b => b.name === selectedFilamentBrand)?.types.sort() || []
  , [selectedFilamentBrand, brands]);

  const printerModels = useMemo(() => 
    predefinedPrinters
      .filter((p) => p.brand === selectedPrinterBrand)
      .map((p) => p.model)
      .sort()
  , [selectedPrinterBrand]);

  const handleCreateBrand = () => {
    if (!newBrandName.trim()) return;
    const trimmedName = newBrandName.trim();
    addBrand(trimmedName);
    form.setValue("filament.brand", trimmedName);
    form.setValue("filament.type", "");
    setNewBrandName("");
    setIsAddingNewBrand(false);
    showSuccess(`Marca "${trimmedName}" criada!`);
  };

  const handleCreateType = () => {
    if (!newTypeName.trim() || !selectedFilamentBrand) return;
    const trimmedType = newTypeName.trim();
    const currentBrandConfig = brands.find(b => b.name === selectedFilamentBrand);
    if (currentBrandConfig) {
      const updatedTypes = [...currentBrandConfig.types, trimmedType];
      updateBrand(selectedFilamentBrand, selectedFilamentBrand, updatedTypes);
      form.setValue("filament.type", trimmedType);
      setNewTypeName("");
      setIsAddingNewType(false);
      showSuccess(`Tipo "${trimmedType}" adicionado à marca ${selectedFilamentBrand}!`);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      // Validar apenas os campos obrigatórios (marca e modelo)
      const isValid = await form.trigger(["printer.brand", "printer.model"]);
      if (isValid) {
        try {
          const printerValues = form.getValues("printer");
          
          // Gerar nome se estiver vazio
          const finalName = printerValues.name && printerValues.name.trim() !== "" 
            ? printerValues.name 
            : `${printerValues.brand} ${printerValues.model}`;

          addPrinter({ ...printerValues, name: finalName } as any);
          showSuccess(`Impressora "${finalName}" adicionada!`);
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

  const renderFilamentForm = () => {
    if (isAddingNewBrand) {
      return (
        <div className="space-y-4 py-4 border rounded-lg p-4 bg-primary/5">
          <h4 className="font-semibold text-sm">Nova Marca Personalizada</h4>
          <div className="flex gap-2">
            <Input 
              placeholder="Nome da Marca" 
              value={newBrandName} 
              onChange={(e) => setNewBrandName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBrand()}
            />
            <Button onClick={handleCreateBrand} size="sm">Criar</Button>
            <Button onClick={() => setIsAddingNewBrand(false)} variant="ghost" size="sm">Cancelar</Button>
          </div>
        </div>
      );
    }

    if (isAddingNewType) {
      return (
        <div className="space-y-4 py-4 border rounded-lg p-4 bg-primary/5">
          <h4 className="font-semibold text-sm">Novo Tipo para {selectedFilamentBrand}</h4>
          <div className="flex gap-2">
            <Input 
              placeholder="Ex: PLA-CF, PETG-HS" 
              value={newTypeName} 
              onChange={(e) => setNewTypeName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateType()}
            />
            <Button onClick={handleCreateType} size="sm">Adicionar</Button>
            <Button onClick={() => setIsAddingNewType(false)} variant="ghost" size="sm">Cancelar</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">2. O teu Filamento</h3>
        <FormField
          control={form.control}
          name="filament.brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca *</FormLabel>
              <Select 
                onValueChange={(v) => { 
                  if (v === "NEW_BRAND") {
                    setIsAddingNewBrand(true);
                  } else {
                    field.onChange(v); 
                    form.setValue("filament.type", ""); // Reset tipo ao mudar marca
                  }
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filamentBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  <Separator className="my-1" />
                  <SelectItem value="NEW_BRAND" className="text-primary font-medium">
                    <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Adicionar nova...</span>
                  </SelectItem>
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
              <FormLabel>Tipo *</FormLabel>
              <Select 
                onValueChange={(v) => {
                  if (v === "NEW_TYPE") {
                    setIsAddingNewType(true);
                  } else {
                    field.onChange(v);
                  }
                }} 
                value={field.value} 
                disabled={!selectedFilamentBrand}
              >
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filamentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  {selectedFilamentBrand && (
                    <>
                      <Separator className="my-1" />
                      <SelectItem value="NEW_TYPE" className="text-primary font-medium">
                        <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Adicionar novo...</span>
                      </SelectItem>
                    </>
                  )}
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
              <FormLabel>Preço por Kg (€) *</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
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
                  name="printer.brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.setValue("printer.model", ""); }} value={field.value}>
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
                      <FormLabel>Modelo *</FormLabel>
                      <Select 
                        onValueChange={(v) => { 
                          field.onChange(v); 
                          const preset = predefinedPrinters.find(p => p.model === v && p.brand === selectedPrinterBrand);
                          if (preset) {
                            form.setValue("printer.powerConsumptionWatts", preset.powerConsumptionWatts);
                          }
                        }} 
                        value={field.value} 
                        disabled={!selectedPrinterBrand}
                      >
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
                <FormField
                  control={form.control}
                  name="printer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome (Opcional)</FormLabel>
                      <FormControl><Input placeholder="Ex: Minha P1S" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              renderFilamentForm()
            )}
          </form>
        </Form>

        <DialogFooter>
          <Button 
            type="submit" 
            form="setup-form" 
            className="w-full gap-2"
            disabled={isAddingNewBrand || isAddingNewType}
          >
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